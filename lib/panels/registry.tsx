import type { Article } from "@/lib/articles";
import type { PanelConfig, PanelHints } from "./types";
import { StandingsTable } from "@/components/panels/sports/StandingsTable";
import { FixturesCard } from "@/components/panels/sports/FixturesCard";
import { PronosticWidget } from "@/components/panels/sports/PronosticWidget";
import { TeamMiniCard } from "@/components/panels/sports/TeamMiniCard";
import { RouteToFinalCard } from "@/components/panels/sports/RouteToFinalCard";
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
import { fetchStandings, fetchUpcomingFixtures, fetchKnockoutMatches, detectAllCompetitions, getCompetitionMeta } from "@/lib/panels/fetchers/sports";
import { detectTickerFromArticle } from "@/lib/finance/tickers";
import { calculatePronostic } from "@/lib/panels/pronostics";

const KNOCKOUT_COMPETITIONS = ['CL', 'WC', 'EC'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sportsPanels: PanelConfig<any>[] = [
  {
    id: "sports-standings",
    priority: 1,
    component: async (article: Article) => {
      const { tags = [], panel_hints } = article;
      const competitions = detectAllCompetitions(tags, panel_hints);
      if (competitions.length === 0) return null;
      
      const elements: React.ReactNode[] = [];
      
      for (const comp of competitions) {
        const data = await fetchStandings(comp);
        if (!data) continue;
        const table = data.standings?.[0]?.table;
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
      const { tags = [], panel_hints } = article;
      const competitions = detectAllCompetitions(tags, panel_hints);
      if (competitions.length === 0) return null;
      
      const elements: React.ReactNode[] = [];
      
      for (const comp of competitions) {
        const data = await fetchUpcomingFixtures(comp);
        if (!data) continue;
        const matches = data.matches;
        if (!matches || matches.length === 0) continue;
        elements.push(<FixturesCard key={comp} matches={matches} />);
      }
      
      return elements.length > 0 ? elements : null;
    },
  },
  {
    id: "sports-pronostic",
    priority: 3,
    component: async ({ panel_hints }: { panel_hints?: PanelHints }) => {
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
    component: async ({ panel_hints }: { panel_hints?: PanelHints }) => {
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
    component: async ({ panel_hints }: { panel_hints?: PanelHints }) => {
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
      const teamName = panel_hints?.teams?.[0];
      
      if (!teamName) return null;
      
      const knockoutComps = competitions.filter(c => KNOCKOUT_COMPETITIONS.includes(c));
      if (knockoutComps.length === 0) return null;
      
      const comp = knockoutComps[0];
      const knockoutMatches = await fetchKnockoutMatches(comp);
      
      const teamMatches: { round: string; homeTeam: string; awayTeam: string; aggregateScore?: string; nextOpponent?: string }[] = [];
      
      for (const [stage, matches] of Object.entries(knockoutMatches)) {
        const match = (matches as { homeTeam?: { name?: string }; awayTeam?: { name?: string }; score?: { fullTime?: { home: number; away: number } } }[]).find(m => 
          m.homeTeam?.name?.toLowerCase().includes(teamName.toLowerCase()) ||
          m.awayTeam?.name?.toLowerCase().includes(teamName.toLowerCase())
        );
        if (match) {
          const roundName = stage.replace('_', ' ').toLowerCase();
          teamMatches.push({
            round: roundName,
            homeTeam: match.homeTeam?.name || '',
            awayTeam: match.awayTeam?.name || '',
            aggregateScore: match.score?.fullTime ? `${match.score.fullTime.home}–${match.score.fullTime.away}` : undefined,
          });
        }
      }
      
      if (teamMatches.length === 0) return null;
      
      return <RouteToFinalCard teamName={teamName} matches={teamMatches} />;
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const financePanels: PanelConfig<any>[] = [
  {
    id: "finance-overview",
    priority: 1,
    component: async (article: Article) => {
      const ticker = detectTickerFromArticle(article.title, article.content || "");
      if (!ticker) return null;
      return <FinancePanel article={article} />;
    },
  },
  {
    id: "finance-sparkline",
    priority: 2,
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

export function getPanelSections(article: Article): PanelConfig[] {
  const configs: PanelConfig[] = [];
  const { vertical, tags = [], panel_hints } = article;

  const hasTags = (...t: string[]) => t.some((tag) => tags.includes(tag));

  if (vertical === "sports" || hasTags("football", "basketball", "tennis", "formula-1"))
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

  return configs.sort((a, b) => a.priority - b.priority);
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
