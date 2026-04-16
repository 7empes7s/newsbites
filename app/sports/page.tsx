import Link from "next/link";
import { Volleyball } from "lucide-react";
import { getAllArticles } from "@/lib/articles";
import { fetchStandings, fetchUpcomingFixtures, getCompetitionMeta } from "@/lib/panels/fetchers/sports";
import { StandingsTable } from "@/components/panels/sports/StandingsTable";

const FEATURED_COMPETITIONS = ["CL", "PL"];

export const revalidate = 60;

export default async function SportsPage() {
  const articles = getAllArticles()
    .filter(a => a.vertical === "sports" || a.tags?.some(t => ["football", "basketball", "tennis", "formula-1", "nba", "f1", "champions-league", "premier-league"].includes(t.toLowerCase())))
    .slice(0, 8);

  const competitionData = await Promise.allSettled(
    FEATURED_COMPETITIONS.map(async (code) => {
      const [standings, fixtures] = await Promise.allSettled([
        fetchStandings(code),
        fetchUpcomingFixtures(code),
      ]);
      return {
        code,
        meta: getCompetitionMeta(code),
        standings: standings.status === "fulfilled" ? standings.value : null,
        fixtures: fixtures.status === "fulfilled" ? fixtures.value : null,
      };
    })
  );

  const competitions = competitionData
    .filter((r): r is PromiseFulfilledResult<{
      code: string;
      meta: { name: string; country: string };
      standings: Awaited<ReturnType<typeof fetchStandings>> | null;
      fixtures: Awaited<ReturnType<typeof fetchUpcomingFixtures>> | null;
    }> => r.status === "fulfilled")
    .map(r => r.value);

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl bg-[#1B2A4A] px-6 sm:px-10 py-12 sm:py-16 text-white">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-[#F5A623] font-semibold mb-3">Sports Intelligence</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{ fontFamily: "var(--font-display), serif" }}>
            Live data. <span className="text-[#F5A623]">Expert context.</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-lg">
            Standings, fixtures, predictions, and deep analysis — powered by live APIs and AI editorial.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/category/sports" className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-5 py-2.5 text-sm font-semibold text-[#1B2A4A] hover:opacity-90 transition-opacity">
              Latest articles <Volleyball size={16} />
            </Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#F5A623]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </section>

      {competitions.map((comp) => {
        const table = comp.standings?.standings?.[0]?.table as unknown as Parameters<typeof StandingsTable>[0]["standings"] | undefined;
        const matches = comp.fixtures?.matches as unknown as Parameters<typeof import("@/components/panels/sports/FixturesCard").FixturesCard>[0]["matches"] | undefined;
        return (
          <section key={comp.code}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
                {comp.meta.name}
              </h2>
              <Link href={`/sports/${comp.code}`} className="text-sm" style={{ color: "var(--accent)" }}>
                Full details →
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {table && (
                <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: "var(--line)" }}>
                  <StandingsTable
                    standings={table}
                    competitionName={comp.meta.name}
                    competitionCountry={comp.meta.country}
                  />
                </div>
              )}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>Upcoming Fixtures</h3>
                {Array.isArray(matches) && matches.slice(0, 5).map((m: { id: number; utcDate: string; homeTeam: { name: string }; awayTeam: { name: string }; status: string }) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white text-sm" style={{ borderColor: "var(--line)" }}>
                    <span style={{ color: "var(--ink-soft)" }} className="text-xs min-w-[3rem]">
                      {new Date(m.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className="flex-1 font-medium" style={{ color: "var(--ink)" }}>
                      {m.homeTeam.name} vs {m.awayTeam.name}
                    </span>
                  </div>
                ))}
                {(!Array.isArray(matches) || matches.length === 0) && (
                  <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No upcoming fixtures found.</p>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {articles.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
            Latest Sports Coverage
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group p-5 rounded-2xl border bg-white transition-all hover:shadow-sm"
                style={{ borderColor: "var(--line)" }}
              >
                <p className="text-xs mb-2" style={{ color: "var(--ink-soft)" }}>{article.dateLabel}</p>
                <h3 className="text-sm font-semibold line-clamp-2" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
                  {article.title}
                </h3>
                <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--ink-soft)" }}>{article.lead}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
          Competitions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries({ CL: "Champions League", PL: "Premier League", PD: "La Liga", SA: "Serie A", BL1: "Bundesliga" }).map(([code, name]) => (
            <Link
              key={code}
              href={`/sports/${code}`}
              className="group rounded-2xl border bg-white p-5 text-center transition-all hover:border-[#F5A623]/50 hover:shadow-md"
              style={{ borderColor: "var(--line)" }}
            >
              <h3 className="text-base font-bold" style={{ color: "var(--ink)" }}>{name}</h3>
              <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>Standings, fixtures & more</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}