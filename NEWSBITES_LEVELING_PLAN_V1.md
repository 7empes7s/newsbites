# NewsBites Leveling Plan V1
# The Intelligence Layer — 6-Month Roadmap

**Created:** 2026-04-13  
**Owner:** Marouane Defili  
**Execution:** Claude Code + Codex CLI  
**Target app:** `news.techinsiderbytes.com` — currently in dev, no security hardening until explicitly requested  
**Cadence:** 2 phases per week × 26 weeks = 52 phases  
**Start date:** 2026-04-14 (Week 1)  
**End date:** 2026-10-12 (Week 26)

---

## Vision

Every article becomes a **living intelligence card**. Alongside the prose, contextual live data appears automatically based on what the article is about — football standings when covering a match, a stock chart when covering a company, a launch countdown when covering a space mission. The reader doesn't need to open another tab. The article becomes the whole picture.

On **desktop**: a fixed right-column panel (320px) sits alongside the article body.  
On **mobile**: a drawer anchored to the bottom of the screen, collapsed by default, with a visible tab/handle the reader taps or swipes up to expand.

This is the same spirit as the Finance intelligence layer already built (`/finance` dashboard with live market data + AI signals) — but applied universally, article by article, vertical by vertical.

---

## Guiding Principles

1. **Free APIs first.** Never add a paid API dependency without a confirmed free tier that covers our volume.
2. **Server components fetch, client components interact.** Data fetching stays in RSC / `generateStaticParams` / ISR. Panels are only interactive on the client after hydration.
3. **Graceful degradation.** If a data source is down or rate-limited, the panel hides silently. The article is always primary.
4. **No speculation.** Don't build panels for verticals that have no articles yet. Build when content exists.
5. **One canonical panel system.** All verticals use the same `ArticleIntelPanel` shell. No bespoke per-page hacks.
6. **Editorial AI produces hints.** Over time, the Writer agent outputs `panel_hints` in frontmatter, giving the panel system pre-detected signals (tickers, teams, competition IDs, country codes).
7. **Dev-only for now.** No auth, no rate-limit middleware, no CSP headers. That gate comes when Marouane says so.

---

## Architecture Overview

### Files to be created

```
components/
  article-panel/
    ArticleIntelPanel.tsx        ← universal shell (desktop sidebar + mobile drawer)
    PanelDrawer.tsx              ← mobile bottom-sheet wrapper
    PanelTabBar.tsx              ← tab nav when multiple sections exist
    PanelSkeleton.tsx            ← loading state
    PanelErrorBoundary.tsx       ← silent fallback

  panels/
    sports/
      StandingsTable.tsx
      FixturesCard.tsx
      PronosticWidget.tsx
      TeamMiniCard.tsx
      MatchResultCard.tsx
    finance/
      (migrate existing FinanceOverlay + MarketCard into panel system)
      MacroIndicatorRow.tsx
      CryptoPanel.tsx
    world/
      CountryProfileCard.tsx
      ConflictTimeline.tsx
      ElectionCalendar.tsx
    tech/
      GithubRepoCard.tsx
      ModelLeaderboardWidget.tsx
      PaperCard.tsx
    science/
      LaunchTrackerCard.tsx
      ISSPositionCard.tsx
      MissionStatusCard.tsx
    wellness/
      FDAAlertCard.tsx
      WHOBulletinCard.tsx
    climate/
      CO2Widget.tsx
      TempAnomalyChart.tsx
    culture/
      AniSeasonCard.tsx
      GameProfileCard.tsx
      BoxOfficeCard.tsx

lib/
  panels/
    registry.ts                  ← vertical + tags → PanelConfig[]
    types.ts                     ← PanelConfig, PanelSection interfaces
    fetchers/
      sports.ts                  ← football-data.org, TheSportsDB
      finance.ts                 ← (already exists, adapt)
      world.ts                   ← REST Countries, World Bank
      tech.ts                    ← GitHub, HuggingFace, Papers With Code
      science.ts                 ← NASA, Open Notify, Launch Library
      wellness.ts                ← OpenFDA, WHO GHO
      climate.ts                 ← Open-Meteo, NOAA CO2
      culture.ts                 ← Jikan, RAWG, TMDB
    pronostics.ts                ← form + H2H → win/draw/loss probability engine

content/
  panels/                        ← static JSON cache for slow/expensive calls
    sports-competitions.json
    country-profiles/
```

### Article page layout change

Current: `max-w-3xl mx-auto` centered column.  
New (lg+): `grid grid-cols-[1fr_320px] gap-8` — article left, panel right.  
Mobile: article full-width, panel as bottom drawer.

### `PanelConfig` type

```typescript
interface PanelConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  Component: React.ComponentType<PanelSectionProps>;
  fetchData: (article: Article) => Promise<unknown>;
  revalidate: number;   // ISR seconds
  priority: number;     // lower = shown first in drawer tab order
}
```

### Panel registry logic

```typescript
// lib/panels/registry.ts
export function getPanelSections(article: Article): PanelConfig[] {
  const configs: PanelConfig[] = [];
  const { vertical, tags, panel_hints } = article;

  if (vertical === 'sports' || tags?.includes('football')) configs.push(...sportsPanels);
  if (['finance','economy','crypto'].includes(vertical))   configs.push(...financePanels);
  if (['global-politics','world'].includes(vertical))      configs.push(...worldPanels);
  if (['ai','trends','cybersecurity'].includes(vertical))  configs.push(...techPanels);
  if (['space','science'].includes(vertical))              configs.push(...sciencePanels);
  if (['healthcare','tcm','skincare'].includes(vertical))  configs.push(...wellnessPanels);
  if (['climate','energy'].includes(vertical))             configs.push(...climatePanels);
  if (['anime','gaming','culture'].includes(vertical))     configs.push(...culturePanels);

  return configs.sort((a, b) => a.priority - b.priority);
}
```

### `panel_hints` frontmatter extension

```yaml
panel_hints:
  competition: "CL"          # football-data.org competition code
  teams: ["Arsenal", "Bayern Munich"]
  tickers: ["AAPL", "NVDA"]
  country_codes: ["IR", "US"]
  github_repos: ["openai/openai-python"]
  nasa_mission: "Artemis II"
```

---

## Free API Reference Table

| Vertical | API | Auth | Limits | URL |
|---|---|---|---|---|
| Sports | football-data.org | Free key | 10 req/min, major comps | football-data.org |
| Sports | TheSportsDB | None (free tier) | Generous | thesportsdb.com/api |
| Sports | API-Football (RapidAPI) | Free key | 100 req/day | api-sports.io |
| Sports | balldontlie (NBA) | Free key | 60 req/min | balldontlie.io |
| Sports | Ergast / OpenF1 | None | Free | ergast.com / openf1.org |
| Finance | Yahoo Finance (unofficial) | None | Soft limit | (query.finance.yahoo.com) |
| Finance | Alpha Vantage | Free key | 25 req/day | alphavantage.co |
| Finance | FRED (Federal Reserve) | Free key | Very generous | fred.stlouisfed.org |
| World | REST Countries | None | Unlimited | restcountries.com |
| World | World Bank API | None | Generous | api.worldbank.org |
| World | GDELT 2.0 | None | Generous (CSV) | gdeltproject.org |
| Tech | GitHub REST API | Optional key | 60/hr unauth, 5000/hr auth | api.github.com |
| Tech | HuggingFace Hub | Optional key | Free | huggingface.co/api |
| Tech | Papers With Code | None | Free JSON | paperswithcode.com/api |
| Science | NASA APIs | Free key | Very generous | api.nasa.gov |
| Science | Open Notify (ISS) | None | Unlimited | open-notify.org |
| Science | Launch Library 2 | None | 15 req/hr unauth | ll.thespacedevs.com |
| Wellness | OpenFDA | Optional key | 1000 req/day free | api.fda.gov |
| Wellness | WHO GHO | None | Free | ghoapi.azureedge.net |
| Climate | Open-Meteo | None | Unlimited (non-commercial) | open-meteo.com |
| Climate | NOAA CO2 (Mauna Loa) | None | Free CSV | gml.noaa.gov |
| Culture | Jikan v4 (MyAnimeList) | None | 3 req/sec | api.jikan.moe |
| Culture | AniList GraphQL | None | 90 req/min | graphql.anilist.co |
| Culture | RAWG | Free key | 20K req/month | rawg.io/api |
| Culture | TMDB | Free key | 50 req/sec | api.themoviedb.org |

**Keys to add to `.env.local`:**
`FOOTBALL_DATA_API_KEY`, `NASA_API_KEY`, `RAWG_API_KEY`, `TMDB_API_KEY`, `GITHUB_TOKEN`, `FRED_API_KEY`, `ALPHA_VANTAGE_KEY`

---

## ISR Revalidation Strategy

| Panel | Interval | Reason |
|---|---|---|
| Live scores | 60s | Match in progress changes quickly |
| Standings | 300s | Changes after each match day |
| Fixtures | 3600s | Published days in advance |
| Market prices | 60s | Trading hours only |
| Macro indicators | 86400s | FRED updates daily/weekly |
| GitHub repo stats | 3600s | Star counts don't change by the minute |
| NASA APOD | 86400s | Changes once per day |
| ISS position | 30s | ISS moves fast |
| Launch schedule | 1800s | Could change with weather holds |
| Anime season | 3600s | Weekly releases |
| Game releases | 3600s | Rare changes |

---

## The 52-Phase Plan

---

### WEEK 1 — Panel Infrastructure Foundation
**Goal:** Build the universal panel shell before any vertical content.

#### Phase 1 — ArticleIntelPanel Shell
- Build `components/article-panel/ArticleIntelPanel.tsx`
  - Desktop: renders as fixed right column (320px) within article layout
  - Mobile: renders nothing (panel is a drawer)
- Build `components/article-panel/PanelDrawer.tsx`
  - Mobile-only bottom drawer, anchored to screen bottom
  - Default state: collapsed (shows 48px tall tab strip with section count badge)
  - Expanded state: slides up to 75vh, scrollable content inside
  - CSS-only transition initially (`transform: translateY`, `transition: 0.3s ease`)
  - `open` state managed in article page client wrapper
- Modify article page layout: `app/articles/[slug]/page.tsx` → wrap in 2-col grid on lg
- Files: `components/article-panel/ArticleIntelPanel.tsx`, `components/article-panel/PanelDrawer.tsx`, `app/articles/[slug]/page.tsx`, `app/articles/[slug]/layout.tsx` (if needed)

#### Phase 2 — Panel Registry + Type System
- Create `lib/panels/types.ts` — `PanelConfig`, `PanelSectionProps` interfaces
- Create `lib/panels/registry.ts` — `getPanelSections(article)` function, initially empty (returns `[]`)
- Add `panel_hints` to `Article` type in `lib/articles.ts` (optional field, parsed from frontmatter)
- Add `PanelTabBar.tsx`, `PanelSkeleton.tsx` placeholder components
- Validate: article pages still render correctly with empty panel (no regressions)
- Files: `lib/panels/types.ts`, `lib/panels/registry.ts`, `lib/articles.ts`, `components/article-panel/PanelTabBar.tsx`, `components/article-panel/PanelSkeleton.tsx`

---

### WEEK 2 — Sports Foundation
**Goal:** Champions League article gets live data. First fully working panel vertical.

#### Phase 3 — Football Data Fetcher
- Create `lib/panels/fetchers/sports.ts`
  - `fetchStandings(competitionCode: string)` → football-data.org `/v4/competitions/{code}/standings`
  - `fetchLiveMatches(competitionCode: string)` → `/v4/competitions/{code}/matches?status=LIVE`
  - `fetchUpcomingFixtures(competitionCode: string, teamNames?: string[])` → `/v4/competitions/{code}/matches?status=SCHEDULED`
  - `fetchTeamForm(teamId: number, last: number)` → `/v4/teams/{id}/matches?limit={last}`
  - Respect 10 req/min limit: use `revalidate: 300` on standings, `revalidate: 60` on live
  - Detect competition from `panel_hints.competition` OR tag-based heuristics (tags include `champions-league` → `CL`, `premier-league` → `PL`, etc.)
- Add `FOOTBALL_DATA_API_KEY` to `.env.local` and `next.config.js` server env
- Files: `lib/panels/fetchers/sports.ts`, `.env.local`, `next.config.js`

#### Phase 4 — Standings + Fixtures Panel Components
- Create `components/panels/sports/StandingsTable.tsx`
  - Compact table: rank, team crest (img), team name, P W D L GD Pts
  - Highlight teams mentioned in `panel_hints.teams` with amber border
  - "Show full table" expand toggle
- Create `components/panels/sports/FixturesCard.tsx`
  - List of upcoming matches: date, home vs away, competition round
  - Live match: shows score with pulsing indicator
- Register `sportsPanels` in `lib/panels/registry.ts`
- Update `champions-league-quarterfinals-*.md` with `panel_hints.competition: "CL"` + `panel_hints.teams`
- Validate: Champions League article renders standings and fixtures in panel
- Files: `components/panels/sports/StandingsTable.tsx`, `components/panels/sports/FixturesCard.tsx`, `lib/panels/registry.ts`, article frontmatter

---

### WEEK 3 — Sports Intelligence: Pronostics
**Goal:** Panel becomes predictive, not just informational.

#### Phase 5 — Pronostics Engine
- Create `lib/panels/pronostics.ts`
  - Input: team A form (last 5), team B form (last 5), H2H record (last 10), venue (home/neutral/away)
  - Form score: W=3, D=1, L=0 weighted by recency (most recent × 1.5)
  - H2H adjustment: each win in H2H for team A adds 0.1 to A's weight
  - Home advantage: +0.15 multiplier for home team
  - Output: `{ homeWin: number, draw: number, awayWin: number }` (sums to 1.0)
  - Also outputs: predicted score range, "likely BTTS" flag (both teams to score), "over 2.5 goals" flag
- Create `components/panels/sports/PronosticWidget.tsx`
  - Three probability bars (home / draw / away) with percentages
  - Predicted outcome badge: "ARSENAL WIN" / "DRAW" with confidence label (high/medium/low)
  - "Based on last 5 games + H2H record" disclaimer
  - Visual: amber = home, slate = draw, navy = away
- Files: `lib/panels/pronostics.ts`, `components/panels/sports/PronosticWidget.tsx`

#### Phase 6 — Team Mini-Card + Match Result History
- Create `components/panels/sports/TeamMiniCard.tsx`
  - Team crest, name, form badges (W/D/L for last 5), goal avg, position in current competition
- Create `components/panels/sports/MatchResultCard.tsx`
  - Recent results grid: date, opponent, score, W/D/L badge
- Wire all three sports panel sections (Standings, Pronostics, Fixtures) into Champions League article
- Validate full panel renders in both mobile drawer and desktop sidebar
- Files: `components/panels/sports/TeamMiniCard.tsx`, `components/panels/sports/MatchResultCard.tsx`

---

### WEEK 4 — Sports Breadth
**Goal:** Support any major football competition, not just UCL.

#### Phase 7 — Multi-Competition Detection
- Extend tag → competition code map in `lib/panels/fetchers/sports.ts`:
  - `premier-league` → `PL`, `la-liga` → `PD`, `serie-a` → `SA`, `bundesliga` → `BL1`
  - `ligue-1` → `FL1`, `world-cup` → `WC`, `euros` → `EC`
- Add competition logo/badge to StandingsTable header
- Support articles that mention 2 teams in different competitions (show both)
- TheSportsDB fallback for competitions not in football-data.org free tier

#### Phase 8 — Route-to-Final Analyzer
- Create `components/panels/sports/RouteToFinalCard.tsx`
  - For knockout competitions (UCL, WC, Euros): show bracket position of mentioned teams
  - "If they win this match, they face..." next-round prediction
  - Show rival team's form and pronostic for that hypothetical matchup
- This is a differentiator — no other news site shows this inline with an article
- Files: `components/panels/sports/RouteToFinalCard.tsx`, update sports registry

---

### WEEK 5 — Finance Panel Migration + Enhancement
**Goal:** Unify existing finance widgets into the panel system.

#### Phase 9 — Migrate FinanceOverlay to Panel System
- `components/finance/FinanceOverlay.tsx` → `components/panels/finance/FinancePanel.tsx`
- Wrap existing MarketCard + TickerChart + InsightCard into panel framework
- `lib/panels/fetchers/finance.ts` wraps existing `lib/finance/market.ts`
- Register `financePanels` in registry for verticals: `finance`, `economy`, `crypto`
- Article pages with finance vertical now auto-show the finance panel
- Ensure no regression on existing `/finance` dashboard (those components remain standalone)
- Files: `components/panels/finance/FinancePanel.tsx`, `lib/panels/fetchers/finance.ts`, registry update

#### Phase 10 — Ticker Auto-Detection + Sparkline Inline
- Extend `lib/finance/tickers.ts` ticker detection to work per article (already exists, expose it)
- `TickerSparklineCard.tsx` — compact inline version: ticker symbol, current price, 7-day mini chart, change %, AI signal badge if available
- For articles with multiple tickers: show top 2, with "See all →" link to `/finance/charts`
- Files: `components/panels/finance/TickerSparklineCard.tsx`

---

### WEEK 6 — Finance Intelligence Depth
**Goal:** Macro and crypto complete the finance panel.

#### Phase 11 — Macro Indicator Row
- Create `lib/panels/fetchers/fred.ts` — FRED API fetcher
  - Fed Funds Rate (`FEDFUNDS`), CPI YoY (`CPIAUCSL`), Unemployment (`UNRATE`), VIX (`VIXCLS`)
  - `revalidate: 86400` — FRED updates daily at most
- Create `components/panels/finance/MacroIndicatorRow.tsx`
  - 4 compact stat chips: rate, CPI, jobs, VIX — each with direction arrow
  - Auto-shown for `economy` vertical articles
- Files: `lib/panels/fetchers/fred.ts`, `components/panels/finance/MacroIndicatorRow.tsx`

#### Phase 12 — Crypto Panel
- Create `components/panels/finance/CryptoPanel.tsx`
  - BTC and ETH price + 24h change (Yahoo Finance unofficial)
  - Fear & Greed Index (alternative.me free API, no key)
  - Dominance % (CoinGecko free tier, 50 req/min)
- Register for `crypto` vertical
- Files: `components/panels/finance/CryptoPanel.tsx`, update `lib/panels/fetchers/finance.ts`

---

### WEEK 7 — World/Politics Panel Foundation
**Goal:** Articles about countries or conflicts get a context card.

#### Phase 13 — Country Profile Card
- Create `lib/panels/fetchers/world.ts`
  - `fetchCountryProfile(countryCode: string)` → REST Countries API
    - Returns: flag SVG, capital, population, region, currency, official language
  - Country code detection: from `panel_hints.country_codes` OR NLP heuristic on article content (simple country-name → ISO-3166 map)
- Create `components/panels/world/CountryProfileCard.tsx`
  - Flag, country name, key stats in 2-col grid
  - "More from [Country]" link → filters articles by country tag
- Register for `global-politics` vertical
- Files: `lib/panels/fetchers/world.ts`, `components/panels/world/CountryProfileCard.tsx`

#### Phase 14 — Conflict + Event Timeline
- Create `components/panels/world/ConflictTimeline.tsx`
  - Static JSON-driven (initially): major ongoing events with dates and short summaries
  - Powered by curated `content/panels/active-conflicts.json` (updated by editorial pipeline)
  - Future: GDELT API query for real-time event feed keyed to article's country codes
- This becomes a key differentiator: reading about Iran nuclear talks shows a timeline of the last 6 months of negotiations
- Files: `components/panels/world/ConflictTimeline.tsx`, `content/panels/active-conflicts.json`

---

### WEEK 8 — Politics Intelligence
**Goal:** Elections and trade data complete the world panel.

#### Phase 15 — Election Calendar Widget
- Create `components/panels/world/ElectionCalendar.tsx`
  - Data source: `content/panels/election-calendar.json` (manually curated, updated by pipeline)
  - Shows: upcoming elections in countries mentioned in article, days until, type (presidential/legislative)
  - Countdown badge for elections within 90 days
  - Future pipeline job: auto-update from Wikipedia election calendar scrape
- Files: `components/panels/world/ElectionCalendar.tsx`, `content/panels/election-calendar.json`

#### Phase 16 — Trade Data Panel
- Create `lib/panels/fetchers/world.ts` additions — World Bank WITS trade data
  - For articles tagged `trade`, `tariffs`, `sanctions`: fetch bilateral trade flows for mentioned countries
- Create `components/panels/world/TradeDataCard.tsx`
  - Export/import volumes, trade balance, top trading partners
  - Relevant for tariff/trade war articles (like US-China)
- Files: `components/panels/world/TradeDataCard.tsx`

---

### WEEK 9 — AI/Tech Panel Foundation
**Goal:** AI and tech articles feel like you're reading on GitHub.

#### Phase 17 — GitHub Repo Card
- Create `lib/panels/fetchers/tech.ts`
  - `fetchGitHubRepo(owner: string, repo: string)` → GitHub API
  - Returns: stars, forks, language, last commit, description, license, open issues
  - Repo detection: from `panel_hints.github_repos` OR regex scan for `github.com/owner/repo` in article content
- Create `components/panels/tech/GithubRepoCard.tsx`
  - Repo name, description, star/fork counts with icons, language badge, "last commit X days ago"
  - CTA: "View on GitHub →"
- Add `GITHUB_TOKEN` to `.env.local`
- Register for `ai`, `trends`, `cybersecurity` verticals
- Files: `lib/panels/fetchers/tech.ts`, `components/panels/tech/GithubRepoCard.tsx`

#### Phase 18 — HuggingFace Model Card + Paper Abstract
- `fetchHFModel(modelId: string)` → HuggingFace Hub API
  - Downloads, likes, tags, last modified, task type
- `fetchPaperWithCode(paperTitle: string)` → Papers With Code API
  - Abstract, GitHub implementation link, benchmark results, stars
- Create `components/panels/tech/ModelLeaderboardWidget.tsx`
  - For AI model articles: HF card + benchmark position in MMLU/HumanEval
- Create `components/panels/tech/PaperCard.tsx`
  - Paper title, abstract snippet, implementation link
- Files: `components/panels/tech/ModelLeaderboardWidget.tsx`, `components/panels/tech/PaperCard.tsx`

---

### WEEK 10 — AI/Tech Intelligence
**Goal:** Tech articles feel forward-looking.

#### Phase 19 — AI Leaderboard Widget
- `components/panels/tech/ModelLeaderboardWidget.tsx` enhancement
  - Pull latest LMSYS Chatbot Arena scores (scrape or HF leaderboard JSON, free)
  - Show top 5 current models with the article's discussed model highlighted
  - "As of [date]" — with `revalidate: 3600`
- This is high-value for AI articles: "where does GPT-5 rank right now?"

#### Phase 20 — Tech Job Market Signal
- Create `lib/panels/fetchers/tech.ts` additions
  - Stack Overflow Developer Survey data (static annual JSON, free download)
  - GitHub Jobs-adjacent: search GitHub for repos using the tech discussed in the article
- Create `components/panels/tech/TechSignalCard.tsx`
  - "X repos created this month using [technology]"
  - Trending repos in the technology area (GitHub trending scrape or RSS)
  - Developer demand signal based on SO survey data
- Files: `components/panels/tech/TechSignalCard.tsx`

---

### WEEK 11 — Science/Space Panel
**Goal:** Space and science articles feel like Mission Control.

#### Phase 21 — Launch Tracker + NASA APOD
- Create `lib/panels/fetchers/science.ts`
  - `fetchUpcomingLaunches()` → Launch Library 2 (LL2): `/2.2.0/launch/upcoming/?limit=5`
  - `fetchNASAAPOD()` → `api.nasa.gov/planetary/apod`
  - `fetchMissionStatus(missionName: string)` → LL2 mission search
- Create `components/panels/science/LaunchTrackerCard.tsx`
  - Next 3 upcoming launches: vehicle, payload, date, pad, status
  - Countdown timer for imminent launches (< 7 days)
- Create `components/panels/science/APODCard.tsx`
  - NASA Astronomy Picture of the Day: image thumbnail, title, explanation snippet
- Register for `space` vertical
- Add `NASA_API_KEY` to `.env.local`
- Files: `lib/panels/fetchers/science.ts`, `components/panels/science/LaunchTrackerCard.tsx`, `components/panels/science/APODCard.tsx`

#### Phase 22 — ISS Position + Mission Status
- Create `components/panels/science/ISSPositionCard.tsx`
  - Live ISS position from Open Notify (no key, free)
  - Leaflet.js map (already likely in stack or add lightweight) showing current position
  - "ISS is currently over [country/ocean]" text
  - `revalidate: 30` — ISS moves fast
- Create `components/panels/science/MissionStatusCard.tsx`
  - For articles mentioning a specific mission (from `panel_hints.nasa_mission`)
  - Status, crew if crewed, launch/landing dates, key milestones
- Files: `components/panels/science/ISSPositionCard.tsx`, `components/panels/science/MissionStatusCard.tsx`

---

### WEEK 12 — Health/Wellness Panel
**Goal:** Health articles you can act on immediately.

#### Phase 23 — FDA Alert Feed
- Create `lib/panels/fetchers/wellness.ts`
  - `fetchFDAAlerts(drugOrCondition: string)` → OpenFDA `/drug/event.json` and `/drug/recall.json`
  - Detect drug names/conditions from article tags or `panel_hints`
- Create `components/panels/wellness/FDAAlertCard.tsx`
  - Recent recalls/alerts relevant to article topic
  - Severity badges (Class I/II/III recall)
  - "Reported in last 30 days" filter
- Register for `healthcare`, `skincare` verticals
- Files: `lib/panels/fetchers/wellness.ts`, `components/panels/wellness/FDAAlertCard.tsx`

#### Phase 24 — WHO Bulletin + Clinical Trial Count
- `fetchWHOBulletin()` → WHO GHO API — disease outbreak news feed
- `fetchClinicalTrials(condition: string)` → ClinicalTrials.gov API v2 (free, no key)
  - Count of active trials for the condition discussed in the article
- Create `components/panels/wellness/WHOBulletinCard.tsx`
- Create `components/panels/wellness/ClinicalTrialCounter.tsx`
  - "X active clinical trials for [condition]" with link to ClinicalTrials.gov search
- Files: `components/panels/wellness/WHOBulletinCard.tsx`, `components/panels/wellness/ClinicalTrialCounter.tsx`

---

### WEEK 13 — Climate/Energy Panel
**Goal:** Climate articles grounded in actual data, not just narrative.

#### Phase 25 — CO2 Widget + Temperature Anomaly
- Create `lib/panels/fetchers/climate.ts`
  - `fetchCO2Level()` → NOAA Mauna Loa CO2 data (free CSV, updated weekly)
    - Parse CSV, return current ppm + year-over-year change
  - `fetchTempAnomaly()` → NOAA Global Surface Temperature (GISTEMP data, free)
  - `fetchWeatherExtreme(location: string)` → Open-Meteo historical API
- Create `components/panels/climate/CO2Widget.tsx`
  - Current CO2 ppm, trend arrow, "vs pre-industrial baseline (280 ppm)"
  - Mini sparkline of last 12 months
- Create `components/panels/climate/TempAnomalyChart.tsx`
  - Current year's temperature anomaly vs 1951-1980 average
- Register for `climate`, `energy` verticals
- Files: `lib/panels/fetchers/climate.ts`, both components

#### Phase 26 — Renewable Energy Capacity Tracker
- IRENA (International Renewable Energy Agency) publishes free annual CSV datasets
- Parse and store as `content/panels/renewable-capacity.json` (refreshed annually)
- Create `components/panels/climate/RenewableCapacityCard.tsx`
  - Global installed capacity for solar/wind/hydro
  - Country-specific data if country is mentioned in article
  - YoY growth rate highlighted
- Files: `components/panels/climate/RenewableCapacityCard.tsx`, `content/panels/renewable-capacity.json`

---

### WEEK 14 — Culture/Anime Panel
**Goal:** Anime and culture articles feel like a fan hub.

#### Phase 27 — Anime Season Chart
- Create `lib/panels/fetchers/culture.ts`
  - `fetchCurrentSeasonAnime()` → Jikan v4 `/seasons/now` — top airing titles
  - `fetchAnimeDetails(malId: number)` → Jikan `/anime/{id}`
  - Anime detection: article tags → MAL title search
- Create `components/panels/culture/AniSeasonCard.tsx`
  - Current season chart: top 5 airing shows with score, episode count, genre tags
  - Mentioned anime highlighted with amber border
  - Next episode countdown for airing shows
- Register for `anime` vertical
- Files: `lib/panels/fetchers/culture.ts`, `components/panels/culture/AniSeasonCard.tsx`

#### Phase 28 — AniList Rich Panel
- AniList GraphQL (free, 90 req/min) provides richer data than Jikan
  - Studio info, source material, streaming platforms, trailer embed (YouTube)
- Create `components/panels/culture/AnilistProfileCard.tsx`
  - Full show card: cover art, synopsis snippet, status (RELEASING/FINISHED), score, streaming links
  - Season/year context
- Files: `components/panels/culture/AnilistProfileCard.tsx`

---

### WEEK 15 — Gaming Panel
**Goal:** Gaming articles come with a mini store page.

#### Phase 29 — RAWG Game Profile Card
- Create `lib/panels/fetchers/culture.ts` additions
  - `fetchGameDetails(gameName: string)` → RAWG `/games/{slug}` or search
  - Returns: Metacritic score, release date, platforms, genres, ESRB, screenshots
- Create `components/panels/culture/GameProfileCard.tsx`
  - Cover art (from RAWG), title, score badges (Metacritic + user), platforms row
  - Release date + "X days until release" if upcoming
  - Genre/tag chips
- Add `RAWG_API_KEY` to `.env.local`
- Register for `gaming` vertical
- Files: `components/panels/culture/GameProfileCard.tsx`

#### Phase 30 — Release Calendar
- `fetchUpcomingGames(query: string)` → RAWG with date range filter
- Create `components/panels/culture/ReleasesCalendarCard.tsx`
  - List of upcoming game releases in the same genre/platform as article's game
  - "Coming this month / this quarter"
- Also: box office data for `culture` articles via TMDB `/trending/movie/week` (free)
- Create `components/panels/culture/BoxOfficeCard.tsx`
- Files: `components/panels/culture/ReleasesCalendarCard.tsx`, `components/panels/culture/BoxOfficeCard.tsx`

---

### WEEK 16 — Trends Panel
**Goal:** Trends articles show the actual virality data.

#### Phase 31 — Google Trends Integration
- Google Trends has no official API, but `pytrends` (Python) or the unofficial JS `google-trends-api` package work
- Build a small Node.js serverless function (`app/api/trends/route.ts`) that:
  - Accepts a keyword, calls `google-trends-api`, returns 7-day interest-over-time data
  - Caches result in-memory (or `content/panels/trends-cache/`) for 1 hour
- Create `components/panels/trends/GoogleTrendsSparkline.tsx`
  - Mini line chart showing 7-day trend for article's primary keyword
  - "Interest over time" label + current relative score
- Register for `trends` vertical
- Files: `app/api/trends/route.ts`, `components/panels/trends/GoogleTrendsSparkline.tsx`

#### Phase 32 — Reddit Sentiment Meter
- Reddit API free tier (60 req/min with app credentials)
- `app/api/reddit/route.ts` — search for article topic in relevant subreddits
  - Returns: top 3 posts (title, upvotes, comment count, sentiment)
- Create `components/panels/trends/RedditSentimentCard.tsx`
  - Sentiment meter: Positive / Neutral / Negative (keyword-based simple scoring)
  - Top thread previews with upvote counts
  - "Discussion is [heating up / cooling down] based on activity"
- Files: `app/api/reddit/route.ts`, `components/panels/trends/RedditSentimentCard.tsx`

---

### WEEK 17 — Mobile Panel UX Polish
**Goal:** The mobile experience is buttery. Not an afterthought.

#### Phase 33 — Smooth Gesture Drawer
- Upgrade `PanelDrawer.tsx` from CSS-only to pointer-event gesture handling
  - `onPointerDown` → track drag delta → `transform: translateY()`
  - Snap to two states: collapsed (48px visible) or expanded (75vh)
  - Velocity-based snap: flick up → expand, flick down → collapse
  - Background overlay (semi-transparent) when expanded
- Drawer peek shows: icon row of available panel sections (e.g. ⚽ standings, 📊 pronostic)
- Haptic feedback hint: animate tab bar badge when panel data loads
- Files: `components/article-panel/PanelDrawer.tsx` (upgrade)

#### Phase 34 — Panel Tab Bar + Multi-Section Navigation
- Upgrade `PanelTabBar.tsx`
  - Horizontal scrollable tab bar when panel has > 2 sections
  - Active tab indicator (amber underline)
  - Tab icons + short labels (e.g., "Standings", "Pronostic", "Fixtures")
  - Badge with section count on the drawer handle
- Keyboard navigation for desktop (arrow keys between tabs)
- URL hash state: `#panel-standings` — so panel tab state is shareable in a link
- Files: `components/article-panel/PanelTabBar.tsx` (upgrade), `PanelDrawer.tsx`

---

### WEEK 18 — Reader App Integration (/app)
**Goal:** Panels work in Focus and Flow modes too.

#### Phase 35 — Focus Mode Panel Integration
- In `components/news-app-shell.tsx` Focus mode: add an "Intelligence" button below each article card
  - Tapping the button expands a panel inline below the card (not a drawer — it's already mobile-first)
  - Panel data is lazy-loaded on first open (don't fetch until user expands)
  - Collapse animation mirrors the article drawer
- Server-side: `getAllArticles()` returns `panel_hints`, pass through to `AppArticle` type
- Files: `components/news-app-shell.tsx`, `lib/articles.ts`

#### Phase 36 — Flow Mode Panel Integration
- In Flow mode (TikTok-style snap): a small tab strip visible at bottom-left of each card
  - "📊 Intelligence" pill — tapping opens a half-sheet overlay on top of the Flow card
  - Overlay closes on swipe down (consistent with Flow's vertical swipe gesture)
  - Panel sections in Flow mode: max 2 (most important only — e.g. Pronostic + Standings for sports)
- Files: `components/news-app-shell.tsx`

---

### WEEK 19 — Editorial AI Pipeline Updates
**Goal:** Articles auto-arrive with panel hints. No manual frontmatter editing.

#### Phase 37 — Writer Agent panel_hints Output
- Update `Writer` agent prompt in `/opt/mimoun/openclaw-config/workspace/newsbites_editorial/prompts/small-model/`
  - After article draft, Writer must produce a `PANEL_HINTS:` block:
    ```
    PANEL_HINTS:
    competition: <football-data.org code if sports/football>
    teams: <comma-separated team names if sports>
    tickers: <stock tickers if finance>
    country_codes: <ISO-3166 codes for countries mentioned>
    github_repos: <owner/repo if tech>
    ```
  - Update `Publisher Desk` agent to parse this block and inject it into article frontmatter
- Files: relevant prompt files in `prompts/small-model/`, `scripts/validate-story-package.mjs`

#### Phase 38 — Panel Cache Warming at Publish Time
- Create `scripts/warm-panel-cache.mjs`
  - Reads a published article's frontmatter + `panel_hints`
  - Pre-fetches panel data (standings, country profile, etc.) and writes to `content/panels/cache/[slug].json`
  - Called by `Publisher Desk` after article is approved
- Next.js pages read from cache file first, fall back to live API
- This solves cold-start latency: first reader after publish sees pre-warmed data
- Files: `scripts/warm-panel-cache.mjs`, adapt panel fetchers to check cache first

---

### WEEK 20 — Pronostics Engine V2
**Goal:** Pronostics become the most cited feature.

#### Phase 39 — Injury/Suspension Signals
- TheSportsDB free API provides squad information
- Add `fetchTeamInjuries(teamId: number)` — TheSportsDB `/api/v1/json/3/searchplayers.php`
- Pronostics engine V2:
  - If key player injured/suspended: reduce that team's attack/defense weight
  - Key player = player with most goals or assists in last 5 matches
  - Show injury disclaimer in PronosticWidget: "Note: [Player] is suspended"
- Files: update `lib/panels/pronostics.ts`, `components/panels/sports/PronosticWidget.tsx`

#### Phase 40 — NBA + F1 Pronostics
- **NBA** (balldontlie.io, free with key):
  - Standings, team stats, recent game results
  - Pronostic: win probability based on Elo rating + home court + recent form
  - Create `components/panels/sports/NBAStandingsCard.tsx`, extend pronostics engine
- **F1** (OpenF1 free API or Ergast):
  - Current standings (drivers + constructors)
  - Next race schedule, circuit info
  - "Expected podium" based on constructor pace + qualifying position
  - Create `components/panels/sports/F1RaceCard.tsx`
- Tag detection: `formula-1`, `f1` → F1 panels; `nba`, `basketball` → NBA panels
- Files: `components/panels/sports/NBAStandingsCard.tsx`, `components/panels/sports/F1RaceCard.tsx`

---

### WEEK 21 — Finance Embedding + CTA Framework
**Goal:** Articles convert readers to the Finance dashboard. Establish the CTA pattern.

#### Phase 41 — Inline Article Finance Embed
- For finance/economy articles: after every article body, auto-inject a "Market Context" block
  - Full-width section (not in panel, embedded IN the article): relevant tickers, their performance since article date, "how did the market react?"
  - Server-rendered via RSC, ISR `revalidate: 300`
- This is the "article has a trading floor below it" moment
- Create `components/ArticleMarketContext.tsx`
  - Shows detected tickers with sparkline + % change since article publish date
  - "The day this article ran, [TICKER] moved X%"
- Files: `components/ArticleMarketContext.tsx`, `app/articles/[slug]/page.tsx`

#### Phase 42 — Universal CTA Framework
- Each panel section can emit a `cta` config: `{ label: string, href: string, icon: LucideIcon }`
- Panel footer in `ArticleIntelPanel.tsx` renders a "Go deeper →" CTA button
  - Sports: "Full match coverage →" → future `/sports/[competition]`
  - Finance: "Finance Intelligence →" → `/finance`
  - World: "Regional briefing →" → future `/world/[region]`
  - Tech: "AI tracker →" → future `/tech/ai-tracker`
- This pattern seeds all future group dashboards
- Files: `components/article-panel/ArticleIntelPanel.tsx`, all panel config objects

---

### WEEK 22 — Sports Dashboard
**Goal:** `/sports` becomes the second full group dashboard after `/finance`.

#### Phase 43 — /sports Landing Page
- Create `app/sports/layout.tsx` + `app/sports/page.tsx`
  - Mirror `/finance` structure: hero section, live scores grid, standings snapshot, recent results
  - Live scores via football-data.org + TheSportsDB
  - "Today's matches" section — all major competitions
  - Top pronostics for today's matches (autogenerated by pronostics engine)
- Create `app/sports/page.tsx` as server component with `revalidate: 60`
- Files: `app/sports/layout.tsx`, `app/sports/page.tsx`

#### Phase 44 — /sports/[competition] Pages
- Create `app/sports/[competition]/page.tsx`
  - Full standings table for the competition
  - Last 5 matchday results with scores
  - Upcoming schedule (next 10 matches)
  - Top scorers table
  - Link back to all articles tagged with that competition
- Generate static routes for supported competitions: `CL`, `PL`, `PD`, `SA`, `BL1`
- Files: `app/sports/[competition]/page.tsx`

---

### WEEK 23 — Panel Performance Audit
**Goal:** No panel ever blocks article render. Data freshness is correct.

#### Phase 45 — ISR Strategy Review
- Audit every panel fetcher's `revalidate` value (see table in ISR section above)
- For panels that use external APIs with strict rate limits (football-data.org: 10/min):
  - Add in-memory request coalescing in `lib/panels/fetchers/sports.ts`
  - Multiple concurrent requests for same competition → single API call + shared result
- Add `Suspense` boundaries around every panel section:
  - Panel section that's loading: shows `PanelSkeleton.tsx`
  - Panel section that errored: shows nothing (silent, article is primary)
- Files: all panel fetchers, `components/article-panel/ArticleIntelPanel.tsx`

#### Phase 46 — Error Boundaries + Skeleton States
- `PanelErrorBoundary.tsx`: catches render errors in any panel section, renders nothing
- `PanelSkeleton.tsx`: animated pulse skeleton matching the shape of each panel type
  - Standings skeleton: 5 rows of grey bars
  - Market card skeleton: 2 lines + a sparkline area
  - Pronostic skeleton: 3 probability bars
- Test all panels with API offline (mock 500 response): confirm articles remain intact
- Files: `components/article-panel/PanelErrorBoundary.tsx`, `PanelSkeleton.tsx`

---

### WEEK 24 — Cross-Vertical Intelligence
**Goal:** Panels can combine signals from multiple verticals.

#### Phase 47 — Cross-Vertical Panel Injection
- An AI article that mentions NVIDIA stock → shows BOTH the Tech panel AND a finance mini-panel
- A sports article about a club acquisition → shows BOTH sports panel AND finance ticker panel
- Implement in `lib/panels/registry.ts`: cross-vertical signal detection
  - If `panel_hints.tickers` present AND vertical is NOT finance → add compact `TickerSparklineCard` as secondary section
  - If `panel_hints.github_repos` present AND vertical is NOT tech → add compact `GithubRepoCard`
- Files: `lib/panels/registry.ts`

#### Phase 48 — Tag-Based Panel Override
- Panel injection by tag regardless of vertical
  - `tags: ["champions-league"]` → loads CL panel even if article is tagged `world` or `finance`
  - `tags: ["bitcoin", "btc"]` → loads crypto panel even if vertical is `trends`
  - `tags: ["nasa", "spacex", "launch"]` → loads launch tracker
- This means sports/finance/science panels appear anywhere relevant, not locked to their vertical
- Create canonical tag → panel mapping in `lib/panels/registry.ts`
- Files: `lib/panels/registry.ts`

---

### WEEK 25 — Personalization Foundation
**Goal:** The app remembers what the reader cares about.

#### Phase 49 — localStorage Panel Preferences
- Panel state stored in `localStorage` under `newsbites-panel-prefs`:
  ```json
  {
    "defaultExpanded": true,
    "hiddenSections": ["GoogleTrends"],
    "pinnedTab": { "sports": "pronostic" }
  }
  ```
- `PanelTabBar` reads prefs to restore last-viewed tab
- Settings toggle in panel header: "Hide this section" per section
- `PanelDrawer` reads `defaultExpanded` to decide initial state
- Files: `components/article-panel/ArticleIntelPanel.tsx`, `components/article-panel/PanelTabBar.tsx`

#### Phase 50 — Vertical + Team Subscriptions (localStorage)
- `newsbites-subscriptions` localStorage key:
  ```json
  {
    "teams": ["Arsenal", "Bayern Munich"],
    "verticals": ["ai", "sports"],
    "tickers": ["NVDA", "AAPL"]
  }
  ```
- Panel personalization: subscribed teams get expanded by default and highlighted in standings
- Subscribed tickers: always show in finance panel even if not mentioned in article
- Favorite verticals: `/app` reader pre-filters to these by default
- No backend, no auth — pure client-side for now
- Files: new `lib/subscriptions.ts`, `components/article-panel/ArticleIntelPanel.tsx`, `components/news-app-shell.tsx`

---

### WEEK 26 — Polish, Connectivity, Master Audit
**Goal:** Everything works. Everything is discoverable. Plan V2 can begin.

#### Phase 51 — Panel Deep Links
- Panel state encoded in URL: `?panel=pronostic` → opens panel with that tab active on load
- Share button in panel header: copies current URL with panel state
  - "Share this analysis →" — copies URL with `?panel=pronostic#article-panel`
- Panel CTA links from Mimule Telegram bot: when Mimule sends an article link, it can append `?panel=standings` to deep-link to the relevant panel
- Files: `components/article-panel/ArticleIntelPanel.tsx`, `PanelTabBar.tsx`

#### Phase 52 — Full Editorial Audit + V2 Scoping
- Run through all 20 existing articles: add `panel_hints` frontmatter where missing
- Verify every panel that should render does render (Champions League → sports, finance articles → tickers, etc.)
- Fix any broken fetchers found during audit
- Document which free APIs are hitting limits and need upgrade or caching strategy
- Write `NEWSBITES_LEVELING_PLAN_V2.md`:
  - Security hardening phase (when Marouane says so)
  - Backend personalization (move subscriptions from localStorage to DB)
  - /world, /tech, /science group dashboards (parallel to /finance and /sports)
  - Mobile app (React Native or PWA with install prompt)
  - Mimule integration: bot can query panel data and send Telegram briefings from it

---

## Preparation Checklist (Before Phase 1)

Before any code is written, these must be in place:

- [ ] Register free API keys and add to `.env.local`:
  - `FOOTBALL_DATA_API_KEY` → football-data.org (free registration)
  - `NASA_API_KEY` → api.nasa.gov (free registration)
  - `RAWG_API_KEY` → rawg.io (free registration)
  - `TMDB_API_KEY` → themoviedb.org (free registration)
  - `GITHUB_TOKEN` → github.com/settings/tokens (Personal Access Token, read-only, public repos only)
  - `FRED_API_KEY` → fred.stlouisfed.org (free registration)
  - `NASA_API_KEY` (also covers APOD + Earth APIs)
  - Reddit app credentials (client_id + client_secret) at reddit.com/prefs/apps
- [ ] Verify current article layout file path: `app/articles/[slug]/page.tsx`
- [ ] Verify no existing panel-like code would conflict
- [ ] Create `content/panels/` directory and seed initial JSON files
- [ ] Add `panel_hints` to `Article` frontmatter type (non-breaking, optional field)
- [ ] Document current article page column width so we know what to change for 2-col layout

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| football-data.org free tier too restrictive (10 req/min) | Medium | Aggressive ISR caching (300s standings), never poll on client side |
| Yahoo Finance unofficial API breaks | Medium | Fallback to Alpha Vantage (25/day) for article-time data, FRED for macro |
| Google Trends unofficial library breaks | High | Fallback to static "trending topics" from editorial pipeline, remove panel section gracefully |
| Article layout 2-col breaks mobile | Low | Progressive enhancement — panel is always secondary, mobile layout never changes |
| Launch Library 2 / ISS APIs down | Low | Both have alternatives (SpaceX API, wheretheiss.at) |
| Panel data slows article page load | Medium | Suspense boundaries + skeleton + ISR means panel is never on critical path |
| New Next.js 16 breaking changes in layouts | Medium | Read `node_modules/next/dist/docs/` before touching layouts |

---

## Phase Completion Tracker

| Week | Phase | Title | Status |
|---|---|---|---|
| 1 | 1 | ArticleIntelPanel Shell | - |
| 1 | 2 | Panel Registry + Type System | - |
| 2 | 3 | Football Data Fetcher | - |
| 2 | 4 | Standings + Fixtures Components | - |
| 3 | 5 | Pronostics Engine | - |
| 3 | 6 | Team Mini-Card + Match Results | - |
| 4 | 7 | Multi-Competition Detection | - |
| 4 | 8 | Route-to-Final Analyzer | - |
| 5 | 9 | Finance Panel Migration | - |
| 5 | 10 | Ticker Auto-Detection + Sparkline | - |
| 6 | 11 | Macro Indicator Row | - |
| 6 | 12 | Crypto Panel | - |
| 7 | 13 | Country Profile Card | - |
| 7 | 14 | Conflict + Event Timeline | - |
| 8 | 15 | Election Calendar Widget | - |
| 8 | 16 | Trade Data Panel | - |
| 9 | 17 | GitHub Repo Card | - |
| 9 | 18 | HuggingFace + Papers With Code | - |
| 10 | 19 | AI Leaderboard Widget | - |
| 10 | 20 | Tech Job Market Signal | - |
| 11 | 21 | Launch Tracker + NASA APOD | - |
| 11 | 22 | ISS Position + Mission Status | - |
| 12 | 23 | FDA Alert Feed | - |
| 12 | 24 | WHO Bulletin + Clinical Trials | - |
| 13 | 25 | CO2 Widget + Temp Anomaly | - |
| 13 | 26 | Renewable Energy Tracker | - |
| 14 | 27 | Anime Season Chart | - |
| 14 | 28 | AniList Rich Panel | - |
| 15 | 29 | RAWG Game Profile Card | - |
| 15 | 30 | Release Calendar + Box Office | - |
| 16 | 31 | Google Trends Sparkline | - |
| 16 | 32 | Reddit Sentiment Meter | - |
| 17 | 33 | Smooth Gesture Drawer | - |
| 17 | 34 | Panel Tab Bar + Multi-Section | - |
| 18 | 35 | Focus Mode Panel Integration | - |
| 18 | 36 | Flow Mode Panel Integration | - |
| 19 | 37 | Writer Agent panel_hints Output | - |
| 19 | 38 | Panel Cache Warming at Publish | - |
| 20 | 39 | Pronostics V2: Injuries | - |
| 20 | 40 | NBA + F1 Pronostics | - |
| 21 | 41 | Inline Article Finance Embed | - |
| 21 | 42 | Universal CTA Framework | - |
| 22 | 43 | /sports Landing Page | - |
| 22 | 44 | /sports/[competition] Pages | - |
| 23 | 45 | ISR Strategy Review | - |
| 23 | 46 | Error Boundaries + Skeletons | - |
| 24 | 47 | Cross-Vertical Panel Injection | - |
| 24 | 48 | Tag-Based Panel Override | - |
| 25 | 49 | localStorage Panel Preferences | - |
| 25 | 50 | Vertical + Team Subscriptions | - |
| 26 | 51 | Panel Deep Links | - |
| 26 | 52 | Full Audit + V2 Scoping | - |

---

## Progress Log

### 2026-04-17

- Audited the implementation against the V1 contract and corrected three gaps in the live app:
  silent panel fallback, sports panel over-registration, and the desktop article rail width/behavior.
- `ArticleIntelPanel` and related reader-panel helpers now hide unavailable panel sections instead of surfacing visible empty-state cards, aligning with the V1 graceful-degradation rule.
- Sports registration was split by signal type:
  football panels register only for football-specific hints/tags,
  NBA panels only for NBA/basketball tags,
  F1 panels only for F1/formula tags.
- Article layout CSS now uses a `320px` desktop sidebar column with sticky behavior at desktop widths while preserving the current site styling framework and mobile drawer behavior.
- Production verification completed after rebuild/restart:
  the Champions League semi-final article now serves only the relevant football sections on the live app process.

---

*This document is the execution contract for the Intelligence Layer build-out.*  
*Update the tracker table as phases complete. Append blockers inline in the relevant phase section.*  
*When all 52 phases are done, the V2 scoping in Phase 52 becomes the next document.*
