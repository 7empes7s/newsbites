import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { fetchStandings, fetchUpcomingFixtures, getCompetitionMeta } from "@/lib/panels/fetchers/sports";
import { StandingsTable } from "@/components/panels/sports/StandingsTable";

const SUPPORTED_COMPETITIONS = ["CL", "PL", "PD", "SA", "BL1"];

export function generateStaticParams() {
  return SUPPORTED_COMPETITIONS.map((competition) => ({ competition }));
}

export const revalidate = 300;

export default async function CompetitionPage({ params }: { params: Promise<{ competition: string }> }) {
  const { competition } = await params;

  if (!SUPPORTED_COMPETITIONS.includes(competition)) {
    notFound();
  }

  const meta = getCompetitionMeta(competition);

  const [standingsData, fixturesData] = await Promise.allSettled([
    fetchStandings(competition),
    fetchUpcomingFixtures(competition),
  ]);

  const standings = standingsData.status === "fulfilled" ? standingsData.value : null;
  const fixtures = fixturesData.status === "fulfilled" ? fixturesData.value : null;

  const table = standings?.standings?.[0]?.table as unknown as Parameters<typeof StandingsTable>[0]["standings"] | undefined;

  const articles = getAllArticles()
    .filter(a => {
      const compTag = Object.entries({ "CL": "champions-league", "PL": "premier-league", "PD": "la-liga", "SA": "serie-a", "BL1": "bundesliga" })
        .find(([code]) => code === competition);
      return compTag ? a.tags?.some(t => t.toLowerCase() === compTag[1]) : false;
    })
    .slice(0, 6);

  const recentMatches = (standings?.standings?.[0]?.table as Array<{ team: { name: string }; playedGames: number; won: number; draw: number; lost: number; points: number; goalDifference: number }> | undefined);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/sports" className="text-sm" style={{ color: "var(--accent)" }}>
          ← Sports
        </Link>
        <span style={{ color: "var(--line)" }}>|</span>
        <span className="text-sm" style={{ color: "var(--ink-soft)" }}>{meta.country}</span>
      </div>

      <section>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
          {meta.name} — {meta.country}
        </h1>
      </section>

      {table && (
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
            Standings
          </h2>
          <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: "var(--line)" }}>
            <StandingsTable
              standings={table}
              competitionName={meta.name}
              competitionCountry={meta.country}
            />
          </div>
        </section>
      )}

      {fixtures && Array.isArray(fixtures.matches) && fixtures.matches.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
            Upcoming Fixtures
          </h2>
          <div className="space-y-2">
            {(fixtures.matches as Array<{ id: number; utcDate: string; homeTeam: { name: string; crest?: string }; awayTeam: { name: string; crest?: string }; status: string }>).slice(0, 10).map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white text-sm" style={{ borderColor: "var(--line)" }}>
                <span style={{ color: "var(--ink-soft)" }} className="text-xs min-w-[3.5rem]">
                  {new Date(m.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="flex-1 font-medium" style={{ color: "var(--ink)" }}>
                  {m.homeTeam.name} vs {m.awayTeam.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
            Related Articles
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
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
          Other Competitions
        </h2>
        <div className="flex flex-wrap gap-3">
          {SUPPORTED_COMPETITIONS.filter(c => c !== competition).map((code) => {
            const m = getCompetitionMeta(code);
            return (
              <Link
                key={code}
                href={`/sports/${code}`}
                className="px-4 py-2 rounded-full border text-sm font-medium transition-all hover:border-[#F5A623]/50"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {m.name}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}