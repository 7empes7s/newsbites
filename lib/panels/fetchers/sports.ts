const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

// Tag → competition code mapping
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

function getHeaders() {
  return {
    // TODO: add FOOTBALL_DATA_API_KEY to .env.local
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '',
  };

}

export async function fetchStandings(competitionCode: string) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/standings`,
    { headers: getHeaders(), next: { revalidate: 300 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchUpcomingFixtures(competitionCode: string) {
  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${competitionCode}/matches?status=SCHEDULED&limit=10`,
    { headers: getHeaders(), next: { revalidate: 3600 } }
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

export async function fetchKnockoutMatches(competitionCode: string, stage?: string) {
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
  return results;
}

export async function fetchTheSportsDBStandings(leagueId: string, season?: string) {
  const url = `${THESPORTSDB_BASE}/lookuptable.php?l=${leagueId}${season ? `&s=${season}` : ''}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json();
}
