import Link from "next/link";
import { Volleyball, Trophy, Calendar, Target } from "lucide-react";
import { getAllArticles } from "@/lib/articles";
import { fetchStandings, fetchUpcomingFixtures, fetchTodayMatches, getCompetitionMeta } from "@/lib/panels/fetchers/sports";
import { StandingsTable } from "@/components/panels/sports/StandingsTable";
import { calculatePronosticV2 } from "@/lib/panels/pronostics";

const ALL_COMPETITIONS = ["CL", "PL", "PD", "SA", "BL1"];

export const revalidate = 60;

export default async function SportsPage() {
  const articles = getAllArticles()
    .filter(a => a.vertical === "sports" || a.tags?.some(t => ["football", "basketball", "tennis", "formula-1", "nba", "f1", "champions-league", "premier-league"].includes(t.toLowerCase())))
    .slice(0, 8);
  const topPronostics = getAllArticles()
    .filter((article) => {
      const hints = article.panel_hints;
      return article.vertical === "sports" && Boolean(hints?.home_team && hints?.away_team);
    })
    .map((article) => {
      const hints = article.panel_hints!;
      const result = calculatePronosticV2({
        homeForm: hints.home_form || [],
        awayForm: hints.away_form || [],
        h2hHomeWins: hints.h2h_home || 0,
        h2hDraws: hints.h2h_draw || 0,
        h2hAwayWins: hints.h2h_away || 0,
        homeInjuries: hints.home_injuries || [],
        awayInjuries: hints.away_injuries || [],
      });
      const topProbability = Math.max(result.homeWin, result.draw, result.awayWin);
      const confidenceScore = result.confidence === "high" ? 3 : result.confidence === "medium" ? 2 : 1;

      return { article, result, topProbability, confidenceScore };
    })
    .sort(
      (left, right) =>
        right.confidenceScore - left.confidenceScore ||
        right.topProbability - left.topProbability,
    )
    .slice(0, 3);

  const todayMatches = await fetchTodayMatches(ALL_COMPETITIONS);

  const competitionData = await Promise.allSettled(
    ALL_COMPETITIONS.map(async (code) => {
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

  const hasTodayMatches = todayMatches.some(m => m.matches.length > 0);

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

      {hasTodayMatches && (
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
            <Calendar size={20} className="text-[#F5A623]" />
            Today&apos;s Matches
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayMatches.filter(m => m.matches.length > 0).flatMap(({ code, matches }) =>
              (matches as { id: number; utcDate: string; homeTeam: { name: string; crest: string }; awayTeam: { name: string; crest: string }; score: { fullTime: { home: number; away: number } } }[]).slice(0, 3).map((m) => (
                <div key={`${code}-${m.id}`} className="flex items-center justify-between p-4 rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-center gap-3">
                    {m.homeTeam.crest && <img src={m.homeTeam.crest} alt="" className="w-8 h-8" />}
                    <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{m.homeTeam.name}</span>
                  </div>
                  <span className="text-lg font-bold px-3" style={{ color: "var(--accent)" }}>
                    {m.score?.fullTime?.home ?? 0} - {m.score?.fullTime?.away ?? 0}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{m.awayTeam.name}</span>
                    {m.awayTeam.crest && <img src={m.awayTeam.crest} alt="" className="w-8 h-8" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
          <Trophy size={20} className="text-[#F5A623]" />
          Standings Snapshot
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {competitions.slice(0, 2).map((comp) => {
            const table = comp.standings?.standings?.[0]?.table as unknown as Parameters<typeof StandingsTable>[0]["standings"] | undefined;
            if (!table) return null;
            return (
              <div key={comp.code} className="rounded-2xl border p-4 bg-white" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold" style={{ color: "var(--ink)" }}>{comp.meta.name}</h3>
                  <Link href={`/sports/${comp.code.toLowerCase()}`} className="text-xs" style={{ color: "var(--accent)" }}>Full table →</Link>
                </div>
                <StandingsTable
                  standings={table}
                  competitionName={comp.meta.name}
                  competitionCountry={comp.meta.country}
                />
              </div>
            );
          })}
        </div>
      </section>

      {competitions.map((comp) => {
        const matches = comp.fixtures?.matches as unknown as Parameters<typeof import("@/components/panels/sports/FixturesCard").FixturesCard>[0]["matches"] | undefined;
        if (!Array.isArray(matches) || matches.length === 0) return null;
        return (
          <section key={comp.code}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
                {comp.meta.name} — Upcoming
              </h2>
              <Link href={`/sports/${comp.code.toLowerCase()}`} className="text-sm" style={{ color: "var(--accent)" }}>
                Full details →
              </Link>
            </div>
            <div className="space-y-3">
              {matches.slice(0, 5).map((m: { id: number; utcDate: string; homeTeam: { name: string }; awayTeam: { name: string }; status: string }) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white text-sm" style={{ borderColor: "var(--line)" }}>
                  <span style={{ color: "var(--ink-soft)" }} className="text-xs min-w-[3rem]">
                    {new Date(m.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex-1 font-medium" style={{ color: "var(--ink)" }}>
                    {m.homeTeam.name} vs {m.awayTeam.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-display), serif", color: "var(--ink)" }}>
          <Target size={20} className="text-[#F5A623]" />
          Top Pronostics
        </h2>
        {topPronostics.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {topPronostics.map(({ article, result }) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="sports-pronostic-card"
              >
                <div className="sports-pronostic-card-top">
                  <span className="sports-pronostic-card-kicker">{article.dateLabel}</span>
                  <span className={`sports-pronostic-card-confidence is-${result.confidence}`}>
                    {result.confidence} confidence
                  </span>
                </div>
                <h3 className="sports-pronostic-card-title">
                  {article.panel_hints?.home_team} vs {article.panel_hints?.away_team}
                </h3>
                <p className="sports-pronostic-card-outcome">
                  {result.predictedOutcome === "homeWin"
                    ? `${article.panel_hints?.home_team} edge`
                    : result.predictedOutcome === "awayWin"
                      ? `${article.panel_hints?.away_team} edge`
                      : "Draw risk elevated"}
                </p>
                <div className="sports-pronostic-card-bars" aria-hidden="true">
                  <span style={{ width: `${result.homeWin * 100}%` }} />
                  <span style={{ width: `${result.draw * 100}%` }} />
                  <span style={{ width: `${result.awayWin * 100}%` }} />
                </div>
                <div className="sports-pronostic-card-stats">
                  <span>{Math.round(result.homeWin * 100)}% home</span>
                  <span>{Math.round(result.draw * 100)}% draw</span>
                  <span>{Math.round(result.awayWin * 100)}% away</span>
                </div>
                <p className="sports-pronostic-card-link">Open article analysis →</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            Pronostics appear automatically when a sports article has team and form signals.
          </p>
        )}
      </section>

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
              href={`/sports/${code.toLowerCase()}`}
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
