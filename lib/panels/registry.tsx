import type { Article } from "@/lib/articles";
import type { PanelConfig, PanelHints } from "./types";
import type React from "react";
import { StandingsTable } from "@/components/panels/sports/StandingsTable";
import { FixturesCard } from "@/components/panels/sports/FixturesCard";
import { PronosticWidget } from "@/components/panels/sports/PronosticWidget";
import { TeamMiniCard } from "@/components/panels/sports/TeamMiniCard";
import { RouteToFinalCard } from "@/components/panels/sports/RouteToFinalCard";
import { NBAStandingsCard } from "@/components/panels/sports/NBAStandingsCard";
import { F1RaceCard } from "@/components/panels/sports/F1RaceCard";
import { FinancePanel } from "@/components/panels/finance/FinancePanel";
import { TickerSparklinePanel } from "@/components/panels/finance/TickerSparklineCard";
import { MacroIndicatorPanel } from "@/components/panels/finance/MacroIndicatorRow";
import { CryptoPanel } from "@/components/panels/finance/CryptoPanel";
import { CountryProfilePanel } from "@/components/panels/world/CountryProfileCard";
import { ConflictTimelinePanel } from "@/components/panels/world/ConflictTimeline";
import { ElectionCalendarPanel } from "@/components/panels/world/ElectionCalendar";
import { TradeDataPanel } from "@/components/panels/world/TradeDataCard";
import { GitHubRepoPanel } from "@/components/panels/tech/GithubRepoCard";
import { ModelLeaderboardPanel } from "@/components/panels/tech/ModelLeaderboardWidget";
import { PaperCardPanel } from "@/components/panels/tech/PaperCard";
import { TechSignalPanel } from "@/components/panels/tech/TechSignalCard";
import { LaunchTrackerCard } from "@/components/panels/science/LaunchTrackerCard";
import { APODCard } from "@/components/panels/science/APODCard";
import { ISSPositionCard } from "@/components/panels/science/ISSPositionCard";
import { MissionStatusCard } from "@/components/panels/science/MissionStatusCard";
import { FDAAlertPanel } from "@/components/panels/wellness/FDAAlertCard";
import { WHOBulletinPanel } from "@/components/panels/wellness/WHOBulletinCard";
import { ClinicalTrialPanel } from "@/components/panels/wellness/ClinicalTrialCounter";
import { CO2WidgetPanel } from "@/components/panels/climate/CO2Widget";
import { TempAnomalyPanel } from "@/components/panels/climate/TempAnomalyChart";
import { RenewableCapacityPanel } from "@/components/panels/climate/RenewableCapacityCard";
import AniSeasonCardLoader from "@/components/panels/culture/AniSeasonCard";
import AnilistProfileCardLoader from "@/components/panels/culture/AnilistProfileCard";
import GameProfileCardLoader from "@/components/panels/culture/GameProfileCard";
import ReleasesCalendarCardLoader from "@/components/panels/culture/ReleasesCalendarCard";
import BoxOfficeCardLoader from "@/components/panels/culture/BoxOfficeCard";
import RedditSentimentCardLoader from "@/components/panels/trends/RedditSentimentCard";
import { fetchStandings, fetchUpcomingFixtures, fetchKnockoutMatches, detectAllCompetitions, getCompetitionMeta, searchTeamByName, fetchTeamUpcomingMatches, fetchH2HMatches } from "@/lib/panels/fetchers/sports";
import { detectTickerFromArticle, TICKER_MAP } from "@/lib/finance/tickers";
import { fetchFinanceDataForTicker } from "@/lib/panels/fetchers/finance";
import { calculatePronostic } from "@/lib/panels/pronostics";

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äáàâã]/g, 'a')
    .replace(/[ëéèê]/g, 'e')
    .replace(/[ïíìî]/g, 'i')
    .replace(/[öóòôõ]/g, 'o')
    .replace(/[üúùû]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function teamMatches(teamName: string, searchName: string): boolean {
  const normalizedTeam = normalizeTeamName(teamName);
  const normalizedSearch = normalizeTeamName(searchName);
  return normalizedTeam.includes(normalizedSearch) || normalizedSearch.split(' ').some(word => word.length > 3 && normalizedTeam.includes(word));
}

type Match = {
  id: number;
  utcDate: string;
  homeTeam: { name: string; crest?: string };
  awayTeam: { name: string; crest?: string };
  competition?: { name: string; emblem?: string };
  score: { fullTime: { home: number | null; away: number | null } };
  status: string;
};

const KNOCKOUT_COMPETITIONS = ['CL', 'WC', 'EC'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sportsPanels: PanelConfig<any>[] = [
  {
    id: "nba-standings",
    priority: 0,
    cta: { label: "Full match coverage →", href: "/sports" },
    component: async (article: Article) => {
      if (!article.tags?.some(t => t.toLowerCase().includes('nba') || t.toLowerCase().includes('basketball'))) return null;
      return <NBAStandingsCard article={article} />;
    },
  },
  {
    id: "f1-race",
    priority: 0,
    cta: { label: "Full match coverage →", href: "/sports" },
    component: async (article: Article) => {
      if (!article.tags?.some(t => t.toLowerCase().includes('f1') || t.toLowerCase().includes('formula'))) return null;
      return <F1RaceCard article={article} />;
    },
  },
  {
    id: "sports-standings",
    priority: 1,
    cta: { label: "Full match coverage →", href: "/sports" },
    component: async (article: Article) => {
      const { tags = [], panel_hints } = article;
      const competitions = detectAllCompetitions(tags, panel_hints);
      if (competitions.length === 0) return null;
      
      const elements: React.ReactNode[] = [];
      
      for (const comp of competitions) {
        const data = await fetchStandings(comp, article.slug);
        if (!data) continue;
        const table = data.standings?.[0]?.table as unknown as Parameters<typeof StandingsTable>[0]['standings'];
        if (!table) continue;
        const meta = getCompetitionMeta(comp);
        elements.push(
          <StandingsTable 
            key={comp}
            standings={table} 
            highlightTeams={panel_hints?.teams}
            competitionName={meta.name}
            competitionCountry={meta.country}
          />
        );
      }
      
      return elements.length > 0 ? elements : null;
    },
  },
  {
    id: "sports-fixtures",
    priority: 2,
    component: async (article: Article) => {
      const { panel_hints } = article;
      const { home_team, away_team } = panel_hints || {};
      
      if (!home_team || !away_team) {
        const { tags = [], panel_hints: ph } = article;
        const competitions = detectAllCompetitions(tags, ph);
        if (competitions.length === 0) return null;
        
        const elements: React.ReactNode[] = [];
        for (const comp of competitions) {
          const data = await fetchUpcomingFixtures(comp, article.slug);
          if (!data) continue;
          const matches = data.matches as unknown as Parameters<typeof FixturesCard>[0]['matches'];
          if (!matches || matches.length === 0) continue;
          elements.push(<FixturesCard key={comp} matches={matches} />);
        }
        return elements.length > 0 ? elements : null;
      }

      const [homeTeam, awayTeam] = await Promise.all([
        searchTeamByName(home_team),
        searchTeamByName(away_team),
      ]);

      if (!homeTeam || !awayTeam) return null;

      const [h2hData, homeFixtures, awayFixtures] = await Promise.all([
        fetchH2HMatches(homeTeam.id, awayTeam.id),
        fetchTeamUpcomingMatches(homeTeam.id),
        fetchTeamUpcomingMatches(awayTeam.id),
      ]);

      const h2hMatches = (h2hData?.matches || []) as Match[];
      const homeMatches = (homeFixtures?.matches || []) as Match[];
      const awayMatches = (awayFixtures?.matches || []) as Match[];

      if (h2hMatches.length === 0 && homeMatches.length === 0 && awayMatches.length === 0) {
        return null;
      }

      return (
        <FixturesCard
          homeTeamName={home_team}
          awayTeamName={away_team}
          h2hMatches={h2hMatches}
          homeTeamMatches={homeMatches}
          awayTeamMatches={awayMatches}
        />
      );
    },
  },
  {
    id: "sports-pronostic",
    priority: 3,
    component: async (article: Article) => {
      const { panel_hints } = article;
      const { home_team, away_team, home_form, away_form, h2h_home, h2h_draw, h2h_away } = panel_hints || {};
      if (!home_team || !away_team) return null;
      const result = calculatePronostic(
        home_form || [],
        away_form || [],
        h2h_home || 0,
        h2h_draw || 0,
        h2h_away || 0
      );
      return (
        <PronosticWidget
          homeTeam={home_team}
          awayTeam={away_team}
          homeWin={result.homeWin}
          draw={result.draw}
          awayWin={result.awayWin}
          predictedOutcome={result.predictedOutcome}
          confidence={result.confidence}
        />
      );
    },
  },
  {
    id: "sports-home-team",
    priority: 4,
    component: async (article: Article) => {
      const { panel_hints } = article;
      const { home_team, home_crest, home_position, home_form } = panel_hints || {};
      if (!home_team) return null;
      return (
        <TeamMiniCard
          teamName={home_team}
          teamCrest={home_crest}
          position={home_position}
          form={home_form || []}
        />
      );
    },
  },
  {
    id: "sports-away-team",
    priority: 5,
    component: async (article: Article) => {
      const { panel_hints } = article;
      const { away_team, away_crest, away_position, away_form } = panel_hints || {};
      if (!away_team) return null;
      return (
        <TeamMiniCard
          teamName={away_team}
          teamCrest={away_crest}
          position={away_position}
          form={away_form || []}
        />
      );
    },
  },
  {
    id: "sports-route-to-final",
    priority: 6,
    component: async (article: Article) => {
      const { tags = [], panel_hints } = article;
      const competitions = detectAllCompetitions(tags, panel_hints);
      const teams = panel_hints?.teams || [];
      
      if (teams.length === 0) return null;
      
      const knockoutComps = competitions.filter(c => KNOCKOUT_COMPETITIONS.includes(c));
      if (knockoutComps.length === 0) return null;

      const comp = knockoutComps[0];
      
      const knockoutMatches = await fetchKnockoutMatches(comp, undefined, article.slug);
      const upcomingFixtures = await fetchUpcomingFixtures(comp, article.slug);
      
      const allTeamMatches: { teamName: string; matches: { round: string; homeTeam: string; awayTeam: string; aggregateScore?: string; nextOpponent?: string }[] }[] = [];
      
      for (const teamName of teams) {
        const teamMatchesData: { round: string; homeTeam: string; awayTeam: string; aggregateScore?: string; nextOpponent?: string }[] = [];
        
        for (const [stage, matches] of Object.entries(knockoutMatches)) {
          const match = (matches as { homeTeam?: { name?: string }; awayTeam?: { name?: string }; score?: { fullTime?: { home: number; away: number } } }[]).find(m => 
            (m.homeTeam?.name && teamMatches(m.homeTeam.name, teamName)) ||
            (m.awayTeam?.name && teamMatches(m.awayTeam.name, teamName))
          );
          if (match) {
            const roundName = stage.replace('_', ' ').toLowerCase();
            teamMatchesData.push({
              round: roundName,
              homeTeam: match.homeTeam?.name || '',
              awayTeam: match.awayTeam?.name || '',
              aggregateScore: match.score?.fullTime ? `${match.score.fullTime.home}–${match.score.fullTime.away}` : undefined,
            });
          }
        }
        
        if (upcomingFixtures?.matches) {
          const semiMatches = (upcomingFixtures.matches as { stage?: string; homeTeam?: { name?: string }; awayTeam?: { name?: string } }[]).filter(
            m => m.stage === 'SEMI_FINALS' && 
            ((m.homeTeam?.name && teamMatches(m.homeTeam.name, teamName)) ||
             (m.awayTeam?.name && teamMatches(m.awayTeam.name, teamName)))
          );
          for (const match of semiMatches) {
            const opponent = match.homeTeam?.name && teamMatches(match.homeTeam.name, teamName) 
              ? match.awayTeam?.name 
              : match.homeTeam?.name;
            teamMatchesData.push({
              round: 'semi finals',
              homeTeam: match.homeTeam?.name || '',
              awayTeam: match.awayTeam?.name || '',
              nextOpponent: opponent,
            });
          }
        }
        
        if (teamMatchesData.length > 0) {
          allTeamMatches.push({ teamName, matches: teamMatchesData });
        }
      }
      
      if (allTeamMatches.length === 0) return null;
      
      return (
        <>
          {allTeamMatches.map(({ teamName, matches }) => (
            <RouteToFinalCard key={teamName} teamName={teamName} matches={matches} />
          ))}
        </>
      );
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const financePanels: PanelConfig<any>[] = [
  {
    id: "finance-overview",
    priority: 1,
    cta: { label: "Finance Intelligence →", href: "/finance" },
    component: async (article: Article) => {
      const ticker = detectTickerFromArticle(article.title, article.content || "");
      if (!ticker) return null;
      return <FinancePanel article={article} />;
    },
  },
  {
    id: "finance-sparkline",
    priority: 2,
    cta: { label: "Finance Intelligence →", href: "/finance" },
    component: async (article: Article) => {
      const ticker = detectTickerFromArticle(article.title, article.content || "");
      if (!ticker) return null;
      return <TickerSparklinePanel article={article} />;
    },
  },
  {
    id: "macro-indicators",
    priority: 3,
    component: async (article: Article) => {
      if (article.vertical !== "economy") return null;
      return <MacroIndicatorPanel article={article} />;
    },
  },
  {
    id: "crypto-panel",
    priority: 4,
    component: async (article: Article) => {
      if (article.vertical !== "crypto") return null;
      return <CryptoPanel article={article} />;
    },
  },
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const worldPanels: PanelConfig<any>[] = [
  {
    id: "country-profile",
    priority: 1,
    component: async (article: Article) => {
      const { tags = [], panel_hints } = article;
      if (panel_hints?.country_codes?.length || tags.some(t => ["iran", "ukraine", "russia", "china", "israel", "gaza"].includes(t.toLowerCase()))) {
        return <CountryProfilePanel article={article} />;
      }
      return null;
    },
  },
  {
    id: "conflict-timeline",
    priority: 2,
    component: async (article: Article) => {
      const { tags = [], panel_hints } = article;
      const hasConflictTag = tags.some(t => ["iran", "ukraine", "war", "conflict", "ceasefire", "sanctions"].includes(t.toLowerCase()));
      if (panel_hints?.country_codes?.length || hasConflictTag) {
        return <ConflictTimelinePanel article={article} />;
      }
      return null;
    },
  },
  {
    id: "election-calendar",
    priority: 3,
    component: async (article: Article) => {
      return <ElectionCalendarPanel article={article} />;
    },
  },
  {
    id: "trade-data",
    priority: 4,
    component: async (article: Article) => {
      return <TradeDataPanel article={article} />;
    },
  },
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const techPanels: PanelConfig<any>[] = [
  {
    id: "github-repo",
    priority: 1,
    component: async (article: Article) => {
      return <GitHubRepoPanel article={article} />;
    },
  },
  {
    id: "model-leaderboard",
    priority: 2,
    component: async (article: Article) => {
      return <ModelLeaderboardPanel article={article} />;
    },
  },
  {
    id: "paper-card",
    priority: 3,
    component: async (article: Article) => {
      return <PaperCardPanel article={article} />;
    },
  },
  {
    id: "tech-signal",
    priority: 4,
    component: async (article: Article) => {
      return <TechSignalPanel article={article} />;
    },
  },
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sciencePanels: PanelConfig<any>[] = [
  {
    id: "launch-tracker",
    priority: 1,
    component: async () => {
      return <LaunchTrackerCard />;
    },
  },
  {
    id: "apod",
    priority: 2,
    component: async () => {
      return <APODCard />;
    },
  },
  {
    id: "iss-position",
    priority: 3,
    component: async () => {
      return <ISSPositionCard />;
    },
  },
  {
    id: "mission-status",
    priority: 4,
    component: async (article: Article) => {
      return <MissionStatusCard article={article} />;
    },
  },
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wellnessPanels: PanelConfig<any>[] = [
  {
    id: "fda-alerts",
    priority: 1,
    component: async (article: Article) => {
      if (!["healthcare", "skincare", "wellness", "tcm"].includes(article.vertical)) return null;
      return <FDAAlertPanel article={article} />;
    },
  },
  {
    id: "who-bulletin",
    priority: 2,
    component: async () => {
      return <WHOBulletinPanel />;
    },
  },
  {
    id: "clinical-trials",
    priority: 3,
    component: async (article: Article) => {
      if (!["healthcare", "wellness", "tcm"].includes(article.vertical)) return null;
      return <ClinicalTrialPanel article={article} />;
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const climatePanels: PanelConfig<any>[] = [
  {
    id: "co2-widget",
    priority: 1,
    component: async () => {
      return <CO2WidgetPanel />;
    },
  },
  {
    id: "temp-anomaly",
    priority: 2,
    component: async () => {
      return <TempAnomalyPanel />;
    },
  },
  {
    id: "renewable-capacity",
    priority: 3,
    component: async (article: Article) => {
      return <RenewableCapacityPanel article={article} />;
    },
  },
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const animePanels: PanelConfig<any>[] = [
  {
    id: "anime-season",
    priority: 1,
    component: async (article: Article) => <AniSeasonCardLoader article={article} />,
  },
  {
    id: "anilist-profile",
    priority: 2,
    component: async (article: Article) => <AnilistProfileCardLoader article={article} />,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gamingPanels: PanelConfig<any>[] = [
  {
    id: "game-profile",
    priority: 1,
    component: async (article: Article) => <GameProfileCardLoader article={article} />,
  },
  {
    id: "releases-calendar",
    priority: 2,
    component: async (article: Article) => <ReleasesCalendarCardLoader article={article} />,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const culturePanels: PanelConfig<any>[] = [
  {
    id: "box-office",
    priority: 1,
    component: async () => <BoxOfficeCardLoader />,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trendsPanels: PanelConfig<any>[] = [
  {
    id: "reddit-sentiment",
    priority: 1,
    component: async (article: Article) => <RedditSentimentCardLoader article={article} />,
  },
];

const compactTickerSection: PanelConfig<any> = {
  id: "tag-ticker",
  priority: 40,
  cta: { label: "Finance Intelligence →", href: "/finance" },
  component: async (article: Article) => {
    const ticker = detectTickerFromArticle(article.title, article.content || "");
    if (!ticker) return null;
    const data = await fetchFinanceDataForTicker(ticker.symbol);
    if (!data) return null;
    const isPositive = (data.changePercent ?? 0) >= 0;
    return (
      <div className="ticker-sparkline-panel">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#1B2A4A] text-white">{data.symbol}</span>
          <span className="text-xs text-slate-500">{ticker.name}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#1B2A4A]">${data.price >= 1000 ? data.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : data.price.toFixed(2)}</span>
          <span className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {isPositive ? "▲" : "▼"} {Math.abs(data.changePercent ?? 0).toFixed(2)}%
          </span>
        </div>
      </div>
    );
  },
};

const launchTrackerSection: PanelConfig<any> = {
  id: "tag-launch",
  priority: 40,
  component: async () => <LaunchTrackerCard />,
};

export function getPanelSections(article: Article): PanelConfig[] {
  const configs: PanelConfig[] = [];
  const { vertical, tags = [], panel_hints } = article;

  const hasTags = (...t: string[]) => t.some((tag) => tags.includes(tag));

  if (vertical === "sports" || hasTags("football", "basketball", "tennis", "formula-1", "nba", "f1"))
    configs.push(...sportsPanels);

  if (["finance", "economy", "crypto"].includes(vertical) || (panel_hints?.tickers?.length ?? 0) > 0)
    configs.push(...financePanels);

  if (["global-politics", "world"].includes(vertical) || (panel_hints?.country_codes?.length ?? 0) > 0)
    configs.push(...worldPanels);

  if (["ai", "trends", "cybersecurity", "tech"].includes(vertical) || (panel_hints?.github_repos?.length ?? 0) > 0)
    configs.push(...techPanels);

  if (vertical === "trends")
    configs.push(...trendsPanels);

  if (["space", "science"].includes(vertical) || panel_hints?.nasa_mission || panel_hints?.launch_id)
    configs.push(...sciencePanels);

  if (["healthcare", "wellness", "tcm", "skincare"].includes(vertical))
    configs.push(...wellnessPanels);

  if (["climate", "energy"].includes(vertical))
    configs.push(...climatePanels);

  if (vertical === "anime")
    configs.push(...animePanels);

  if (vertical === "gaming")
    configs.push(...gamingPanels);

  if (vertical === "culture" && !hasTags("anime", "gaming"))
    configs.push(...culturePanels);

  // Cross-vertical: tickers on non-finance articles
  if (!["finance", "economy", "crypto"].includes(vertical) && (panel_hints?.tickers?.length ?? 0) > 0) {
    const tickerSymbols = panel_hints!.tickers!.slice(0, 3);
    const isAlreadyIncluded = configs.some(c => c.id === "finance-sparkline");
    if (!isAlreadyIncluded) {
      configs.push({
        id: "cross-vertical-ticker",
        priority: 50,
        cta: { label: "Finance Intelligence →", href: "/finance" },
        component: async (article: Article) => {
          const results = await Promise.all(tickerSymbols.map(async (sym) => {
            const data = await fetchFinanceDataForTicker(sym);
            return data ? { symbol: sym, data } : null;
          }));
          const valid = results.filter((r): r is NonNullable<typeof r> => r !== null);
          if (valid.length === 0) return null;
          const entries = valid.map(({ symbol, data }) => {
            const mapping = TICKER_MAP.find(m => m.symbol === symbol);
            const isPositive = (data.changePercent ?? 0) >= 0;
            return (
              <div key={symbol} className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-white text-sm">
                <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-[#1B2A4A] text-white">{symbol}</span>
                <span className="text-xs text-slate-500 hidden sm:inline">{mapping?.name || symbol}</span>
                <span className="ml-auto font-semibold text-[#1B2A4A]">${data.price >= 1000 ? data.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : data.price.toFixed(2)}</span>
                <span className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                  {isPositive ? "▲" : "▼"} {Math.abs(data.changePercent ?? 0).toFixed(2)}%
                </span>
              </div>
            );
          });
          return <div className="space-y-2">{entries}</div>;
        },
      });
    }
  }

  // Cross-vertical: GitHub repos on non-tech articles
  if (!["ai", "trends", "cybersecurity", "tech"].includes(vertical) && (panel_hints?.github_repos?.length ?? 0) > 0) {
    const isAlreadyIncluded = configs.some(c => c.id === "github-repo");
    if (!isAlreadyIncluded) {
      configs.push({
        id: "cross-vertical-github",
        priority: 50,
        component: async (article: Article) => <GitHubRepoPanel article={article} />,
      });
    }
  }

  // Tag-based panel overrides
  const TAG_PANEL_MAP: Record<string, PanelConfig[]> = {
    'champions-league': sportsPanels,
    'premier-league': sportsPanels,
    'la-liga': sportsPanels,
    'serie-a': sportsPanels,
    'bundesliga': sportsPanels,
    'bitcoin': financePanels,
    'btc': financePanels,
    'crypto': financePanels,
    'nasa': sciencePanels,
    'spacex': [launchTrackerSection],
    'nvda': [compactTickerSection],
    'aapl': [compactTickerSection],
    'msft': [compactTickerSection],
  };

  for (const tag of tags) {
    const tagPanels = TAG_PANEL_MAP[tag.toLowerCase()];
    if (tagPanels) configs.push(...tagPanels);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = configs.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  return deduped.sort((a, b) => a.priority - b.priority);
}

// Export panel arrays so vertical modules can push into them at import time
export {
  sportsPanels,
  financePanels,
  worldPanels,
  techPanels,
  sciencePanels,
  wellnessPanels,
  climatePanels,
  animePanels,
  gamingPanels,
  culturePanels,
  trendsPanels,
};
