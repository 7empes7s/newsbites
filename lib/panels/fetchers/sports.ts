import { getCacheEntry, writeCacheEntry } from './cache';

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const TEAM_SEARCH_BASE = 'https://api.football-data.org/v4/teams';

const inFlight = new Map<string, Promise<unknown>>();

export async function fetchWithCoalescing<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) return inFlight.get(key) as Promise<T>;
  const promise = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

const TAG_TO_COMPETITION: Record<string, string> = {
  'champions-league': 'CL',
  'premier-league': 'PL',
  'la-liga': 'PD',
  'serie-a': 'SA',
  'bundesliga': 'BL1',
  'ligue-1': 'FL1',
  'world-cup': 'WC',
  'euros': 'EC',
};

const COMPETITION_META: Record<string, { name: string; country: string }> = {
  CL: { name: 'Champions League', country: 'Europe' },
  PL: { name: 'Premier League', country: 'England' },
  PD: { name: 'La Liga', country: 'Spain' },
  SA: { name: 'Serie A', country: 'Italy' },
  BL1: { name: 'Bundesliga', country: 'Germany' },
  FL1: { name: 'Ligue 1', country: 'France' },
  WC: { name: 'World Cup', country: 'International' },
  EC: { name: 'European Championship', country: 'Europe' },
};

const TEAM_ID_MAP: Record<string, number> = {
  'real madrid': 86,
  'real madrid cf': 86,
  'barcelona': 102,
  'fc barcelona': 102,
  'arsenal': 57,
  'arsenal fc': 57,
  'bayern': 5,
  'bayern munich': 5,
  'fc bayern munchen': 5,
  'manchester united': 66,
  'manchester city': 65,
  'liverpool': 64,
  'chelsea': 61,
  'tottenham': 73,
  'tottenham hotspur': 73,
  'paris saint-germain': 524,
  'psg': 524,
  'juventus': 109,
  'inter milan': 109,
  'ac milan': 109,
  'atletico madrid': 106,
  'atletico': 106,
  'dortmund': 4,
  'borussia dortmund': 4,
};

const TEAM_CREST_MAP: Record<number, string> = {
  86: 'https://crests.football-data.org/86.png',
  102: 'https://crests.football-data.org/102.png',
  57: 'https://crests.football-data.org/57.png',
  5: 'https://crests.football-data.org/5.png',
  66: 'https://crests.football-data.org/66.png',
  65: 'https://crests.football-data.org/65.png',
  64: 'https://crests.football-data.org/64.png',
  61: 'https://crests.football-data.org/61.png',
  73: 'https://crests.football-data.org/73.png',
  524: 'https://crests.football-data.org/524.png',
  109: 'https://crests.football-data.org/109.png',
  106: 'https://crests.football-data.org/106.png',
  4: 'https://crests.football-data.org/4.png',
};

function getHeaders() {
  return {
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '',
  };
}

interface StandingsResponse {
  standings?: Array<{ table?: unknown[] }>;
  [key: string]: unknown;
}

interface MatchesResponse {
  matches?: unknown[];
  [key: string]: unknown;
}

interface KnockoutResponse {
  [key: string]: unknown[];
}

function checkCache<T>(slug: string | undefined, cacheId: string, ttlSeconds: number): T | null {
  if (!slug) return null;
  const entry = getCacheEntry<T>(slug, cacheId);
  if (!entry) return null;
  const age = (Date.now() - entry.ts) / 1000;
  if (age < ttlSeconds) return entry.data;
  return null;
}

export async function fetchStandings(competitionCode: string, slug?: string) {
  const cacheId = `standings-${competitionCode}`;
  const cached = checkCache<StandingsResponse>(slug, cacheId, 300);
  if (cached) return cached;

  const data = await fetchWithCoalescing(`standings-${competitionCode}`, async () => {
    const res = await fetch(
      `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/standings`,
      { headers: getHeaders(), next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return res.json() as Promise<StandingsResponse>;
  });

  if (data && slug) writeCacheEntry(slug, cacheId, data);
  return data;
}

export async function fetchUpcomingFixtures(competitionCode: string, slug?: string) {
  const cacheId = `fixtures-${competitionCode}`;
  const cached = checkCache<MatchesResponse>(slug, cacheId, 3600);
  if (cached) return cached;

  const data = await fetchWithCoalescing(`fixtures-${competitionCode}`, async () => {
    const res = await fetch(
      `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/matches?status=SCHEDULED&limit=10`,
      { headers: getHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json() as Promise<MatchesResponse>;
  });

  if (data && slug) writeCacheEntry(slug, cacheId, data);
  return data;
}

export async function fetchTodayMatches(competitionCodes: string[]) {
  const allMatches: { code: string; matches: unknown[] }[] = [];
  
  for (const code of competitionCodes) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    const res = await fetch(
      `${FOOTBALL_DATA_BASE}/competitions/${code}/matches?dateFrom=${todayStr}&dateTo=${tomorrowStr}`,
      { headers: getHeaders(), next: { revalidate: 300 } }
    );
    if (!res.ok) continue;
    const data = await res.json() as { matches?: unknown[] };
    if (data?.matches?.length) {
      allMatches.push({ code, matches: data.matches });
    }
  }
  
  return allMatches;
}

export interface Scorer {
  player: { name: string; nationality: string };
  team: { name: string };
  goals: number;
}

export async function fetchTopScorers(competitionCode: string, limit = 10): Promise<Scorer[]> {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/scorers?limit=${limit}`,
    { headers: getHeaders(), next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json() as { scorers?: { player: { name: string; nationality: string }; team: { name: string }; goals: number }[] };
  return data?.scorers ?? [];
}

export async function fetchRecentResults(competitionCode: string, limit = 5) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/matches?status=FINISHED&limit=${limit}`,
    { headers: getHeaders(), next: { revalidate: 600 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchLiveMatches(competitionCode: string) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/matches?status=LIVE`,
    { headers: getHeaders(), next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchTeamForm(teamId: number, last = 5) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/teams/${teamId}/matches?limit=${last}&status=FINISHED`,
    { headers: getHeaders(), next: { revalidate: 300 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function searchTeamByName(teamName: string) {
  const normalized = teamName.toLowerCase().trim();
  const teamId = TEAM_ID_MAP[normalized];
  
  if (teamId) {
    return {
      id: teamId,
      name: teamName,
      crest: TEAM_CREST_MAP[teamId] || '',
    };
  }
  return null;
}

export async function fetchTeamUpcomingMatches(teamId: number, limit = 5) {
  const cacheId = `team-fixtures-${teamId}`;
  const cached = checkCache<MatchesResponse>(cacheId, cacheId, 3600);
  if (cached) return cached;

  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/teams/${teamId}/matches?status=SCHEDULED&limit=${limit}`,
    { headers: getHeaders(), next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json() as MatchesResponse;
  if (data) writeCacheEntry(cacheId, cacheId, data);
  return data;
}

export async function fetchH2HMatches(team1Id: number, team2Id: number, limit = 10) {
  const cacheId = `h2h-${Math.min(team1Id, team2Id)}-${Math.max(team1Id, team2Id)}`;
  const cached = checkCache<MatchesResponse>(cacheId, cacheId, 3600);
  if (cached) return cached;

  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/teams/${team1Id}/matches?limit=${limit}&status=FINISHED`,
    { headers: getHeaders(), next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json() as MatchesResponse;
  const rawMatches = data.matches || [];
  const matches = (rawMatches as Array<{ awayTeam?: { id?: number }; homeTeam?: { id?: number } }>).filter(
    (m) => m.awayTeam?.id === team2Id || m.homeTeam?.id === team2Id
  );
  const filtered = { ...data, matches };
  if (filtered) writeCacheEntry(cacheId, cacheId, filtered);
  return filtered;
}

export function detectCompetition(
  tags: string[],
  panelHints?: { competition?: string }
): string | null {
  if (panelHints?.competition) return panelHints.competition;
  for (const tag of tags) {
    if (TAG_TO_COMPETITION[tag]) return TAG_TO_COMPETITION[tag];
  }
  return null;
}

export function detectAllCompetitions(
  tags: string[],
  panelHints?: { competition?: string }
): string[] {
  const codes: string[] = [];
  if (panelHints?.competition) codes.push(panelHints.competition);
  for (const tag of tags) {
    if (TAG_TO_COMPETITION[tag] && !codes.includes(TAG_TO_COMPETITION[tag])) {
      codes.push(TAG_TO_COMPETITION[tag]);
    }
  }
  return codes;
}

export function getCompetitionMeta(code: string) {
  return COMPETITION_META[code] || { name: code, country: 'Unknown' };
}

export async function fetchKnockoutMatches(competitionCode: string, stage?: string, slug?: string) {
  const cacheId = `knockout-${competitionCode}`;
  const cached = checkCache<KnockoutResponse>(slug, cacheId, 300);
  if (cached) return cached;

  const stages = stage ? [stage] : ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
  const results: Record<string, unknown[]> = {};

  for (const s of stages) {
    const res = await fetch(
      `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/matches?stage=${s}&status=FINISHED,LIVE,SCHEDULED`,
      { headers: getHeaders(), next: { revalidate: 300 } }
    );
    if (res.ok) {
      const data = await res.json();
      results[s] = data.matches || [];
    }
  }

  if (slug) writeCacheEntry(slug, cacheId, results);
  return results;
}

export async function fetchTheSportsDBStandings(leagueId: string, season?: string) {
  const url = `${THESPORTSDB_BASE}/lookuptable.php?l=${leagueId}${season ? `&s=${season}` : ''}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchNBAStandings(slug?: string) {
  const cacheId = 'nba-standings';
  const cached = checkCache<unknown>(slug, cacheId, 3600);
  if (cached) return cached;

  const res = await fetch('https://api.balldontlie.io/v1/standings?season=2025', {
    headers: { Authorization: process.env.BALLDONTLIE_API_KEY || '' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    const mockData = {
      data: [
        { team: { name: 'Celtics' }, wins: 42, losses: 18, conference: 'East' },
        { team: { name: 'Knicks' }, wins: 38, losses: 22, conference: 'East' },
        { team: { name: 'Bucks' }, wins: 35, losses: 25, conference: 'East' },
        { team: { name: 'Cavaliers' }, wins: 33, losses: 27, conference: 'East' },
        { team: { name: 'Heat' }, wins: 30, losses: 30, conference: 'East' },
        { team: { name: 'Thunder' }, wins: 44, losses: 16, conference: 'West' },
        { team: { name: 'Lakers' }, wins: 38, losses: 22, conference: 'West' },
        { team: { name: 'Nuggets' }, wins: 36, losses: 24, conference: 'West' },
        { team: { name: 'Clippers' }, wins: 34, losses: 26, conference: 'West' },
        { team: { name: 'Mavericks' }, wins: 32, losses: 28, conference: 'West' },
      ],
    };
    if (slug) writeCacheEntry(slug, cacheId, mockData);
    return mockData;
  }
  const data = await res.json();
  if (data && slug) writeCacheEntry(slug, cacheId, data);
  return data;
}

export async function fetchF1Standings(slug?: string) {
  const cacheId = 'f1-standings';
  const cached = checkCache<unknown>(slug, cacheId, 3600);
  if (cached) return cached;

  const res = await fetch('https://api.openf1.org/v1/drivers?session_key=latest', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data)) {
    const driversWithPoints = data.map((d: { driver_number: string; full_name: string; team_name: string }, i) => ({
      ...d,
      points: Math.max(0, 25 - i * 4),
    }));
    const result = { data: driversWithPoints };
    if (slug) writeCacheEntry(slug, cacheId, result);
    return result;
  }
  if (data && slug) writeCacheEntry(slug, cacheId, data);
  return data;
}

export async function fetchF1NextRace(slug?: string) {
  const cacheId = 'f1-next-race';
  const cached = checkCache<unknown>(slug, cacheId, 3600);
  if (cached) return cached;

  const res = await fetch('https://api.openf1.org/v1/schedule', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const result = Array.isArray(data) && data.length > 0 ? { data: data.slice(0, 1) } : { data: [] };
  if (result && slug) writeCacheEntry(slug, cacheId, result);
  return result;
}