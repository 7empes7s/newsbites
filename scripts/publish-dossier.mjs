#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content/articles");

function usage() {
  console.error("Usage: node scripts/publish-dossier.mjs <absolute-dossier-path> [--status=published]");
  process.exit(2);
}

function parseArgs(argv) {
  const dossierPath = argv[2];
  if (!dossierPath) usage();

  const statusFlag = argv.find((arg) => arg.startsWith("--status="));

  return {
    dossierPath,
    status: statusFlag ? statusFlag.split("=")[1] : "published",
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeVertical(vertical) {
  return String(vertical || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeHintList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePanelHints(content) {
  const match = content.match(/PANEL_HINTS:\s*([\s\S]+?)(?:\n---|\n\n|$)/);
  if (!match) return null;

  const hints = {};
  const lines = match[1].trim().split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split(':');
    if (!key || !rest.length) continue;
    const value = rest.join(':').trim();
    if (!value || value === 'omit') continue;

    const k = key.trim();
    if (k === 'teams') hints.teams = normalizeHintList(value);
    else if (k === 'tickers') hints.tickers = normalizeHintList(value);
    else if (k === 'country_codes') hints.country_codes = normalizeHintList(value);
    else if (k === 'github_repos') hints.github_repos = normalizeHintList(value);
    else if (k === 'competition' || k === 'nasa_mission') hints[k] = value;
  }
  return Object.keys(hints).length > 0 ? hints : null;
}

function stripPanelHints(content) {
  return content.replace(/PANEL_HINTS:\s*[\s\S]+?(?=\n---|\n\n|$)/, '').trim();
}

function formatYamlScalar(value) {
  return JSON.stringify(String(value ?? ""));
}

function pushYamlValue(lines, key, value, indent = "  ") {
  if (Array.isArray(value)) {
    if (value.length === 0) return;
    lines.push(`${indent}${key}:`);
    for (const item of value) {
      lines.push(`${indent}  - ${formatYamlScalar(item)}`);
    }
    return;
  }

  if (value === undefined || value === null || value === "") {
    return;
  }

  lines.push(`${indent}${key}: ${formatYamlScalar(value)}`);
}

function buildArticleFrontmatter(frontmatter, status, panelHints) {
  const tags = normalizeTags(frontmatter.tags);
  const article = {
    title: String(frontmatter.title || "").trim(),
    slug: String(frontmatter.slug || "").trim(),
    date: String(frontmatter.date || "").trim(),
    vertical: normalizeVertical(frontmatter.vertical),
    tags,
    status,
    lead: String(frontmatter.lead || "").trim(),
    digest: String(frontmatter.digest || "").trim(),
    coverImage: String(frontmatter.coverImage || ""),
    author: String(frontmatter.author || "NewsBites Desk").trim(),
  };

  if (panelHints) {
    article.panel_hints = panelHints;
  }

  assert(article.title, "publish.md frontmatter is missing `title`");
  assert(article.slug, "publish.md frontmatter is missing `slug`");
  assert(article.date, "publish.md frontmatter is missing `date`");
  assert(article.vertical, "publish.md frontmatter is missing `vertical`");
  assert(article.tags.length > 0, "publish.md frontmatter is missing `tags`");
  assert(article.lead, "publish.md frontmatter is missing `lead`");

  return article;
}

function toMarkdown(frontmatter, body) {
  const tagsBlock = frontmatter.tags.map((tag) => `  - ${JSON.stringify(tag)}`).join("\n");
  const lines = [
    "---",
    `title: ${JSON.stringify(frontmatter.title)}`,
    `slug: ${JSON.stringify(frontmatter.slug)}`,
    `date: ${JSON.stringify(frontmatter.date)}`,
    `vertical: ${JSON.stringify(frontmatter.vertical)}`,
    "tags:",
    tagsBlock,
    `status: ${JSON.stringify(frontmatter.status)}`,
    `lead: ${JSON.stringify(frontmatter.lead)}`,
  ];
  
  if (frontmatter.digest) {
    lines.push(`digest: ${JSON.stringify(frontmatter.digest)}`);
  }
  if (frontmatter.panel_hints) {
    lines.push("panel_hints:");
    pushYamlValue(lines, "competition", frontmatter.panel_hints.competition);
    pushYamlValue(lines, "teams", frontmatter.panel_hints.teams);
    pushYamlValue(lines, "tickers", frontmatter.panel_hints.tickers);
    pushYamlValue(lines, "country_codes", frontmatter.panel_hints.country_codes);
    pushYamlValue(lines, "github_repos", frontmatter.panel_hints.github_repos);
    pushYamlValue(lines, "nasa_mission", frontmatter.panel_hints.nasa_mission);
  }
  lines.push(
    `coverImage: ${JSON.stringify(frontmatter.coverImage)}`,
    `author: ${JSON.stringify(frontmatter.author)}`,
    "---",
    "",
    body.trim(),
    ""
  );
  
  return lines.filter(Boolean).join("\n");
}

function main() {
  const { dossierPath, status } = parseArgs(process.argv);
  assert(path.isAbsolute(dossierPath), "dossier path must be absolute");

  const publishPath = path.join(dossierPath, "publish.md");
  const draftPath = path.join(dossierPath, "draft.md");
  assert(fs.existsSync(publishPath), `publish.md not found at ${publishPath}`);

  const fileContents = fs.readFileSync(publishPath, "utf8");
  const { data, content } = matter(fileContents);
  assert(content.trim(), "publish.md body is empty");

  const draftContents = fs.existsSync(draftPath) ? fs.readFileSync(draftPath, "utf8") : "";
  const panelHints = parsePanelHints(content) ?? parsePanelHints(draftContents);
  const cleanContent = stripPanelHints(content);

  const article = buildArticleFrontmatter(data, status, panelHints);
  const outputPath = path.join(ARTICLES_DIR, `${article.slug}.md`);
  const output = toMarkdown(article, cleanContent);

  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  fs.writeFileSync(outputPath, output, "utf8");

  try {
    execSync(`node scripts/warm-panel-cache.mjs ${article.slug}`, { stdio: 'inherit', cwd: ROOT });
  } catch (err) {
    console.error('Warning: panel cache warming failed:', err.message);
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        outputPath,
        slug: article.slug,
        status: article.status,
        panelHintsFound: !!panelHints,
      },
      null,
      2,
    ) + "\n",
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
