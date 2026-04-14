# Shared Context — Read This Before Any Plan File

This file contains everything an AI coder needs to know about the NewsBites codebase before making changes. Every plan file in this folder assumes you've read this first.

---

## What Is NewsBites?

A news platform at `news.techinsiderbytes.com`. Articles are written by an AI editorial pipeline and stored as markdown files. The site is built with Next.js and serves articles across 6 groups: Tech, Finance, World, Science, Wellness, Culture.

**The goal:** Every article should inform, instruct, build awareness, help, or impact the reader. The article is the product.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.2 | Framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| gray-matter | 4.x | Markdown frontmatter parsing |
| react-markdown | 10.x | Markdown rendering |
| remark-gfm | 4.x | GitHub-flavored markdown |
| lucide-react | 1.8.x | Icon library |

**Important:** This is **Next.js 16**, which has breaking changes from earlier versions. Always check `node_modules/next/dist/docs/` before writing route or API code.

---

## File Structure

```
/opt/newsbites/
├── app/                          ← Next.js App Router pages
│   ├── layout.tsx                ← Root layout (fonts, metadata, SiteChrome wrapper)
│   ├── page.tsx                  ← Homepage
│   ├── globals.css               ← All CSS (Tailwind v4 + custom classes)
│   ├── articles/[slug]/page.tsx  ← Individual article pages
│   ├── app/page.tsx              ← Reader app (Focus + Flow modes)
│   ├── category/[vertical]/      ← Articles filtered by vertical
│   ├── group/[group]/            ← Articles filtered by group
│   ├── finance/                  ← Finance dashboard + sub-pages
│   ├── about/                    ← About page
│   └── api/                      ← API routes
│       ├── finance/market/       ← Market data endpoint
│       ├── finance/history/      ← Price history endpoint
│       └── subscribe/            ← Newsletter subscribe endpoint
├── components/
│   ├── article-card.tsx          ← Article card used in lists
│   ├── news-app-shell.tsx        ← Reader app (Focus/Flow modes)
│   ├── site-chrome.tsx           ← Header + navigation wrapper
│   ├── site-footer.tsx           ← Footer
│   └── finance/                  ← Finance-specific components
│       ├── FinanceOverlay.tsx     ← Shows ticker data on article pages
│       ├── InsightCard.tsx        ← AI insight display card
│       ├── MarketCard.tsx         ← Market data card
│       └── TickerChart.tsx        ← Stock price chart
├── lib/
│   ├── articles.ts               ← Core: reads markdown, returns Article objects
│   ├── article-taxonomy.ts       ← Groups, verticals, labels, mappings
│   └── finance/
│       ├── market.ts             ← Market data fetching
│       ├── tickers.ts            ← Ticker detection from article text
│       └── types.ts              ← Finance type definitions
├── content/
│   └── articles/                 ← 20 markdown article files
├── public/
│   └── brand-assets/             ← Logo files
├── scripts/
│   └── publish-dossier.mjs       ← Publishes article from editorial pipeline
├── package.json
├── next.config.ts                ← Next.js config (currently empty)
├── deploy.sh                     ← Manual deploy script
└── plans/                        ← This folder (build plans)
```

---

## Key Types

### Article (from `lib/articles.ts`)

```typescript
type Frontmatter = {
  title: string;
  slug: string;
  date: string;           // "2026-04-11"
  vertical: Vertical;     // "ai", "sports", "finance", etc.
  tags: string[];          // ["champions-league", "arsenal"]
  status: "draft" | "approved" | "published";
  lead: string;            // One-sentence summary for cards/hero
  digest?: string;         // Short summary for /app reader
  coverImage?: string;     // URL or path (often empty "")
  author: string;
};

type Article = Frontmatter & {
  appDigest: { headline, nutshell, sections[], takeaway };
  content: string;         // Raw markdown body
  dateLabel: string;       // "Apr 11, 2026"
  readingTime: string;     // "5 min read"
  previewText: string;     // First 220 chars of cleaned content
};
```

### Groups and Verticals (from `lib/article-taxonomy.ts`)

```
Groups:   tech | finance | world | science | wellness | culture
Verticals → Group mapping:
  ai, trends, cybersecurity      → tech
  finance, economy, crypto       → finance
  global-politics                → world
  space, healthcare, energy, climate → science
  tcm, skincare                  → wellness
  anime, gaming, sports          → culture
```

---

## Styling Rules

- **Fonts:** Playfair Display (headings, `--font-display`) + DM Sans (body, `--font-body`)
- **Brand colors:** Navy `#1B2A4A`, Amber `#F5A623`
- **CSS approach:** Tailwind v4 with semantic CSS classes in `app/globals.css`. The app is NOT utility-heavy — most styling uses custom classes like `.article-card`, `.page-shell`, `.article-content`.
- **When adding styles:** Add new CSS classes to `app/globals.css`. Use CSS custom properties (variables) for colors so dark mode (Phase 59) works later.

---

## How Articles Work

1. Markdown files live in `content/articles/*.md`
2. Each file has YAML frontmatter (title, slug, date, vertical, tags, status, lead, digest, coverImage, author)
3. `lib/articles.ts` reads all files, parses frontmatter with `gray-matter`, and returns `Article` objects
4. Only articles with `status: "approved"` or `status: "published"` appear on the site
5. Articles are sorted newest-first by date

---

## How the Article Page Works

File: `app/articles/[slug]/page.tsx`

Current layout:
- Left column: article metadata, title, lead, finance overlay (if ticker detected), markdown body
- Right column (sidebar): author, tags, status, market data link, reader app link
- The page uses `generateStaticParams()` to pre-render all article pages at build time

---

## Environment

- **Server:** Hetzner CX32 VPS, Ubuntu 24.04
- **Domain:** `*.techinsiderbytes.com` via Cloudflare Tunnel
- **Port:** The app runs on port 3001 via `newsbites.service` (systemd)
- **Deploy:** `./deploy.sh` runs `npm install && npm run build && systemctl restart newsbites`
- **GitHub:** Repo at `7empes7s/newsbites` on the `main` branch

---

## Free API Keys Available

These are or will be in `.env.local`:

| Variable | API | Free Tier Limits |
|---|---|---|
| `FOOTBALL_DATA_API_KEY` | football-data.org | 10 req/min |
| `NASA_API_KEY` | api.nasa.gov | Very generous |
| `RAWG_API_KEY` | rawg.io | 20K req/month |
| `TMDB_API_KEY` | themoviedb.org | 50 req/sec |
| `GITHUB_TOKEN` | api.github.com | 5000 req/hr |
| `FRED_API_KEY` | fred.stlouisfed.org | Very generous |
| `ALPHA_VANTAGE_KEY` | alphavantage.co | 25 req/day |

---

## Common Patterns

### Creating a new page
```typescript
// app/my-page/page.tsx
export default function MyPage() {
  return (
    <main className="page-shell">
      <h1>Page Title</h1>
      {/* content */}
    </main>
  );
}
```

### Creating an API route
```typescript
// app/api/my-route/route.ts
export async function GET(request: Request) {
  return Response.json({ data: 'hello' });
}
```

### Creating a client component
```typescript
// components/MyComponent.tsx
'use client';
import { useState } from 'react';
export function MyComponent() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

### Using an existing article function
```typescript
import { getAllArticles, getArticleBySlug } from '@/lib/articles';
const articles = getAllArticles(); // Article[] — only approved/published, sorted by date
const article = getArticleBySlug('my-article-slug'); // Article | null
```

---

## What NOT To Do

1. **Don't install paid dependencies.** Every API must have a free tier.
2. **Don't add auth or security hardening.** That comes later when explicitly requested.
3. **Don't change the Article frontmatter schema** unless the phase specifically says to add a field. When adding, always make the field optional so existing articles don't break.
4. **Don't rename existing files** unless the phase says to.
5. **Don't add speculative features.** Only build what's in the phase.
6. **Don't use `"use client"` unless needed.** Server components are the default in Next.js 16. Only add `"use client"` when the component needs browser APIs (useState, useEffect, onClick, etc.).
