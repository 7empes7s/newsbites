# V2 Block I — Group Dashboards
**Phases 96–99 | Depends on: V1 Phases 13–16 (world), 17–20 (tech), 21–22 (science), 27–30 (culture)**

> **Read `CONTEXT.md` first.** V1 builds the `/finance` and `/sports` dashboards. This block adds the remaining four group dashboards. Each follows the sector-specific credibility bar — designed for practitioners, not casual visitors.

---

## Why This Block Exists

The `/finance` dashboard (already live) proved that a vertical can have its own intelligence layer beyond article lists. This block replicates that pattern for the other four groups that benefit from live data: World, Tech, Science, Culture.

Each dashboard is a **standalone landing page** that:
1. Surfaces live data relevant to the vertical (country hotspots, model leaderboard, launch tracker, anime season)
2. Shows the most recent articles in that group
3. Links to individual articles from the panel data (e.g., "Read our Ukraine coverage →")

**Rule:** Only build a dashboard for a vertical that already has panel components from V1. Do not stub dashboards for verticals without data sources.

---

## Phase 96 — /world Landing Page

**Goal:** A dashboard for global-politics readers: country hotspots, active conflicts, upcoming elections, recent coverage.

**Depends on:** V1 Phases 13–16 (CountryProfileCard, ConflictTimeline, ElectionCalendar, TradeDataCard).

### File: `app/world/page.tsx`

Structure:

```
Hero: "World Intelligence" heading + subtext
──────────────────────────────────────────
Active Hotspots     │ Upcoming Elections
(3 country cards)   │ (next 5 globally, with countdown)
──────────────────────────────────────────
Active Conflict Timeline
(aggregated from all world articles' conflict data)
──────────────────────────────────────────
Recent Coverage
(latest world + global-politics articles as cards)
```

Data sources:
- Country cards: REST Countries API (same fetcher from V1 Phase 13) — show the 3 countries with the most recent article coverage
- Elections: static `content/panels/election-calendar.json` from V1 Phase 15
- Conflict timeline: static `content/panels/active-conflicts.json` from V1 Phase 14
- Recent coverage: `getArticlesByGroup('world')` filtered to latest 6

### File: `app/world/layout.tsx`

Minimal layout — no site-chrome header override needed. Use the standard site chrome. Add `<title>World Intelligence — TechInsiderBytes</title>`.

### Link from main nav

Add "World" link to the group nav in `components/site-chrome.tsx` (alongside the existing Finance link added in an earlier session).

### How to test
1. Navigate to `https://news.techinsiderbytes.com/world`
2. Country cards for the most-covered countries appear
3. Upcoming elections show with countdown timers
4. Recent world articles appear at the bottom

**Files:** `app/world/page.tsx`, `app/world/layout.tsx`, `components/site-chrome.tsx`

---

## Phase 97 — /tech Landing Page

**Goal:** A dashboard for tech and AI readers: trending repos, AI model leaderboard snapshot, recent papers, coverage.

**Depends on:** V1 Phases 17–20 (GithubRepoCard, ModelLeaderboardWidget, PaperCard, TechSignalCard).

### File: `app/tech/page.tsx`

Structure:

```
Hero: "Tech Intelligence" heading
──────────────────────────────────────────
Trending This Week       │ AI Leaderboard
(top 5 GitHub repos)     │ (top 5 LMSYS models)
──────────────────────────────────────────
Recent Papers
(latest Papers With Code entries referenced in articles)
──────────────────────────────────────────
Recent Coverage
(latest ai + trends + cybersecurity articles)
```

Data sources:
- GitHub trending: GitHub REST API `/search/repositories?q=stars:>1000&sort=stars&order=desc` filtered to repos created in the last week, or a cached snapshot at `content/panels/github-trending.json`
- AI leaderboard: `content/panels/ai-leaderboard.json` snapshot (from V1 Phase 19)
- Papers: sourced from article `panel_hints.arxiv_id` fields across recent articles
- Recent coverage: `getArticlesByGroup('tech')` filtered to latest 6

### Link from main nav

Add "Tech" link alongside the World link added in Phase 96.

### How to test
1. Navigate to `https://news.techinsiderbytes.com/tech`
2. GitHub trending repos shown
3. AI leaderboard shows top 5 models
4. Recent tech/AI articles appear at the bottom

**Files:** `app/tech/page.tsx`, `app/tech/layout.tsx`, `components/site-chrome.tsx`

---

## Phase 98 — /science Landing Page

**Goal:** A dashboard for science and space readers: upcoming launches, ISS position, NASA APOD, recent coverage.

**Depends on:** V1 Phases 21–22 (LaunchTrackerCard, APODCard, ISSPositionCard, MissionStatusCard).

### File: `app/science/page.tsx`

Structure:

```
Hero: "Science & Space Intelligence" heading
──────────────────────────────────────────
Next Launch (full card with countdown) │ NASA APOD
──────────────────────────────────────────
ISS Live Tracker
(lat/lng readout updating every 30s — client component)
──────────────────────────────────────────
Upcoming Launches (next 5 in compact list)
──────────────────────────────────────────
Recent Coverage
(latest space + science articles)
```

Data sources:
- Launch data: Launch Library 2 API (same fetcher from V1 Phase 21)
- APOD: NASA API (same fetcher from V1 Phase 21)
- ISS: ISSPositionCard client component from V1 Phase 22 (reuse directly)
- Recent coverage: articles with `vertical === 'space' || vertical === 'science'`

The countdown timer for the next launch uses a client component (`use client`, `useEffect` interval). The page otherwise static-renders at build time and revalidates every 30 minutes.

### How to test
1. Navigate to `https://news.techinsiderbytes.com/science`
2. Next launch shows with live countdown
3. APOD shows today's image
4. ISS position updates every 30 seconds

**Files:** `app/science/page.tsx`, `app/science/layout.tsx`, `components/site-chrome.tsx`

---

## Phase 99 — /culture Landing Page

**Goal:** A dashboard for culture readers: anime season chart, upcoming game releases, trending movies (box office), recent coverage.

**Depends on:** V1 Phases 27–30 (AniSeasonCard, GameProfileCard, BoxOfficeCard — these are scheduled for V1 Block 9 culture weeks).

### File: `app/culture/page.tsx`

Structure:

```
Hero: "Culture Intelligence" heading
──────────────────────────────────────────
This Season — Anime    │ Upcoming Games
(top 5 airing shows)   │ (next 5 releases)
──────────────────────────────────────────
Trending at the Box Office
(top 5 TMDB trending movies this week)
──────────────────────────────────────────
Recent Coverage
(latest anime + gaming + culture articles)
```

Data sources:
- Anime: Jikan v4 API (MyAnimeList, no key) — current season, sorted by score
- Games: RAWG API (free key) — upcoming games in the next 30 days
- Box office: TMDB API (free key, `/trending/movie/week`)
- Recent coverage: articles with `vertical` in `['anime', 'gaming', 'culture']`

### How to test
1. Navigate to `https://news.techinsiderbytes.com/culture`
2. Anime season grid shows top 5 airing shows with scores
3. Upcoming games show with release dates
4. Trending movies appear
5. Recent culture articles appear at the bottom

**Files:** `app/culture/page.tsx`, `app/culture/layout.tsx`, `components/site-chrome.tsx`

---

## Done Checklist

- [ ] Phase 96: `/world` renders with country cards, election calendar, conflict timeline, recent articles
- [ ] Phase 96: "World" link added to main nav
- [ ] Phase 96: REST Countries data loads correctly
- [ ] Phase 97: `/tech` renders with GitHub trending, AI leaderboard, recent papers, recent articles
- [ ] Phase 97: "Tech" link added to main nav
- [ ] Phase 98: `/science` renders with next launch countdown, APOD, ISS position, recent articles
- [ ] Phase 98: ISS position updates every 30 seconds (client component)
- [ ] Phase 99: `/culture` renders with anime season, upcoming games, box office, recent articles
- [ ] All four dashboards: no regression on main site navigation
- [ ] All four dashboards: no broken API calls when verticals have 0 articles
