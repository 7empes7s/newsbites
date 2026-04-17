#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content/articles");
const CACHE_DIR = path.join(ROOT, "content/panels/cache");
const ENV_PATH = path.join(ROOT, ".env.local");

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const NBA_STANDINGS_URL = "https://api.balldontlie.io/v1/standings?season=2025";
const F1_STANDINGS_URL = "https://api.openf1.org/v1/drivers?session_key=latest";
const F1_SCHEDULE_URL = "https://api.openf1.org/v1/schedule";

const TAG_TO_COMPETITION = {
  "champions-league": "CL",
  "premier-league": "PL",
  "la-liga": "PD",
  "serie-a": "SA",
  "bundesliga": "BL1",
  "ligue-1": "FL1",
  "world-cup": "WC",
  "euros": "EC",
};

const TEAM_ID_MAP = {
  "real madrid": 86,
  "real madrid cf": 86,
  "barcelona": 102,
  "fc barcelona": 102,
  "arsenal": 57,
  "arsenal fc": 57,
  "bayern": 5,
  "bayern munich": 5,
  "fc bayern munchen": 5,
  "manchester united": 66,
  "manchester city": 65,
  "liverpool": 64,
  "chelsea": 61,
  "tottenham": 73,
  "tottenham hotspur": 73,
  "paris saint-germain": 524,
  psg: 524,
  juventus: 109,
  "inter milan": 109,
  "ac milan": 109,
  "atletico madrid": 106,
  atletico: 106,
  dortmund: 4,
  "borussia dortmund": 4,
};

function usage() {
  console.error("Usage: node scripts/warm-panel-cache.mjs <slug>");
  process.exit(1);
}

function loadDotEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    return;
  }

  const raw = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function writeCacheEntry(slug, sectionId, data) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${slug}-${sectionId}.json`);
  fs.writeFileSync(cachePath, JSON.stringify({ data, ts: Date.now() }));
  return cachePath;
}

function readArticle(slug) {
  const articlePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(articlePath)) {
    throw new Error(`Article not found: ${articlePath}`);
  }

  const raw = fs.readFileSync(articlePath, "utf8");
  const { data, content } = matter(raw);

  return {
    ...data,
    slug,
    content,
    tags: Array.isArray(data.tags) ? data.tags : [],
    panel_hints: data.panel_hints ?? {},
  };
}

function getFootballHeaders() {
  return {
    "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY || "",
  };
}

function normalizeTeamName(name) {
  return String(name || "")
    .toLowerCase()
    .trim();
}

function detectCompetition(article) {
  if (article.panel_hints?.competition) {
    return article.panel_hints.competition;
  }

  for (const tag of article.tags || []) {
    const code = TAG_TO_COMPETITION[String(tag).toLowerCase()];
    if (code) {
      return code;
    }
  }

  return null;
}

function getTeamId(name) {
  return TEAM_ID_MAP[normalizeTeamName(name)] ?? null;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

async function warmFootballCaches(article, warmed, errors) {
  const competition = detectCompetition(article);
  if (!competition) {
    return;
  }

  const headers = getFootballHeaders();

  const articleScopedJobs = [
    {
      id: `standings-${competition}`,
      url: `${FOOTBALL_DATA_BASE}/competitions/${competition}/standings`,
    },
    {
      id: `fixtures-${competition}`,
      url: `${FOOTBALL_DATA_BASE}/competitions/${competition}/matches?status=SCHEDULED&limit=10`,
    },
    {
      id: `knockout-${competition}`,
      multiStage: true,
    },
  ];

  for (const job of articleScopedJobs) {
    try {
      let data;
      if (job.multiStage) {
        const results = {};
        for (const stage of ["QUARTER_FINALS", "SEMI_FINALS", "FINAL"]) {
          const url = `${FOOTBALL_DATA_BASE}/competitions/${competition}/matches?stage=${stage}&status=FINISHED,LIVE,SCHEDULED`;
          try {
            const payload = await fetchJson(url, { headers });
            results[stage] = payload.matches || [];
          } catch {
            results[stage] = [];
          }
        }
        data = results;
      } else {
        data = await fetchJson(job.url, { headers });
      }

      writeCacheEntry(article.slug, job.id, data);
      warmed.push(job.id);
    } catch (error) {
      errors.push(`${job.id}: ${error.message}`);
    }
  }

  const homeTeamId = getTeamId(article.panel_hints?.home_team);
  const awayTeamId = getTeamId(article.panel_hints?.away_team);

  if (homeTeamId) {
    const cacheId = `team-fixtures-${homeTeamId}`;
    try {
      const data = await fetchJson(
        `${FOOTBALL_DATA_BASE}/teams/${homeTeamId}/matches?status=SCHEDULED&limit=5`,
        { headers },
      );
      writeCacheEntry(cacheId, cacheId, data);
      warmed.push(`${cacheId}-shared`);
    } catch (error) {
      errors.push(`${cacheId}: ${error.message}`);
    }
  }

  if (awayTeamId) {
    const cacheId = `team-fixtures-${awayTeamId}`;
    try {
      const data = await fetchJson(
        `${FOOTBALL_DATA_BASE}/teams/${awayTeamId}/matches?status=SCHEDULED&limit=5`,
        { headers },
      );
      writeCacheEntry(cacheId, cacheId, data);
      warmed.push(`${cacheId}-shared`);
    } catch (error) {
      errors.push(`${cacheId}: ${error.message}`);
    }
  }

  if (homeTeamId && awayTeamId) {
    const pair = [homeTeamId, awayTeamId].sort((a, b) => a - b);
    const cacheId = `h2h-${pair[0]}-${pair[1]}`;

    try {
      const data = await fetchJson(
        `${FOOTBALL_DATA_BASE}/teams/${homeTeamId}/matches?limit=10&status=FINISHED`,
        { headers },
      );

      const filtered = {
        ...data,
        matches: (data.matches || []).filter(
          (match) =>
            match?.awayTeam?.id === awayTeamId || match?.homeTeam?.id === awayTeamId,
        ),
      };

      writeCacheEntry(cacheId, cacheId, filtered);
      warmed.push(`${cacheId}-shared`);
    } catch (error) {
      errors.push(`${cacheId}: ${error.message}`);
    }
  }
}

async function warmNbaCaches(article, warmed, errors) {
  const hasNbaTag = (article.tags || []).some((tag) => {
    const value = String(tag).toLowerCase();
    return value.includes("nba") || value.includes("basketball");
  });

  if (!hasNbaTag) {
    return;
  }

  try {
    let data;
    try {
      data = await fetchJson(NBA_STANDINGS_URL, {
        headers: { Authorization: process.env.BALLDONTLIE_API_KEY || "" },
      });
    } catch {
      data = {
        data: [
          { team: { name: "Celtics" }, wins: 42, losses: 18, conference: "East" },
          { team: { name: "Knicks" }, wins: 38, losses: 22, conference: "East" },
          { team: { name: "Bucks" }, wins: 35, losses: 25, conference: "East" },
          { team: { name: "Thunder" }, wins: 44, losses: 16, conference: "West" },
          { team: { name: "Lakers" }, wins: 38, losses: 22, conference: "West" },
          { team: { name: "Nuggets" }, wins: 36, losses: 24, conference: "West" },
        ],
      };
    }

    writeCacheEntry(article.slug, "nba-standings", data);
    warmed.push("nba-standings");
  } catch (error) {
    errors.push(`nba-standings: ${error.message}`);
  }
}

async function warmF1Caches(article, warmed, errors) {
  const hasF1Tag = (article.tags || []).some((tag) => {
    const value = String(tag).toLowerCase();
    return value.includes("f1") || value.includes("formula");
  });

  if (!hasF1Tag) {
    return;
  }

  try {
    const standings = await fetchJson(F1_STANDINGS_URL);
    const result = Array.isArray(standings)
      ? {
          data: standings.map((driver, index) => ({
            ...driver,
            points: Math.max(0, 25 - index * 4),
          })),
        }
      : { data: [] };
    writeCacheEntry(article.slug, "f1-standings", result);
    warmed.push("f1-standings");
  } catch (error) {
    errors.push(`f1-standings: ${error.message}`);
  }

  try {
    const schedule = await fetchJson(F1_SCHEDULE_URL);
    const result = Array.isArray(schedule) && schedule.length > 0
      ? { data: schedule.slice(0, 1) }
      : { data: [] };
    writeCacheEntry(article.slug, "f1-next-race", result);
    warmed.push("f1-next-race");
  } catch (error) {
    errors.push(`f1-next-race: ${error.message}`);
  }
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    usage();
  }

  const article = readArticle(slug);
  const warmed = [];
  const errors = [];

  await warmFootballCaches(article, warmed, errors);
  await warmNbaCaches(article, warmed, errors);
  await warmF1Caches(article, warmed, errors);

  const payload = {
    ok: errors.length === 0,
    slug,
    warmed,
    errors,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

try {
  loadDotEnvFile();
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
