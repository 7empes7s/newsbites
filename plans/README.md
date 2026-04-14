# NewsBites Build Plans — Master Index

## What Is This?

This folder contains the complete build plan for **NewsBites** (`news.techinsiderbytes.com`), an AI-operated news platform. The plan is split into small, self-contained files so that **any AI coder** (including smaller models like Gemma 4 26B) can pick up a single file and execute it without needing to read the entire plan.

## The App In One Paragraph

NewsBites is a **Next.js 16 + React 19 + TypeScript + Tailwind CSS 4** news platform. It serves articles as markdown files from `content/articles/`. It has a reader app at `/app` with Focus (card) and Flow (TikTok-style) modes. It has a `/finance` dashboard with live market data. The editorial pipeline is AI-driven (Paperclip + Mimule). The site runs on a Hetzner VPS at `news.techinsiderbytes.com`.

## How To Use These Files

1. **Read `CONTEXT.md` first** — it has everything you need to know about the codebase before touching any code.
2. **Pick a block file** from the list below — each block is independent unless it says "Depends on" at the top of a phase.
3. **Follow the phases in order** within each block — they build on each other.
4. **Mark phases done** in the tracker at the bottom of each file when you finish them.

## Rules For AI Coders

1. **Read before you edit.** Always read a file before modifying it. Never guess what's inside.
2. **Don't add extras.** Only build what the phase describes. No bonus features, no "improvements."
3. **Test your work.** Each phase has a "Test" section. Follow it. Don't skip it.
4. **One block at a time.** Don't try to do multiple blocks in one session unless told to.
5. **If stuck, stop and say why.** Don't hallucinate a fix. Document the blocker.

---

## File Map

### Shared Context
| File | What It Contains |
|---|---|
| [CONTEXT.md](CONTEXT.md) | App architecture, file paths, current state, styling, APIs, principles. **Read this first.** |

### V1 — The Intelligence Layer (Phases 1–52)
These phases add live data panels alongside every article (sports standings, stock charts, country profiles, etc.).

| File | Phases | What It Builds |
|---|---|---|
| [v1-00-panel-infrastructure.md](v1-00-panel-infrastructure.md) | 1–2 | The universal panel shell, drawer, registry, type system |
| [v1-01-sports-foundation.md](v1-01-sports-foundation.md) | 3–4 | Football data fetcher, standings table, fixtures card |
| [v1-02-sports-pronostics.md](v1-02-sports-pronostics.md) | 5–6 | Prediction engine, team cards, match history |
| [v1-03-sports-breadth.md](v1-03-sports-breadth.md) | 7–8 | Multi-competition support, route-to-final analyzer |
| [v1-04-finance.md](v1-04-finance.md) | 9–12 | Finance panel migration, ticker sparklines, macro indicators, crypto |
| [v1-05-world.md](v1-05-world.md) | 13–16 | Country profiles, conflict timelines, elections, trade data |
| [v1-06-tech.md](v1-06-tech.md) | 17–20 | GitHub cards, HuggingFace models, AI leaderboard, tech signals |
| [v1-07-science.md](v1-07-science.md) | 21–22 | Launch tracker, NASA APOD, ISS position, mission status |
| [v1-08-wellness-climate.md](v1-08-wellness-climate.md) | 23–26 | FDA alerts, WHO bulletins, CO2 widget, renewables tracker |
| [v1-09-culture.md](v1-09-culture.md) | 27–30 | Anime season chart, AniList, RAWG games, box office |
| [v1-10-trends.md](v1-10-trends.md) | 31–32 | Google Trends sparkline, Reddit sentiment meter |
| [v1-11-mobile-reader.md](v1-11-mobile-reader.md) | 33–36 | Gesture drawer, tab bar, Focus/Flow mode panel integration |
| [v1-12-editorial-pronostics.md](v1-12-editorial-pronostics.md) | 37–40 | Writer agent hints, cache warming, injuries, NBA + F1 |
| [v1-13-dashboards-polish.md](v1-13-dashboards-polish.md) | 41–52 | Finance CTA, sports dashboard, ISR audit, cross-vertical, personalization, deep links, final audit |

### V2 — The Production Layer (Phases 53–106)
These phases make the platform production-grade: SEO, search, dark mode, PWA, testing, monitoring, etc.

| File | Phases | What It Builds |
|---|---|---|
| [v2-A-seo-discovery.md](v2-A-seo-discovery.md) | 53–58 | Metadata, JSON-LD, sitemap, RSS, OG images, Google News |
| [v2-B-reader-experience.md](v2-B-reader-experience.md) | 59–66 | Dark mode, search, progress bar, bookmarks, errors, a11y, related articles |
| [v2-C-performance.md](v2-C-performance.md) | 67–71 | Cover images, Core Web Vitals, cache layer, preconnect, image optimization |
| [v2-D-entity-graph.md](v2-D-entity-graph.md) | 72–76 | Entity extraction, entity pages, Wikidata enrichment, inline tooltips |
| [v2-E-engagement.md](v2-E-engagement.md) | 77–82 | Share buttons, notifications, push, briefing, predictions, series |
| [v2-F-pwa.md](v2-F-pwa.md) | 83–85 | PWA manifest, service worker, install prompt |
| [v2-G-testing.md](v2-G-testing.md) | 86–90 | Vitest, unit tests, integration tests, CI pipeline, visual regression |
| [v2-H-editorial-quality.md](v2-H-editorial-quality.md) | 91–95 | Source cards, freshness, verification badges, reading level, pipeline sync |
| [v2-I-dashboards.md](v2-I-dashboards.md) | 96–99 | /world, /tech, /science, /culture landing pages |
| [v2-J-monitoring.md](v2-J-monitoring.md) | 100–102 | Health endpoint, error tracking, analytics |
| [v2-K-finishing.md](v2-K-finishing.md) | 103–106 | Print stylesheet, keyboard shortcuts, auto-deploy, final audit |

---

## Recommended Execution Order

If you're doing everything, this order maximizes value delivered early:

1. **v1-00** → Panel infrastructure (everything else in V1 depends on this)
2. **v2-A** → SEO (makes the site discoverable — highest ROI)
3. **v2-B** → Reader experience (dark mode, search — table stakes)
4. **v1-01 → v1-02** → Sports panels (first working vertical)
5. **v2-C** → Performance (images, caching)
6. **v1-04** → Finance panels
7. **v2-D** → Entity graph (the wow factor)
8. **v2-G** → Testing & CI (safety net)
9. Remaining V1 verticals (v1-05 through v1-10)
10. **v2-E** → Engagement features
11. **v2-F** → PWA
12. **v2-H** → Editorial quality signals
13. **v1-11 → v1-13** → Mobile, editorial pipeline, polish
14. **v2-I → v2-K** → Dashboards, monitoring, finishing touches
