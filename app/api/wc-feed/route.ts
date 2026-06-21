import { getAllArticles, type Article } from "@/lib/articles";

// Read-only JSON feed of World Cup 2026 articles for GaffrPro to consume.
// Additive endpoint: it does not change any existing page, content, or behaviour.
// GaffrPro fetches this (server-side, cached) to render article rails and to
// surface a followed player's / team's articles first. Public content, so it is
// CORS-open and cached at the edge.

const BASE = "https://news.techinsiderbytes.com";

// Detect a World Cup article from its tags / panel competition hint.
function isWorldCup(a: Article): boolean {
  const comp = a.panel_hints?.competition ?? "";
  if (/\bWC\s?20?26\b|world\s*cup/i.test(comp)) return true;
  return (a.tags ?? []).some((t) => /world-?cup|wc-?2026/i.test(t));
}

// Strip the messy quoting the content carries (e.g. "\"\"", "\"world-cup\"")
// down to a plain value, returning "" for anything empty.
function clean(s: string): string {
  return (s ?? "").replace(/[\\"]/g, "").trim();
}

// Some articles carry structured panel_hints.teams / country_codes; older ones
// pack both into the competition string, e.g.
// "WC2026 teams: Norway, United States country_codes: NO, US". Support both.
function extractTeams(a: Article): { teams: string[]; codes: string[] } {
  const teams = new Set<string>();
  const codes = new Set<string>();
  const addTeam = (t: string) => { const v = clean(t); if (v) teams.add(v); };
  const addCode = (c: string) => { const v = clean(c).toUpperCase(); if (v) codes.add(v); };

  for (const t of a.panel_hints?.teams ?? []) addTeam(t);
  for (const c of a.panel_hints?.country_codes ?? []) addCode(c);

  const comp = a.panel_hints?.competition ?? "";
  const teamsMatch = comp.match(/teams:\s*([^]*?)(?:country_codes:|$)/i);
  if (teamsMatch) for (const t of teamsMatch[1].split(",")) addTeam(t);
  const codesMatch = comp.match(/country_codes:\s*([^]*)$/i);
  if (codesMatch) for (const c of codesMatch[1].split(",")) addCode(c);

  return { teams: [...teams], codes: [...codes] };
}

export async function GET() {
  const items = getAllArticles()
    .filter(isWorldCup)
    .slice(0, 150)
    .map((a) => {
      const { teams, codes } = extractTeams(a);
      return {
        slug: a.slug,
        title: a.title,
        lead: a.lead,
        digest: a.digest ?? a.appDigest?.nutshell ?? a.lead,
        coverImage: a.coverImage ? `${BASE}${a.coverImage}` : null,
        date: a.date,
        dateLabel: a.dateLabel,
        readingTime: a.readingTime,
        vertical: a.vertical,
        tags: a.tags ?? [],
        teams,
        codes,
        author: a.author,
        // The reader (short version with images + tickers) and the full article.
        appUrl: `${BASE}/app?article=${a.slug}`,
        articleUrl: `${BASE}/articles/${a.slug}`,
      };
    });

  return new Response(
    JSON.stringify({ generatedAt: new Date().toISOString(), count: items.length, articles: items }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
      },
    },
  );
}
