# Carryover Backlog — Residual V1 Work + Early V2 Gaps
**Follow-up to: `v1-13-dashboards-polish.md`, unresolved `v1-12-editorial-pronostics.md` work, and partially implemented `v2-B-reader-experience.md` scope**

> **Read `CONTEXT.md` first.** This file exists because parts of `v1-13` were marked complete in the checklist but are not fully implemented in the codebase.

---

## What You're Building

Close out the unfinished parts of the NewsBites plan without redoing work that already exists. This file tracks:

- residual V1 intelligence-layer work that is still partial or missing
- V2 reader-experience features that were only partially implemented

This block is only for scope that is still partial or missing:

- finish the sports dashboards
- wire the injury-aware pronostic path that exists on disk but is not used in live panel rendering
- wire the panel preference system into the actual UI
- wire the subscription helpers into the reader and panels
- complete the editorial audit and article `panel_hints` backfill
- replace the generic panel error wrapper with the dedicated one the plan called for

Do **not** rebuild the CTA framework, cross-vertical injection, or tag overrides here. Those already exist.

---

## Phase 43R — Finish `/sports` Landing Page

**Files:** `app/sports/page.tsx`, supporting sports fetchers/components as needed

The current page has hero content, competition snapshots, and article cards, but it still misses the pieces that `v1-13` described:

- a live or today's scores grid covering all major supported competitions
- a standings snapshot section that clearly shows CL and PL top 5
- a today's top pronostics section generated from real sports panel signals

### Requirements

- Keep the page as a server component with `revalidate: 60`
- Use the existing supported competition set already used elsewhere: `CL`, `PL`, `PD`, `SA`, `BL1`
- Reuse existing sports fetchers before adding new ones
- If live-score coverage depends on an API that does not expose a clean "live only" mode, show today's matches and clearly label the section accordingly

### Test

- `npm run build`
- `curl http://localhost:3001/sports`
- Visually confirm the page includes scores, standings snapshot, pronostics, and latest article cards

---

## Phase 44R — Finish `/sports/[competition]` Pages

**File:** `app/sports/[competition]/page.tsx`

The route exists, but it still lacks two planned sections:

- last 5 matchday results with scores
- top scorers table

### Requirements

- Keep `generateStaticParams()` for `CL`, `PL`, `PD`, `SA`, `BL1`
- Show the full standings table first
- Add a recent results section using the latest finished matches
- Add a top scorers section using football-data.org `/v4/competitions/{code}/scorers`
- Keep the related article block

### Test

- `npm run build`
- `curl http://localhost:3001/sports/cl`
- `curl http://localhost:3001/sports/pl`

---

## Phase 39R — Wire Injury-Aware Pronostics

**Files:** `lib/panels/pronostics.ts`, `lib/panels/registry.tsx`, `components/panels/sports/PronosticWidget.tsx`, article frontmatter or pipeline hints as needed

`calculatePronosticV2()` and warning rendering already exist, but the live sports panel path still calls the older pronostic function and never passes injury/suspension signals through.

### Requirements

- Replace the old sports pronostic panel path with `calculatePronosticV2()`
- Pass through any available injury/suspension data from article `panel_hints`
- Render warnings in the existing `PronosticWidget`
- Keep backward compatibility:
  - if no injury data exists, the panel should still render a normal pronostic
- Do not regress the existing sports pronostic output for articles without injury signals

### Test

- `npm run build`
- verify a sports article without injuries still renders prediction bars
- verify a sports article with injury/suspension hints renders warning copy below the bars

---

## Phase 46R — Dedicated Panel Error Boundary

**Files:** `components/article-panel/PanelErrorBoundary.tsx`, `components/article-panel/ArticleIntelPanel.tsx`, any panel fragment path that renders sections directly

`v1-13` called for a dedicated `PanelErrorBoundary`, but the current article panel still uses a different generic wrapper.

### Requirements

- Add `PanelErrorBoundary.tsx` exactly for the panel stack
- Wrap every resolved panel section with `PanelErrorBoundary`
- Keep silent-failure behavior: a broken section should disappear, not crash the article page
- Do not regress the existing timeout behavior in `lib/panels/resolve.ts`

### Test

- `npm run build`
- Confirm article pages still render when a panel component throws

---

## Phase 49R — Wire Panel Preferences Into The UI

**Files:** `lib/panel-prefs.ts`, `components/article-panel/PanelDrawer.tsx`, `components/article-panel/PanelTabBar.tsx`, panel section/header components as needed

The preference helpers exist, but they are not wired into the real panel UI yet.

### Requirements

- `defaultExpanded`
  - `PanelDrawer` should use saved preference when there is no `?panel=` deep link override
- `pinnedTab`
  - restore the last-viewed tab per vertical
  - update the saved preference when the active tab changes
- `hiddenSections`
  - add a simple "Hide this section" control in each section header
  - hidden sections must stay hidden across reloads
- Preserve URL deep-link precedence:
  - if `?panel=X` is present, it wins over saved tab preference on first load

### Test

- open an article, change the active tab, reload, confirm it restores
- hide a section, reload, confirm it stays hidden
- set `?panel=sports-pronostic` and confirm it still opens that tab

---

## Phase 50R — Wire Subscriptions Into Reader + Panels

**Files:** `lib/subscriptions.ts`, `components/news-app-shell.tsx`, relevant sports/finance panel components

The subscription helpers exist, but they are not yet driving UI behavior.

### Requirements

- Team subscriptions
  - subscribed teams should be highlighted anywhere standings/team cards support highlighting
- Ticker subscriptions
  - subscribed tickers should be prioritized or always shown in finance-oriented panel contexts where that makes sense
- Vertical subscriptions
  - `/app` should use subscribed verticals as the default filtered reader view when there is no stronger query-param override
- Keep all subscription state localStorage-based for V1

### Test

- add/remove a team, ticker, and vertical
- reload and verify persistence
- confirm `/app` default view changes only when query params do not explicitly override it

---

## Phase 52R — Finish The Editorial Audit

**Files:** `content/articles/*.md`, audit notes if needed, `NEWSBITES_LEVELING_PLAN_V2.md` only if it still needs review updates

The V1 final audit is not complete. Approved/published articles still exist without `panel_hints`, and the checklist should only be closed when the inventory is actually verified.

### Requirements

1. Backfill `panel_hints` for every approved/published article that needs them
2. Verify each panel family on a real article:
   - sports
   - finance
   - world
   - tech
   - science
   - wellness
   - climate
   - culture
   - trends
3. Record any real API/rate-limit issues encountered during verification
4. Only mark the audit done when the article inventory and panel coverage are both confirmed

### Test

- count approved/published articles
- count approved/published articles with `panel_hints`
- sample one working article per panel family

### Audit Notes (2026-04-17)

- Approved/published inventory: `32`
- Approved/published articles with `panel_hints`: `32`
- Remaining gap before closing this phase:
  - climate-family verification evidence is still missing from the approved/published set
  - keep this phase open until that sample coverage is recorded

---

## Done Checklist

- [x] Phase 43R: `/sports` has all-competition score coverage, standings snapshot, and top pronostics
- [x] Phase 44R: competition pages show recent results and top scorers
- [x] Phase 39R: live sports panels use injury-aware pronostics when hints are available
- [x] Phase 46R: `PanelErrorBoundary` exists and wraps every panel section
- [x] Phase 49R: panel preferences are fully wired into drawer + tabs + hide controls
- [x] Phase 50R: team, ticker, and vertical subscriptions affect reader/panel behavior
- [ ] Phase 52R: approved/published article inventory has verified `panel_hints` coverage and panel-family audit evidence

---

## V2 Reader Experience Carryover

The `/search` route exists and `v1-11` panel behavior is already better than the original plan interaction model, so this section only tracks the `v2-B` features that still look missing rather than merely different.

## Phase 59R — Dark Mode

**Files:** `app/layout.tsx`, `app/globals.css`, `components/site-chrome.tsx`, theme toggle component if added

### Requirements

- add persistent light/dark theme support
- prevent flash of incorrect theme on first paint
- ensure homepage, article pages, `/app`, search, finance, and sports all render correctly in dark mode

### Test

- toggle theme, refresh, confirm persistence
- verify no flash on reload

---

## Phase 60R — Search Shortcut & Entry Points

**Files:** `components/site-chrome.tsx`, optional `components/SearchButton.tsx`, search route if needed

The search page exists, so this carryover is only for the missing access ergonomics.

### Requirements

- add a clear site-wide search entry point outside the app shell
- add `Cmd+K` / `Ctrl+K` shortcut to open search
- preserve the working `/search` page that already exists

### Test

- press `Cmd+K` / `Ctrl+K` and confirm `/search` opens
- verify search remains usable by keyboard only

---

## Phase 61R — Reading Progress Bar

**Files:** `components/ReadingProgressBar.tsx`, `app/articles/[slug]/page.tsx`, `app/globals.css`

### Requirements

- show an amber reading-progress bar on article pages
- update as the reader scrolls
- avoid layout shift

### Test

- open a long article and confirm the bar fills smoothly while scrolling

---

## Phase 62R — Bookmarks & Reading History

**Files:** `lib/bookmarks.ts`, bookmark/history pages, article page UI

### Requirements

- add a bookmark toggle on article pages
- persist bookmarks in localStorage
- record reading history for article visits
- add `/bookmarks` and `/history` pages

### Test

- bookmark an article, refresh, confirm it persists
- read an article, confirm it appears in history

---

## Phase 63R — Custom Error Pages

**Files:** `app/not-found.tsx`, `app/error.tsx`

### Requirements

- add a custom 404 page with article suggestions
- add a custom error boundary page with retry action

### Test

- open a missing route and confirm the 404 page renders
- trigger an app error and confirm the error page renders

---

## Phase 64R — Accessibility Sweep

**Files:** `components/site-chrome.tsx`, `app/globals.css`, any pages/components flagged by audit

### Requirements

- add a skip-to-content link
- add consistent `:focus-visible` styling
- run an accessibility audit on homepage, article page, `/app`, and `/search`
- fix any remaining blocking issues

### Test

- keyboard-only navigation across key pages
- Lighthouse accessibility audit on the core routes

---

## Phase 65R — Continue Reading Bar

**Files:** continue-reading component, homepage, reader app

### Requirements

- surface an unfinished recently read story on the homepage and/or reader app
- store dismiss state locally
- avoid showing already completed articles

### Test

- partially read an article, return home, confirm continue-reading appears

---

## Phase 66R — Related Articles

**Files:** `lib/related-articles.ts`, `components/RelatedArticles.tsx`, `app/articles/[slug]/page.tsx`

### Requirements

- add a related-coverage block at the bottom of article pages
- rank primarily by shared vertical/group/tags
- avoid showing the current article itself

### Test

- confirm articles render related coverage at the bottom

---

## Done Checklist — V2 Reader Carryover

- [ ] Phase 59R: Dark mode is implemented, persistent, and flash-free
- [ ] Phase 60R: Search can be opened from a site-wide entry point and `Cmd+K` / `Ctrl+K`
- [ ] Phase 61R: Article pages show a reading progress bar
- [ ] Phase 62R: Bookmarks and reading history exist with dedicated pages
- [ ] Phase 63R: Custom 404 and error pages exist
- [ ] Phase 64R: Skip link, focus-visible styling, and accessibility audit fixes are complete
- [ ] Phase 65R: Continue-reading bar surfaces unfinished stories
- [ ] Phase 66R: Article pages show related coverage
