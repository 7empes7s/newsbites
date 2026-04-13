# NewsBites Leveling Plan V2
# The Production Layer — Extending V1 from Phase 53 Onward

**Created:** 2026-04-13  
**Owner:** Marouane Defili  
**Extends:** `NEWSBITES_LEVELING_PLAN_V1.md` (Phases 1–52, the Intelligence Layer)  
**Execution:** Claude Code + Codex CLI + any AI coder that can read instructions  
**Target app:** `news.techinsiderbytes.com`  
**Start date:** Week 27 (immediately after V1 Phase 52 completes, or phases can run in parallel where noted)

---

## What This Document Is

V1 builds the **Intelligence Layer** — panels that bring live data alongside every article. V2 builds the **Production Layer** — everything else a real, professional news platform needs to be taken seriously by readers, search engines, and domain experts.

V1 makes articles smart. V2 makes the platform real.

---

## How To Read This Plan (For AI Coders)

Each phase follows this format:

```
### Phase N — Title
**Goal:** One sentence explaining what success looks like.
**Why it matters:** Why a reader or the business cares.
**Depends on:** Which earlier phases must be done first (if any).

- Step-by-step bullet points of what to build
- Files to create or modify listed explicitly
- Which APIs to call, with free-tier limits noted
- Testing instructions: how to verify it works
```

**Rules for implementers:**
1. Read the existing file before editing it. Don't guess what's in it.
2. Don't add features that aren't in the phase description.
3. If a step says "create X," check if X already exists first.
4. Test the thing you built — don't just say "done."
5. If you hit a blocker, document it inline in this file under the phase.

---

## Quick Reference: Current App State (As of 2026-04-13)

| Item | Value |
|---|---|
| Framework | Next.js 16.2.2, React 19, TypeScript, Tailwind CSS 4 |
| Articles | 20 markdown files in `content/articles/` |
| Existing routes | `/`, `/app`, `/articles/[slug]`, `/category/[vertical]`, `/group/[group]`, `/about`, `/finance/*` |
| Existing API routes | `/api/finance/market`, `/api/finance/history`, `/api/subscribe` |
| Fonts | Playfair Display (display), DM Sans (body) |
| Colors | Navy `#1B2A4A`, Amber `#F5A623` |
| Metadata | Basic — just `<title>NewsBites</title>` and a generic description |
| Structured data | **None** |
| Sitemap | **None** |
| RSS | **None** |
| Dark mode | **None** |
| Search | **None** |
| PWA | **None** |
| Testing | **None** |
| CI/CD | **None** (manual `./deploy.sh`) |
| Analytics | **None** |
| Image optimization | **None** (no cover images served yet) |

---

## BLOCK A: SEO & Discovery (Phases 53–58)

**Why this block exists:** Without SEO, nobody discovers your articles. Google, Bing, ChatGPT Search, Perplexity, and Gemini all favor pages with proper structured data, fast loads, and machine-readable metadata. Right now, TIB has zero structured data, no sitemap, no RSS feed, and generic metadata. That means search engines treat every page like an anonymous blog post.

---

### Phase 53 — Per-Article Metadata & OpenGraph Tags
**Goal:** Every article page has unique, rich `<meta>` tags that look great when shared on Twitter, Telegram, LinkedIn, Discord.  
**Why it matters:** When someone shares a TIB link, it should show the article title, lead, cover image, and branding — not "NewsBites" with a blank preview.  
**Depends on:** Nothing.

- In `app/articles/[slug]/page.tsx`, export a `generateMetadata()` function:
  ```typescript
  export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article) return {};
    return {
      title: `${article.title} | NewsBites`,
      description: article.lead,
      openGraph: {
        title: article.title,
        description: article.lead,
        type: 'article',
        publishedTime: article.date,
        authors: [article.author],
        tags: article.tags,
        siteName: 'NewsBites — TechInsiderBytes',
        images: article.coverImage ? [{ url: article.coverImage, width: 1200, height: 630 }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: article.lead,
      },
    };
  }
  ```
- Do the same for `/group/[group]/page.tsx` and `/category/[vertical]/page.tsx` — each gets a unique title and description
- Update root `app/layout.tsx` metadata with proper `metadataBase` URL:
  ```typescript
  metadataBase: new URL('https://news.techinsiderbytes.com'),
  ```
- **Test:** Deploy, paste an article URL into the [Twitter Card Validator](https://cards-dev.twitter.com/validator) or Telegram — confirm preview renders with title, lead, and image
- **Files:** `app/articles/[slug]/page.tsx`, `app/layout.tsx`, `app/group/[group]/page.tsx`, `app/category/[vertical]/page.tsx`

---

### Phase 54 — JSON-LD Structured Data (NewsArticle Schema)
**Goal:** Every article page emits `NewsArticle` JSON-LD that search engines and AI assistants can parse.  
**Why it matters:** Google News, Google Discover, and AI search engines (ChatGPT Search, Perplexity) strongly prefer pages with explicit `NewsArticle` structured data. This is the single biggest SEO lever for a news site.  
**Depends on:** Nothing.

- Create `components/ArticleJsonLd.tsx`:
  ```typescript
  export function ArticleJsonLd({ article }: { article: Article }) {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.lead,
      datePublished: article.date,
      dateModified: article.date,
      author: { '@type': 'Person', name: article.author },
      publisher: {
        '@type': 'Organization',
        name: 'TechInsiderBytes',
        url: 'https://news.techinsiderbytes.com',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://news.techinsiderbytes.com/articles/${article.slug}`,
      },
      articleSection: article.vertical,
      keywords: article.tags,
      ...(article.coverImage && {
        image: { '@type': 'ImageObject', url: article.coverImage },
      }),
    };
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  }
  ```
- Add `<ArticleJsonLd article={article} />` to `app/articles/[slug]/page.tsx` inside `<main>`
- Also add `WebSite` JSON-LD to the root layout (enables sitelinks in Google)
- **Test:** Use Google's [Rich Results Test](https://search.google.com/test/rich-results) — paste a live URL, confirm `NewsArticle` detected with no errors
- **Files:** `components/ArticleJsonLd.tsx`, `app/articles/[slug]/page.tsx`, `app/layout.tsx`

---

### Phase 55 — Dynamic Sitemap
**Goal:** A `/sitemap.xml` that lists every published article, group page, and static page, auto-updated on build.  
**Why it matters:** Search engines need a sitemap to discover all pages efficiently, especially for a site with growing content.  
**Depends on:** Nothing.

- Create `app/sitemap.ts` (Next.js 16 convention for dynamic sitemaps):
  ```typescript
  import type { MetadataRoute } from 'next';
  import { getAllArticles, getAllGroups } from '@/lib/articles';

  export default function sitemap(): MetadataRoute.Sitemap {
    const articles = getAllArticles().map(a => ({
      url: `https://news.techinsiderbytes.com/articles/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    const groups = getAllGroups().map(g => ({
      url: `https://news.techinsiderbytes.com/group/${g}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));
    return [
      { url: 'https://news.techinsiderbytes.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      { url: 'https://news.techinsiderbytes.com/app', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      ...articles,
      ...groups,
    ];
  }
  ```
- Create `app/robots.ts`:
  ```typescript
  import type { MetadataRoute } from 'next';
  export default function robots(): MetadataRoute.Robots {
    return {
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://news.techinsiderbytes.com/sitemap.xml',
    };
  }
  ```
- **Test:** `curl https://news.techinsiderbytes.com/sitemap.xml` — confirm all articles listed
- **Files:** `app/sitemap.ts`, `app/robots.ts`

---

### Phase 56 — RSS Feed
**Goal:** A `/feed.xml` RSS feed that readers can subscribe to in any feed reader, and that Mimule can consume for Telegram briefings.  
**Why it matters:** RSS is how power users and bots (including your own Mimule) follow content. Google News also prefers sites with RSS feeds.  
**Depends on:** Nothing.

- Create `app/feed.xml/route.ts` (Route Handler that returns XML):
  ```typescript
  import { getAllArticles } from '@/lib/articles';

  export async function GET() {
    const articles = getAllArticles().slice(0, 50);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>NewsBites — TechInsiderBytes</title>
        <link>https://news.techinsiderbytes.com</link>
        <description>Sharp, readable briefings across tech, finance, politics, culture, and more.</description>
        <atom:link href="https://news.techinsiderbytes.com/feed.xml" rel="self" type="application/rss+xml"/>
        ${articles.map(a => `
        <item>
          <title>${escapeXml(a.title)}</title>
          <link>https://news.techinsiderbytes.com/articles/${a.slug}</link>
          <description>${escapeXml(a.lead)}</description>
          <pubDate>${new Date(a.date).toUTCString()}</pubDate>
          <guid>https://news.techinsiderbytes.com/articles/${a.slug}</guid>
          <category>${a.vertical}</category>
        </item>`).join('')}
      </channel>
    </rss>`;
    return new Response(xml, {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
  }
  ```
- Add `<link rel="alternate" type="application/rss+xml" ...>` to root layout
- **Test:** `curl https://news.techinsiderbytes.com/feed.xml` — valid RSS; try opening in a feed reader
- **Files:** `app/feed.xml/route.ts`, `app/layout.tsx`

---

### Phase 57 — Dynamic OG Images (Auto-Generated Social Cards)
**Goal:** Every article automatically gets a beautiful branded social share image — no manual design needed.  
**Why it matters:** Articles shared on Twitter/Telegram/LinkedIn with a branded card (title + vertical badge + TIB logo on a navy/amber gradient) get dramatically more clicks than plain text links. This is a production differentiator.  
**Depends on:** Phase 53 (metadata references the OG image URL).

- Create `app/articles/[slug]/opengraph-image.tsx` (Next.js ImageResponse API):
  ```typescript
  import { ImageResponse } from 'next/og';
  import { getArticleBySlug } from '@/lib/articles';

  export const size = { width: 1200, height: 630 };
  export const contentType = 'image/png';

  export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article) return new ImageResponse(<div>Not Found</div>);

    return new ImageResponse(
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        width: '100%', height: '100%', padding: '60px',
        background: 'linear-gradient(135deg, #1B2A4A 0%, #0f1b33 100%)',
        color: 'white', fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 24, color: '#F5A623', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>
          {article.vertical}
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.2, maxWidth: '90%' }}>
          {article.title}
        </div>
        <div style={{ marginTop: 24, fontSize: 20, opacity: 0.7 }}>
          news.techinsiderbytes.com
        </div>
      </div>
    );
  }
  ```
- This generates a unique PNG for each article at build time — no external service needed
- Update Phase 53 OG metadata to reference this auto-generated image as fallback when `coverImage` is empty
- **Test:** Visit `https://news.techinsiderbytes.com/articles/champions-league-quarterfinals-first-legs-return-games/opengraph-image` — should return a branded PNG
- **Files:** `app/articles/[slug]/opengraph-image.tsx`

---

### Phase 58 — Google News & Search Console Submission
**Goal:** TIB is registered in Google News Publisher Center and Google Search Console, with proper site verification.  
**Why it matters:** Google News indexing means articles appear in the "News" tab and Google Discover — massive traffic source for news sites.  
**Depends on:** Phases 53–55 (metadata + sitemap must be live first).

- Add Google Search Console verification meta tag to root layout (get tag from `search.google.com/search-console`)
- Submit sitemap URL in Search Console
- Apply to Google News Publisher Center: `publishercenter.google.com`
  - Site URL: `news.techinsiderbytes.com`
  - Content labels: Technology, Finance, World News, Science, Culture
  - RSS feed: `https://news.techinsiderbytes.com/feed.xml`
- Bing Webmaster Tools: submit sitemap at `bing.com/webmasters`
- **This phase is manual/human tasks** — document the checklist in a `docs/seo-submission-checklist.md`
- **Files:** `app/layout.tsx` (verification tag), `docs/seo-submission-checklist.md`

---

## BLOCK B: Reader Experience Essentials (Phases 59–66)

**Why this block exists:** A production news app needs dark mode, search, bookmarks, accessibility, good error pages, and reading progress. These are table-stakes features that readers expect. Without them, TIB feels like a prototype.

---

### Phase 59 — Dark Mode
**Goal:** Full dark mode support, togglable via a button in the site header, preference saved in localStorage.  
**Why it matters:** ~40% of web users prefer dark mode. Night-time readers will bounce without it. It also signals polish.  
**Depends on:** Nothing.

- Add a `ThemeProvider` that reads `localStorage('newsbites-theme')` and applies a `data-theme="dark"` attribute to `<html>`
- Create `components/ThemeToggle.tsx` — a sun/moon icon button in the site chrome header
- In `app/globals.css`, define dark mode variables using `[data-theme="dark"]`:
  ```css
  [data-theme="dark"] {
    --color-bg: #0a0f1a;
    --color-surface: #141b2d;
    --color-text: #e2e8f0;
    --color-text-muted: #94a3b8;
    --color-border: #1e293b;
    --color-brand-navy: #e2e8f0;  /* inverted for readability */
    --color-brand-amber: #F5A623; /* amber stays */
  }
  ```
- Update all existing CSS classes that use hardcoded colors to use CSS variables instead
- Respect `prefers-color-scheme: dark` as the initial default if no localStorage value exists
- Add a tiny inline `<script>` in `<head>` (via layout) that sets `data-theme` before paint to prevent flash of wrong theme (FOUC)
- **Test:** Toggle dark mode, refresh — theme persists. Check article pages, finance dashboard, reader app, homepage all look correct in dark mode
- **Files:** `components/ThemeToggle.tsx`, `app/globals.css`, `app/layout.tsx`, `components/site-chrome.tsx`

---

### Phase 60 — Full-Text Article Search
**Goal:** A `/search?q=...` page that searches article titles, leads, tags, and content — results appear instantly.  
**Why it matters:** With 20+ articles (growing fast via editorial pipeline), readers need to find past coverage. Search is the #1 missing feature for any content site.  
**Depends on:** Nothing.

- Build a pre-computed search index at build time:
  - Create `lib/search.ts` — `buildSearchIndex()` that tokenizes every article's title, lead, tags, and first 500 words of content into a simple inverted index
  - Store as `public/search-index.json` (generated at build time via `scripts/build-search-index.mjs`)
  - Alternative (simpler): client-side fuzzy search using a lightweight library like `fuse.js` (~7kb gzipped) loaded on the search page
- Create `app/search/page.tsx`:
  - Search input with debounced query (300ms)
  - Results list: article card (title, lead, vertical badge, date) — reuse `article-card.tsx` component
  - URL state: `?q=ukraine` — shareable search URLs
  - Empty state: "Start typing to search all articles"
  - No results state: "No articles match '[query]'. Try different keywords."
- Add a search icon button in the site chrome header (next to theme toggle)
- Keyboard shortcut: `Cmd+K` / `Ctrl+K` opens search (follows convention)
- Add `fuse.js` to dependencies: `npm install fuse.js`
- **Test:** Search for "champions league" — should find the UCL article. Search for "nvidia" — should find AI/finance articles. Search for "xyzgarbage" — should show no results
- **Files:** `app/search/page.tsx`, `lib/search.ts`, `components/SearchButton.tsx`, `components/site-chrome.tsx`, `package.json`

---

### Phase 61 — Reading Progress Bar
**Goal:** A thin amber progress bar at the top of every article page that fills as the reader scrolls.  
**Why it matters:** Shows readers how far they are and how much is left. Small touch, big polish signal.  
**Depends on:** Nothing.

- Create `components/ReadingProgressBar.tsx` (client component):
  - Fixed to top of viewport, full width, 3px tall, amber color
  - Width percentage = `(scrollY / (documentHeight - viewportHeight)) * 100`
  - Uses `requestAnimationFrame` for smooth updates (no jank)
  - Only renders on article pages (check via prop or context)
- Add to `app/articles/[slug]/page.tsx` layout
- **Test:** Open any article, scroll — bar fills smoothly from 0% to 100%
- **Files:** `components/ReadingProgressBar.tsx`, `app/articles/[slug]/page.tsx`

---

### Phase 62 — Bookmarks & Reading History (localStorage)
**Goal:** Readers can bookmark articles and see recently read articles — all client-side, no auth needed.  
**Why it matters:** Retention. If a reader can save articles and come back to them, they return. This is the stickiest feature after search.  
**Depends on:** Nothing.

- Create `lib/bookmarks.ts`:
  ```typescript
  // localStorage key: 'newsbites-bookmarks'
  // Shape: { slug: string; title: string; savedAt: string }[]
  export function getBookmarks(): BookmarkEntry[]
  export function addBookmark(article: { slug: string; title: string }): void
  export function removeBookmark(slug: string): void
  export function isBookmarked(slug: string): boolean
  ```
- Create `lib/reading-history.ts`:
  ```typescript
  // localStorage key: 'newsbites-history'
  // Shape: { slug: string; title: string; readAt: string; scrollPercent: number }[]
  // Max 100 entries, oldest trimmed
  export function recordRead(article: { slug: string; title: string }, scrollPercent: number): void
  export function getHistory(): HistoryEntry[]
  ```
- Create `components/BookmarkButton.tsx` — heart/bookmark icon, toggles on click, filled when bookmarked
- Add BookmarkButton to article page header area
- Create `app/bookmarks/page.tsx` — list of bookmarked articles as cards
- Create `app/history/page.tsx` — list of recently read articles with "last read X ago" + scroll progress badge
- Record reading progress on article pages (debounced, updates every 10 seconds of reading)
- **Test:** Open article → bookmark it → go to `/bookmarks` → article appears. Open another article, scroll halfway → go to `/history` → shows 50% progress
- **Files:** `lib/bookmarks.ts`, `lib/reading-history.ts`, `components/BookmarkButton.tsx`, `app/bookmarks/page.tsx`, `app/history/page.tsx`, `app/articles/[slug]/page.tsx`

---

### Phase 63 — Custom Error Pages
**Goal:** Branded 404 and error pages that help readers find what they need.  
**Why it matters:** Default Next.js error pages look broken. Custom ones look professional and reduce bounce.  
**Depends on:** Nothing.

- Create `app/not-found.tsx`:
  - Navy background, large "404" in amber
  - "This page doesn't exist — but these articles might interest you"
  - Show 3 latest articles as suggestion cards
  - Search bar prominent
- Create `app/error.tsx` (client component with error boundary):
  - "Something went wrong" with retry button
  - Link to homepage
- Create `app/global-error.tsx` (root error boundary):
  - Minimal HTML (no layout dependency), same message
- **Test:** Visit `/articles/nonexistent-slug` — should show 404 with suggestions. Force an error — should show error page
- **Files:** `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`

---

### Phase 64 — Accessibility Audit (WCAG 2.1 AA)
**Goal:** The entire site passes WCAG 2.1 AA accessibility standards.  
**Why it matters:** ~15% of people have a disability. Accessibility is both ethical and legally required in many jurisdictions. It also improves SEO.  
**Depends on:** Phases 59–63 (audit everything that's been built so far).

- Run Lighthouse accessibility audit on: homepage, an article page, `/app`, `/finance`, `/search`, `/bookmarks`
- Fix all issues found. Common ones to check:
  - All images have `alt` text (or `alt=""` if decorative)
  - All interactive elements are keyboard-accessible (Tab, Enter, Escape)
  - Color contrast ratios meet 4.5:1 for normal text, 3:1 for large text (check both light and dark mode)
  - Skip-to-content link at top of page: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`
  - ARIA labels on icon-only buttons (theme toggle, search, bookmark, mobile menu)
  - Focus visible styles on all interactive elements (not just browser defaults)
  - `lang` attribute on `<html>` (already present: `lang="en"`)
  - Headings in correct hierarchical order (h1 → h2 → h3, no skips)
  - Form inputs have associated labels
- Add focus-visible ring styles to `globals.css`:
  ```css
  :focus-visible { outline: 2px solid var(--color-brand-amber); outline-offset: 2px; }
  ```
- **Test:** Navigate entire site using only keyboard. Use a screen reader (VoiceOver on Mac, or NVDA). Run `npx lighthouse --only-categories=accessibility` on key pages — target score ≥ 95
- **Files:** `app/globals.css`, `app/layout.tsx`, `components/site-chrome.tsx`, any components that fail audit

---

### Phase 65 — "Continue Reading" Smart Bar
**Goal:** When a reader returns to the site, a subtle bar suggests the last article they were reading (with scroll position).  
**Why it matters:** News apps like Apple News and Flipboard do this. It says "we remember you" without requiring login.  
**Depends on:** Phase 62 (reading history).

- Create `components/ContinueReadingBar.tsx` (client component):
  - On homepage and `/app`: if reading history has an entry from the last 7 days with `scrollPercent < 90`, show a dismissible bar:
    - "Continue reading: [Article Title] — you were 60% through"
    - Click → navigates to the article
    - "×" dismiss button → adds slug to `localStorage('newsbites-dismissed-continue')`
  - Subtle animation: slides in from bottom after 1 second
  - Only shows once per session (use `sessionStorage` flag)
- Add to homepage (`app/page.tsx`) and reader app (`app/app/page.tsx`)
- **Test:** Open an article, scroll to 50%, leave, go to homepage — bar appears with correct article and progress
- **Files:** `components/ContinueReadingBar.tsx`, `app/page.tsx`, `app/app/page.tsx`

---

### Phase 66 — Related Articles Engine
**Goal:** Every article shows 2–3 related articles at the bottom, based on shared tags and vertical.  
**Why it matters:** Keeps readers on-site longer. Most news sites have this. Without it, every article is a dead end.  
**Depends on:** Nothing.

- Create `lib/related-articles.ts`:
  ```typescript
  export function getRelatedArticles(article: Article, limit = 3): Article[] {
    // Score every other article:
    //   +3 for same vertical
    //   +2 for each shared tag
    //   +1 for same group
    // Sort by score descending, exclude the current article
    // If tied, prefer more recent articles
  }
  ```
- Create `components/RelatedArticles.tsx`:
  - "Related coverage" heading
  - 2-3 article cards (reuse existing `article-card.tsx`)
  - Horizontal scroll on mobile, grid on desktop
- Add to bottom of `app/articles/[slug]/page.tsx`, below the article content, above the sidebar
- **Test:** Open the Champions League article — should suggest other sports/culture articles. Open an AI article — should suggest other tech articles
- **Files:** `lib/related-articles.ts`, `components/RelatedArticles.tsx`, `app/articles/[slug]/page.tsx`

---

## BLOCK C: Performance & Image Pipeline (Phases 67–71)

**Why this block exists:** A news site that loads slowly loses readers. Google Core Web Vitals directly impact search ranking. Cover images are currently empty strings — every article looks the same. This block fixes all of that.

---

### Phase 67 — Cover Image Pipeline
**Goal:** Every article has a cover image that loads fast, looks sharp, and works at every screen size.  
**Why it matters:** Articles without images look unfinished. Cover images drive clicks in social shares, search results, and the reader app.  
**Depends on:** Nothing.

- Create `public/images/articles/` directory for cover images
- Update `scripts/publish-dossier.mjs` to look for a cover image in the dossier package (`cover.jpg`, `cover.png`, or `cover.webp`) and copy it to `public/images/articles/[slug].(ext)`
- If no cover image exists, generate one using the same ImageResponse technique from Phase 57 — but saved as a static file at build time
- In `article-card.tsx`, render cover images using Next.js `<Image>` component:
  ```typescript
  import Image from 'next/image';
  // ...
  {article.coverImage && (
    <Image
      src={article.coverImage}
      alt={article.title}
      width={640} height={360}
      sizes="(max-width: 768px) 100vw, 640px"
      className="article-card-image"
      placeholder="blur"
      blurDataURL="data:image/svg+xml,..." // tiny SVG placeholder
    />
  )}
  ```
- Update `next.config.ts` with `images.remotePatterns` if images come from external sources
- **Test:** Build the app, open homepage — article cards show images that load progressively (blur → sharp)
- **Files:** `components/article-card.tsx`, `scripts/publish-dossier.mjs`, `next.config.ts`, `public/images/articles/`

---

### Phase 68 — Core Web Vitals Audit
**Goal:** All pages score 90+ on Lighthouse Performance. LCP < 2.5s, FID < 100ms, CLS < 0.1.  
**Why it matters:** Google uses Core Web Vitals as a ranking signal. Fast = more traffic. Slow = buried in search.  
**Depends on:** Phases 53–67 (audit everything built so far).

- Run Lighthouse on: homepage, an article page, `/app`, `/finance`, `/search`
- Common fixes to check:
  - **LCP:** Ensure above-the-fold content doesn't depend on client-side JS. Hero text/images must be in initial HTML
  - **CLS:** All images have explicit `width`/`height`. No layout shifts from late-loading fonts or dynamic content
  - **FCP:** Inline critical CSS or verify Tailwind's purge is working (check output bundle size)
  - **Bundle size:** Run `npm run build` and check `.next/analyze/` output. Identify any packages > 50kb
  - Font loading: Verify `next/font` is working (font swap should be instant, no FOUT)
- Add `@next/bundle-analyzer` for ongoing monitoring:
  ```bash
  npm install -D @next/bundle-analyzer
  ```
  - Add to `next.config.ts` behind `ANALYZE=true` env flag
- Document findings and fixes in `docs/performance-audit.md`
- **Test:** `ANALYZE=true npm run build` — review bundle visualization. Run `npx lighthouse https://news.techinsiderbytes.com --only-categories=performance` — score ≥ 90
- **Files:** `next.config.ts`, `package.json`, `docs/performance-audit.md`, any components that need optimization

---

### Phase 69 — Unified API Cache Layer
**Goal:** A single caching abstraction for all external API calls — panels, finance, any future data source.  
**Why it matters:** Without unified caching, every panel fetcher implements its own caching (or doesn't). Rate limits get hit, pages load slowly, and errors cascade. One cache layer solves all of these.  
**Depends on:** Nothing (but integrates with V1 panel fetchers when they're built).

- Create `lib/cache.ts`:
  ```typescript
  // Simple file-based cache for server-side fetchers
  // Stores in content/panels/cache/ directory
  type CacheOptions = {
    key: string;           // unique cache key, e.g. "football-standings-CL"
    ttlSeconds: number;    // how long the cached value is considered fresh
    staleTtlSeconds?: number; // how long a stale value can be served while revalidating (default: ttl × 3)
  };

  export async function cachedFetch<T>(
    options: CacheOptions,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // 1. Check file cache: content/panels/cache/{key}.json
    // 2. If fresh: return cached value
    // 3. If stale but within staleTtl: return cached value, trigger background refresh
    // 4. If expired or missing: call fetcher, save to cache, return result
    // 5. If fetcher throws and stale value exists: return stale value (graceful degradation)
    // 6. If fetcher throws and no cache: throw (let panel error boundary handle it)
  }
  ```
- Create `content/panels/cache/.gitkeep` — the cache directory
- All V1 panel fetchers should use `cachedFetch` instead of raw `fetch()`
- Add a `scripts/clear-cache.mjs` — clears all cached data (useful for debugging)
- **Test:** Call a panel fetcher twice — second call should return instantly from cache. Kill network and call again — should return stale data
- **Files:** `lib/cache.ts`, `content/panels/cache/.gitkeep`, `scripts/clear-cache.mjs`

---

### Phase 70 — Preconnect & Resource Hints
**Goal:** Browser starts connecting to external API domains before they're needed.  
**Why it matters:** Eliminates DNS lookup + TCP + TLS time (100–300ms per domain) for external resources.  
**Depends on:** Nothing.

- In `app/layout.tsx`, add `<link>` tags in `<head>`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="dns-prefetch" href="https://api.football-data.org" />
  <link rel="dns-prefetch" href="https://query1.finance.yahoo.com" />
  <link rel="dns-prefetch" href="https://api.github.com" />
  ```
- Only include preconnects for APIs that are actually used on the current page (use `next/head` or layout segments)
- **Files:** `app/layout.tsx`

---

### Phase 71 — Image Optimization Config
**Goal:** Next.js image optimization is properly configured for all image sources.  
**Why it matters:** Unoptimized images are the #1 cause of slow pages. Next.js can auto-convert to WebP and resize.  
**Depends on:** Phase 67 (cover images exist).

- Update `next.config.ts`:
  ```typescript
  const nextConfig: NextConfig = {
    images: {
      formats: ['image/avif', 'image/webp'],
      remotePatterns: [
        { protocol: 'https', hostname: 'crests.football-data.org' },   // team logos
        { protocol: 'https', hostname: 'image.tmdb.org' },             // movie posters
        { protocol: 'https', hostname: 'cdn.myanimelist.net' },         // anime covers
        { protocol: 'https', hostname: 'media.rawg.io' },              // game screenshots
      ],
      deviceSizes: [640, 750, 828, 1080, 1200],
      imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },
  };
  ```
- **Files:** `next.config.ts`

---

## BLOCK D: Entity Intelligence — The Knowledge Graph (Phases 72–76)

**Why this block exists:** This is where TIB becomes something no other news site does. Instead of articles existing in isolation, entities (people, companies, countries, technologies) connect them. A reader who sees "NVIDIA" in a finance article can tap through to see every TIB article that mentions NVIDIA — AI coverage, chip shortages, GPU pricing, stock analysis — all connected. This is the Bloomberg Terminal concept applied to a general news platform.

---

### Phase 72 — Entity Extraction System
**Goal:** Every article is auto-tagged with structured entities — companies, people, countries, technologies, organizations.  
**Why it matters:** Entities are the connective tissue between articles. They enable "The Full Picture" pages (Phase 74), cross-article search, and future AI features.  
**Depends on:** Nothing.

- Create `lib/entities.ts`:
  ```typescript
  type EntityType = 'company' | 'person' | 'country' | 'technology' | 'organization' | 'event';

  type Entity = {
    name: string;        // canonical name: "NVIDIA Corporation"
    type: EntityType;
    slug: string;        // url-safe: "nvidia-corporation"
    aliases: string[];   // ["NVIDIA", "Nvidia", "NVDA"]
    metadata?: {         // optional enrichment
      ticker?: string;
      countryCode?: string;
      wikidata?: string;
    };
  };
  ```
- Create `content/entities/` directory with curated entity JSON files:
  - `companies.json` — companies mentioned across articles (NVIDIA, OpenAI, AMD, Apple, etc.)
  - `people.json` — people mentioned (Sam Altman, etc.)
  - `countries.json` — countries with ISO codes
  - `technologies.json` — tech terms (GPT-5, React, Kubernetes, etc.)
- Create `lib/entity-linker.ts`:
  ```typescript
  export function extractEntities(article: Article): Entity[] {
    // Simple approach: scan article title + content against the entity registry
    // Match by name or aliases (case-insensitive)
    // Return deduplicated list sorted by relevance (title mention > content mention)
  }
  ```
- Add `entities` field to `Article` type as computed property (not stored in frontmatter — derived at read time)
- **Test:** Call `extractEntities` on the OpenAI article — should find "OpenAI", "Sam Altman". Call on Champions League article — should find team names
- **Files:** `lib/entities.ts`, `lib/entity-linker.ts`, `content/entities/companies.json`, `content/entities/people.json`, `content/entities/countries.json`, `content/entities/technologies.json`, `lib/articles.ts`

---

### Phase 73 — Entity Tags on Articles
**Goal:** Article pages show entity chips below the tags — each linking to the entity's page.  
**Why it matters:** Makes entities visible and clickable. Readers discover the knowledge graph naturally.  
**Depends on:** Phase 72.

- In `app/articles/[slug]/page.tsx`, after the tags display, show entity chips:
  ```typescript
  const entities = extractEntities(article);
  // Render as clickable chips: "NVIDIA" → /entity/nvidia-corporation
  ```
- Style entity chips differently from tags: pill-shaped, with an icon per type (building for company, user for person, globe for country, cpu for technology)
- Use Lucide icons (already in deps): `Building2`, `User`, `Globe`, `Cpu`
- **Test:** Open an article — entity chips appear. Click one — navigates to entity page (404 for now, that's Phase 74)
- **Files:** `app/articles/[slug]/page.tsx`, `components/EntityChip.tsx`

---

### Phase 74 — "The Full Picture" Entity Pages
**Goal:** `/entity/[slug]` pages that aggregate everything TIB knows about an entity.  
**Why it matters:** This is the Bloomberg move. No other indie news site has entity pages. A reader landing on `/entity/nvidia-corporation` sees every TIB article mentioning NVIDIA, the stock panel (if it has a ticker), related entities, and a timeline of coverage. This is the single most impressive feature in the entire plan.  
**Depends on:** Phases 72–73.

- Create `app/entity/[slug]/page.tsx`:
  - Hero: entity name, type badge, metadata (ticker, country flag, etc.)
  - **Coverage timeline:** all articles mentioning this entity, sorted by date, shown as a vertical timeline
  - **Related entities:** other entities frequently mentioned in the same articles (co-occurrence graph)
  - **Panel integration:** if entity has a ticker → show finance panel inline; if entity is a country → show country profile card; if entity is a tech → show GitHub repo card
  - **Statistics:** "Mentioned in X articles across Y verticals since Z date"
- Create `lib/entity-pages.ts`:
  ```typescript
  export function getArticlesForEntity(entitySlug: string): Article[]
  export function getRelatedEntities(entitySlug: string): Entity[]
  export function getEntityBySlug(slug: string): Entity | null
  ```
- Use `generateStaticParams` to pre-render all entity pages at build time
- **Test:** Visit `/entity/nvidia-corporation` — see all NVIDIA-related articles, stock data, related entities (AMD, OpenAI, etc.)
- **Files:** `app/entity/[slug]/page.tsx`, `lib/entity-pages.ts`

---

### Phase 75 — Entity Auto-Enrichment via Wikidata
**Goal:** Entities auto-populate metadata (description, image, website) from Wikidata's free API.  
**Why it matters:** Manually curating entity metadata is unsustainable. Wikidata provides structured data for millions of entities for free.  
**Depends on:** Phase 72.

- Create `lib/entity-enrichment.ts`:
  ```typescript
  export async function enrichEntity(entity: Entity): Promise<EnrichedEntity> {
    // 1. Search Wikidata: GET https://www.wikidata.org/w/api.php?action=wbsearchentities&search={name}&language=en
    // 2. Get entity details: GET https://www.wikidata.org/wiki/Special:EntityData/{id}.json
    // 3. Extract: description, image (P18), official website (P856), inception date (P571)
    // 4. Cache result in content/entities/enriched/{slug}.json (TTL: 30 days)
  }
  ```
- Wikidata API: **completely free, no API key, generous rate limits**
- Run enrichment as a build-time script: `scripts/enrich-entities.mjs`
- Display enriched data on entity pages (Phase 74): one-line description under the entity name, small image if available
- **Test:** Run `node scripts/enrich-entities.mjs` — check that `content/entities/enriched/nvidia-corporation.json` has a description and image URL
- **Files:** `lib/entity-enrichment.ts`, `scripts/enrich-entities.mjs`, `content/entities/enriched/`

---

### Phase 76 — Inline Entity Tooltips
**Goal:** Hovering over an entity name in article prose shows a tooltip with a brief description and link to the entity page.  
**Why it matters:** Readers shouldn't need to open a new tab to understand who/what an entity is. Inline context = better reading experience. This is what Wikipedia does with link previews.  
**Depends on:** Phases 72, 75.

- Create `components/EntityTooltip.tsx`:
  - On hover (desktop) or tap (mobile): show a card with entity name, type, one-line description, "See full picture →" link
  - Uses Wikidata description from Phase 75
  - Position: above the text, centered, with arrow pointing down
  - Dismiss: click outside or Escape key
- Create a `remarkEntityLinks` remark plugin for the Markdown renderer:
  - Scans rendered text for known entity names
  - Wraps them in `<EntityTooltip>` components
  - Only links the **first** occurrence of each entity per article (don't over-annotate)
- Add to the `<Markdown remarkPlugins={...}>` call in article pages
- **Test:** Open article mentioning NVIDIA — hover over "NVIDIA" — tooltip appears with description. Click "See full picture" — navigates to entity page
- **Files:** `components/EntityTooltip.tsx`, `lib/remark-entity-links.ts`, `app/articles/[slug]/page.tsx`

---

## BLOCK E: Engagement & Social (Phases 77–82)

**Why this block exists:** A news platform lives or dies by whether readers come back. This block adds features that create return visits: notifications, briefings, share cards, and a prediction tracker that builds credibility over time.

---

### Phase 77 — Share Buttons + Copy Link
**Goal:** Every article has share buttons for Twitter, Telegram, LinkedIn, WhatsApp, and a "Copy link" button.  
**Why it matters:** Readers share articles. If the share friction is high (manually copy URL, open Twitter, paste), they won't. One-click sharing = more distribution.  
**Depends on:** Phase 53 (OG tags must exist so shared links preview correctly).

- Create `components/ShareBar.tsx`:
  - Horizontal row of icon buttons: Twitter, Telegram, LinkedIn, WhatsApp, Copy Link
  - Each opens a pre-filled share URL in a new tab:
    - Twitter: `https://twitter.com/intent/tweet?url={url}&text={title}`
    - Telegram: `https://t.me/share/url?url={url}&text={title}`
    - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={url}`
    - WhatsApp: `https://wa.me/?text={title}%20{url}`
    - Copy: copies URL to clipboard, shows "Copied!" toast for 2 seconds
  - Lucide icons: `Twitter`, `Send` (Telegram), `Linkedin`, `MessageCircle` (WhatsApp), `Link`
- Position: below article title, above content (sticky on mobile)
- Also add to article bottom (after content, before related articles)
- **Test:** Click each share button — correct pre-filled content appears. Copy link — clipboard contains correct URL
- **Files:** `components/ShareBar.tsx`, `app/articles/[slug]/page.tsx`

---

### Phase 78 — Notification Preferences Page
**Goal:** `/settings` page where readers can configure what they want to be alerted about.  
**Why it matters:** Foundation for push notifications (Phase 79) and email digest (future). Even before push is built, the preferences page establishes that TIB respects reader choice.  
**Depends on:** Phase 50 (localStorage subscriptions from V1).

- Create `app/settings/page.tsx`:
  - **Followed verticals:** toggle per vertical (ai, finance, sports, etc.)
  - **Followed entities:** list of entities from reading history, toggle each
  - **Breaking news alerts:** on/off
  - **Daily briefing:** on/off (sets preference for future push/email)
  - All stored in `localStorage('newsbites-notification-prefs')`
- Clean, minimal UI — grouped sections with toggle switches
- Link to settings from site chrome (gear icon in header)
- **Test:** Toggle settings, refresh — they persist. (Push notifications are Phase 79 — this just saves preferences)
- **Files:** `app/settings/page.tsx`, `lib/notification-prefs.ts`, `components/site-chrome.tsx`

---

### Phase 79 — Web Push Notifications
**Goal:** Readers who opt in receive browser notifications when articles in their followed verticals are published.  
**Why it matters:** Push notifications are the single highest-engagement channel. Even a 5% opt-in rate drives significant return traffic.  
**Depends on:** Phases 78, PWA manifest (Phase 91).

- Create `public/sw-push.js` — minimal service worker for push:
  ```javascript
  self.addEventListener('push', (event) => {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/brand-assets/icon-192.png',
        badge: '/brand-assets/badge-72.png',
        data: { url: data.url },
      })
    );
  });
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
  });
  ```
- Create `app/api/push/subscribe/route.ts` — stores push subscription (save to `content/push-subscriptions.json` for now, move to DB later)
- Create `app/api/push/send/route.ts` — sends push to all subscribers matching a vertical filter (called by editorial pipeline after publish)
- Create `scripts/send-push.mjs` — CLI tool to send a push notification for a specific article
- Use the standard Web Push protocol with VAPID keys (generate once, store in `.env.local`)
- Install `web-push` package: `npm install web-push`
- **Test:** Enable notifications in browser → publish an article → receive push → click → opens article
- **Files:** `public/sw-push.js`, `app/api/push/subscribe/route.ts`, `app/api/push/send/route.ts`, `scripts/send-push.mjs`, `lib/push.ts`, `package.json`

---

### Phase 80 — Personalized Daily Briefing Page
**Goal:** `/briefing` page that generates a personalized 5-article briefing based on the reader's followed verticals and entities.  
**Why it matters:** This is the "come back every morning" feature. Readers see a curated briefing tailored to their interests — not just reverse chronological feed.  
**Depends on:** Phases 62 (reading history), 72 (entities), 78 (notification prefs).

- Create `app/briefing/page.tsx` (client component):
  - Reads reader's followed verticals and entities from localStorage
  - Selects top 5 articles from the last 48 hours that match:
    - Articles in followed verticals (weight: 3)
    - Articles mentioning followed entities (weight: 2)
    - Articles not yet read (filter out from reading history)
    - Fallback: latest articles if not enough matches
  - Display format: numbered list (1–5), each with title, one-line summary, vertical badge, reading time
  - "Good morning" / "Good afternoon" / "Good evening" greeting based on local time
  - Shareable: "Share this briefing" copies a URL to clipboard
  - If no preferences set: show onboarding prompt ("Follow some topics to personalize your briefing")
- Link from homepage and site chrome: "Today's Briefing" button
- **Test:** Set followed verticals to "ai" + "finance", visit `/briefing` — shows relevant articles from those verticals, skipping ones already read
- **Files:** `app/briefing/page.tsx`, `lib/briefing.ts`

---

### Phase 81 — Prediction Tracker Dashboard
**Goal:** `/predictions` page that tracks the accuracy of sports pronostics over time.  
**Why it matters:** Anyone can make predictions. Showing a public accuracy record builds credibility and trust. If TIB pronostics hit 60%+, that's a headline feature. If they don't, readers deserve to know. Transparency = trust.  
**Depends on:** V1 Phase 5 (pronostics engine must exist).

- Create `content/predictions/` directory:
  - Each prediction stored as a JSON file: `{slug}-{date}.json`
    ```json
    {
      "matchDate": "2026-04-15",
      "competition": "CL",
      "homeTeam": "Sporting CP",
      "awayTeam": "Arsenal",
      "prediction": { "homeWin": 0.25, "draw": 0.30, "awayWin": 0.45 },
      "predictedOutcome": "awayWin",
      "confidence": "medium",
      "actualResult": { "homeGoals": 1, "awayGoals": 2 },
      "correct": true
    }
    ```
- Create `scripts/record-prediction.mjs` — saves a prediction at publish time
- Create `scripts/resolve-prediction.mjs` — fetches actual result and marks correct/incorrect (run daily by a timer)
- Create `app/predictions/page.tsx`:
  - Overall accuracy: "TIB Pronostics: 63% correct (47 of 75 predictions)"
  - Accuracy by competition (Champions League: 70%, Premier League: 58%, etc.)
  - Accuracy by confidence level (High: 78%, Medium: 60%, Low: 45%)
  - Recent predictions: list with ✓/✗ badges, predicted vs actual
  - Chart: accuracy trend over time (rolling 30-day window)
- **Test:** Create a few test predictions with known outcomes. Visit `/predictions` — accuracy stats are correct, chart renders
- **Files:** `content/predictions/`, `scripts/record-prediction.mjs`, `scripts/resolve-prediction.mjs`, `app/predictions/page.tsx`, `lib/predictions.ts`

---

### Phase 82 — Article Series / Story Threads
**Goal:** Related articles can be linked into a series ("The AI Race" — Part 1, Part 2, Part 3) with navigation between them.  
**Why it matters:** Running stories (election coverage, tournament coverage, investigation series) benefit from explicit threading. Readers can follow the whole story arc.  
**Depends on:** Nothing.

- Add optional `series` field to Article frontmatter:
  ```yaml
  series: "Champions League 2025-26"
  seriesOrder: 1
  ```
- Update `lib/articles.ts` to parse `series` and `seriesOrder` from frontmatter
- Create `lib/series.ts`:
  ```typescript
  export function getSeriesArticles(seriesName: string): Article[]  // sorted by seriesOrder
  export function getArticleSeries(article: Article): { name: string; articles: Article[]; currentIndex: number } | null
  ```
- Create `components/SeriesNav.tsx`:
  - Shown at top of article page when article is part of a series
  - "Part 2 of 4 in [Series Name]"
  - Previous / Next navigation buttons
  - Expandable list of all articles in the series
- Add to `app/articles/[slug]/page.tsx` — renders above article content when series exists
- **Test:** Add `series` frontmatter to 2 Champions League articles. Open one — series nav appears with prev/next links
- **Files:** `lib/articles.ts`, `lib/series.ts`, `components/SeriesNav.tsx`, `app/articles/[slug]/page.tsx`

---

## BLOCK F: PWA & Offline (Phases 83–85)

**Why this block exists:** A Progressive Web App lets readers install TIB on their phone's home screen, read articles offline, and get push notifications. It transforms a website into an app — with zero App Store involvement and zero development cost beyond what we're already building.

---

### Phase 83 — PWA Manifest + Icons
**Goal:** TIB is installable as a PWA on any device.  
**Why it matters:** Installed PWAs get 3x more engagement than browser tabs. The "Add to Home Screen" prompt turns casual readers into daily users.  
**Depends on:** Nothing.

- Create `app/manifest.ts` (Next.js 16 convention):
  ```typescript
  import type { MetadataRoute } from 'next';
  export default function manifest(): MetadataRoute.Manifest {
    return {
      name: 'NewsBites — TechInsiderBytes',
      short_name: 'NewsBites',
      description: 'Sharp briefings across tech, finance, politics, culture, and more.',
      start_url: '/app',
      display: 'standalone',
      background_color: '#0a0f1a',
      theme_color: '#1B2A4A',
      icons: [
        { src: '/brand-assets/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/brand-assets/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/brand-assets/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };
  }
  ```
- Create PWA icons:
  - 192×192 and 512×512 PNG icons in `/public/brand-assets/`
  - Maskable icon variant (with safe zone padding)
  - Can be generated using the OG image technique or a simple script
- Add `theme-color` meta tag to root layout: `<meta name="theme-color" content="#1B2A4A" />`
- **Test:** Open TIB on mobile Chrome → "Add to Home Screen" appears. Open TIB on desktop Chrome → install icon appears in address bar. Launch from home screen — loads as standalone app (no browser chrome)
- **Files:** `app/manifest.ts`, `public/brand-assets/icon-192.png`, `public/brand-assets/icon-512.png`, `public/brand-assets/icon-maskable.png`, `app/layout.tsx`

---

### Phase 84 — Service Worker + Offline Caching
**Goal:** Articles that have been read are available offline. The app works without internet.  
**Why it matters:** Readers on commutes, planes, or spotty connections can still read. This is what separates a real app from a website.  
**Depends on:** Phase 83.

- Create `public/sw.js` — service worker with caching strategies:
  ```javascript
  // Cache strategies:
  // 1. App shell (HTML, CSS, JS): cache-first, update in background
  // 2. Article pages: network-first, cache as fallback (cache on first read)
  // 3. API responses: network-first with stale-while-revalidate
  // 4. Images: cache-first (images don't change)
  // 5. Fonts: cache-first (fonts are versioned by hash)
  ```
- Register service worker in root layout via a client component:
  ```typescript
  'use client';
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);
  ```
- Offline fallback page: when network is down and page isn't cached, show a branded offline page:
  - "You're offline" with TIB branding
  - List of cached articles the reader can still access
  - "Back online? Tap to refresh"
- Pre-cache: the homepage, `/app`, and search page are cached on first visit
- **Test:** Visit TIB, open 3 articles. Turn off wifi. Navigate to one of the 3 articles — loads from cache. Navigate to an unread article — shows offline page with cached article suggestions
- **Files:** `public/sw.js`, `components/ServiceWorkerRegistration.tsx`, `app/offline/page.tsx`, `app/layout.tsx`

---

### Phase 85 — Install Prompt UX
**Goal:** A polished, non-intrusive install prompt for eligible visitors.  
**Why it matters:** The browser's default install prompt is easy to miss. A custom prompt at the right moment converts more installs.  
**Depends on:** Phase 83.

- Create `components/InstallPrompt.tsx` (client component):
  - Listen for `beforeinstallprompt` event
  - Show a custom banner after the reader has:
    - Visited at least 3 articles (stored in `sessionStorage`)
    - Not dismissed the prompt before (stored in `localStorage`)
  - Banner design: bottom of screen, navy background, amber CTA
    - "Read NewsBites like an app — fast, offline, no app store"
    - [Install] [Not now]
  - "Not now" dismisses for 7 days
- Don't show on desktop (desktop PWA install is rare and the default browser UI is fine)
- **Test:** On mobile Chrome, visit 3 articles — install banner appears. Tap "Not now" — doesn't appear for 7 days. Tap "Install" — PWA installs
- **Files:** `components/InstallPrompt.tsx`, `app/layout.tsx`

---

## BLOCK G: Testing & CI (Phases 86–90)

**Why this block exists:** "Production-grade" means tested. Right now there are zero tests. No CI pipeline. A single breaking change can take down the live site. This block adds a safety net.

---

### Phase 86 — Testing Framework Setup
**Goal:** Vitest + React Testing Library installed and configured. One test passes.  
**Why it matters:** You can't add tests if the framework isn't set up. This phase is pure scaffolding — the tests come in later phases.  
**Depends on:** Nothing.

- Install testing dependencies:
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
  ```
- Create `vitest.config.ts`:
  ```typescript
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      globals: true,
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
  });
  ```
- Create `tests/setup.ts`:
  ```typescript
  import '@testing-library/jest-dom';
  ```
- Create `tests/smoke.test.ts`:
  ```typescript
  import { describe, it, expect } from 'vitest';
  describe('smoke test', () => {
    it('basic math works', () => {
      expect(1 + 1).toBe(2);
    });
  });
  ```
- Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`
- **Test:** `npm test` — smoke test passes
- **Files:** `vitest.config.ts`, `tests/setup.ts`, `tests/smoke.test.ts`, `package.json`

---

### Phase 87 — Unit Tests for Core Libraries
**Goal:** Test coverage for `lib/articles.ts`, `lib/search.ts`, `lib/entities.ts`, `lib/related-articles.ts`, `lib/bookmarks.ts`.  
**Why it matters:** These are the core data functions. If they break, everything breaks. Tests catch regressions before deploy.  
**Depends on:** Phase 86.

- Create `tests/lib/articles.test.ts`:
  - `getAllArticles()` returns only approved/published articles
  - `getArticleBySlug()` returns correct article or null
  - `getArticlesByGroup()` correctly maps verticals to groups
  - Articles are sorted by date (newest first)
- Create `tests/lib/related-articles.test.ts`:
  - Returns articles from same vertical first
  - Never returns the same article
  - Returns max `limit` articles
- Create `tests/lib/search.test.ts`:
  - Finds articles by title keywords
  - Finds articles by tag
  - Returns empty array for no-match queries
- Create `tests/lib/entities.test.ts`:
  - Extracts known entities from article content
  - Handles case-insensitive matching
  - Deduplicates entities
- Create `tests/lib/bookmarks.test.ts`:
  - Add/remove/toggle bookmarks (mock localStorage)
  - Max entries enforced for reading history
- **Target:** 80%+ line coverage on tested files
- **Test:** `npm test` — all tests pass
- **Files:** `tests/lib/articles.test.ts`, `tests/lib/related-articles.test.ts`, `tests/lib/search.test.ts`, `tests/lib/entities.test.ts`, `tests/lib/bookmarks.test.ts`

---

### Phase 88 — Integration Tests for Panel Fetchers
**Goal:** Every panel fetcher has a test that verifies it handles API responses, rate limits, and errors correctly.  
**Why it matters:** Panel fetchers call external APIs. They will break. Tests with mocked responses catch shape changes and error handling bugs before readers see them.  
**Depends on:** Phase 86, V1 panel fetchers.

- Create `tests/lib/fetchers/sports.test.ts`:
  - Mock `fetch` with sample football-data.org JSON response
  - Verify `fetchStandings()` returns correctly shaped data
  - Verify graceful handling of 429 (rate limit) response
  - Verify graceful handling of 500 response
- Same pattern for: `finance.test.ts`, `world.test.ts`, `tech.test.ts`, `science.test.ts`, `culture.test.ts`, `climate.test.ts`, `wellness.test.ts`
- Create `tests/fixtures/` directory with sample API responses (real JSON from each API, saved as fixtures)
- **Test:** `npm test -- tests/lib/fetchers/` — all fetcher tests pass
- **Files:** `tests/lib/fetchers/*.test.ts`, `tests/fixtures/`

---

### Phase 89 — GitHub Actions CI Pipeline
**Goal:** Every push to `main` runs: type-check, lint, tests, build. PRs can't merge if any step fails.  
**Why it matters:** CI is the minimum bar for "production-grade." Without it, broken code reaches production.  
**Depends on:** Phases 86–87 (tests must exist).

- Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]

  jobs:
    check:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '22'
            cache: 'npm'
        - run: npm ci
        - run: npx tsc --noEmit           # Type check
        - run: npm run lint                # ESLint
        - run: npm test                    # Vitest
        - run: npm run build              # Next.js build
  ```
- Add branch protection rule on `main`:
  - Require CI to pass before merge
  - (Manual step — document in `docs/ci-setup.md`)
- **Test:** Push a commit — GitHub Actions runs, all 4 steps pass (green check)
- **Files:** `.github/workflows/ci.yml`, `docs/ci-setup.md`

---

### Phase 90 — Visual Regression Tests (Playwright)
**Goal:** Automated screenshots of key pages, compared against baselines to catch unintended visual changes.  
**Why it matters:** CSS changes can break layouts in ways that type-checking and unit tests don't catch. Screenshot comparison catches visual regressions.  
**Depends on:** Phase 89 (CI must be set up).

- Install Playwright: `npm install -D @playwright/test`
- Create `tests/e2e/visual.spec.ts`:
  ```typescript
  import { test, expect } from '@playwright/test';

  test('homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png', { maxDiffPixels: 100 });
  });

  test('article page', async ({ page }) => {
    await page.goto('/articles/champions-league-quarterfinals-first-legs-return-games');
    await expect(page).toHaveScreenshot('article.png', { maxDiffPixels: 100 });
  });

  test('reader app', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveScreenshot('reader-app.png', { maxDiffPixels: 100 });
  });
  ```
- Add `playwright.config.ts` with `webServer` pointing to `npm run dev`
- Generate initial baselines: `npx playwright test --update-snapshots`
- Add to CI pipeline as a separate job (optional, can be slow):
  ```yaml
  visual:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
  ```
- **Test:** `npx playwright test` — screenshots match baselines. Make a CSS change — test fails showing the diff
- **Files:** `tests/e2e/visual.spec.ts`, `playwright.config.ts`, `tests/e2e/*.png` (baselines)

---

## BLOCK H: Editorial Quality Signals (Phases 91–95)

**Why this block exists:** TIB's editorial pipeline is AI-driven. Readers need visible signals that the content is verified, sourced, and fresh. These signals build trust and pass the "domain expert credibility bar."

---

### Phase 91 — Source Attribution Cards
**Goal:** Every article shows its sources in a structured, clickable card at the bottom of the article.  
**Why it matters:** Transparent sourcing is what separates credible journalism from content farms. Domain experts check sources. Making them visible and structured proves TIB does real journalism.  
**Depends on:** Nothing.

- Add optional `sources` field to Article frontmatter:
  ```yaml
  sources:
    - name: "UEFA"
      url: "https://uefa.com/..."
      type: "primary"
    - name: "Reuters"
      url: "https://reuters.com/..."
      type: "wire"
  ```
- Update `lib/articles.ts` to parse `sources` from frontmatter
- Create `components/SourceCard.tsx`:
  - Grouped by type: "Primary Sources", "Wire Reports", "Analysis"
  - Each source: name (linked), domain favicon, type badge
  - Source count badge: "This article cites 4 sources"
- Position: below article content, above related articles
- **Test:** Add sources to an article frontmatter. Open article — source card appears with clickable links
- **Files:** `lib/articles.ts`, `components/SourceCard.tsx`, `app/articles/[slug]/page.tsx`

---

### Phase 92 — Content Freshness Indicators
**Goal:** Articles show visible freshness signals: "Published 2 hours ago", "Updated today", or "⚡ Breaking" badge.  
**Why it matters:** Readers need to know if they're reading something from today or last week. Freshness signals prevent readers from acting on stale information.  
**Depends on:** Nothing.

- Create `lib/freshness.ts`:
  ```typescript
  type FreshnessLevel = 'breaking' | 'fresh' | 'recent' | 'standard';
  export function getFreshness(article: Article): {
    level: FreshnessLevel;
    label: string;  // "2 hours ago" | "Yesterday" | "Apr 10"
    badge?: string; // "⚡ BREAKING" | "NEW" | null
  }
  // breaking: published < 2 hours ago
  // fresh: published < 24 hours ago
  // recent: published < 7 days ago
  // standard: older
  ```
- Add freshness badge to `article-card.tsx`:
  - Breaking: pulsing amber dot + "BREAKING" text
  - Fresh: amber "NEW" badge
  - Recent: relative time ("3 days ago")
  - Standard: absolute date ("Apr 10")
- Add optional `breakingUntil` frontmatter field — lets editorial mark a story as breaking for a specific duration
- **Test:** Publish an article with today's date — shows "NEW" badge. Set `breakingUntil` to 2 hours from now — shows "BREAKING" with pulse animation
- **Files:** `lib/freshness.ts`, `components/article-card.tsx`, `lib/articles.ts`

---

### Phase 93 — Verification Confidence Badge
**Goal:** Each article shows a "Verification" badge indicating how thoroughly the claims have been checked.  
**Why it matters:** AI-written content needs transparent quality signals. This tells the reader "the pipeline verified these claims" or "this is a developing story, not fully verified."  
**Depends on:** Nothing (but maps to the editorial pipeline's verification pass).

- Add optional `verification` field to Article frontmatter:
  ```yaml
  verification: "verified"  # verified | developing | opinion | analysis
  ```
- Create `components/VerificationBadge.tsx`:
  - `verified` → green checkmark + "Verified" — all claims fact-checked by pipeline
  - `developing` → yellow dot + "Developing" — story is evolving, details may change
  - `opinion` → blue speech bubble + "Opinion" — editorial perspective, not factual claims
  - `analysis` → purple chart + "Analysis" — data-driven interpretation
- Display in article header (next to date/reading time) and on article cards
- Editorial pipeline integration: `scripts/validate-story-package.mjs` should set `verification` based on the presence/absence of `verify.md` in the dossier
- **Test:** Articles with `verification: "verified"` show green badge. Articles without the field show no badge (graceful default)
- **Files:** `components/VerificationBadge.tsx`, `app/articles/[slug]/page.tsx`, `components/article-card.tsx`, `lib/articles.ts`

---

### Phase 94 — Reading Level Indicator
**Goal:** Each article shows an estimated reading level (e.g., "General Audience" / "Specialist").  
**Why it matters:** TIB serves two audiences — general readers and domain experts. Making the reading level visible helps readers self-select articles at their comfort level.  
**Depends on:** Nothing.

- Create `lib/reading-level.ts`:
  ```typescript
  export function getReadingLevel(content: string): {
    level: 'general' | 'informed' | 'specialist';
    label: string;
    description: string;
  }
  // Algorithm: simple heuristics
  // - Average sentence length (words per sentence)
  // - Average word length (characters per word)
  // - Jargon density (count of words > 10 chars / total words)
  // General: avg sentence < 18 words, jargon < 5%
  // Informed: avg sentence 18-25, jargon 5-12%
  // Specialist: avg sentence > 25 or jargon > 12%
  ```
- Display as a small pill in article metadata: "👤 General" / "📊 Informed" / "🔬 Specialist"
- Also available in article cards (optional, shown on hover)
- **Test:** A simple article about anime → "General". A dense AI paper analysis → "Specialist"
- **Files:** `lib/reading-level.ts`, `app/articles/[slug]/page.tsx`

---

### Phase 95 — Editorial Pipeline → Frontmatter Sync
**Goal:** The Paperclip editorial pipeline automatically populates `panel_hints`, `sources`, `verification`, and `series` frontmatter when publishing articles.  
**Why it matters:** All the new frontmatter fields are useless if articles arrive without them. This phase closes the loop between editorial and presentation.  
**Depends on:** Phases 91–94 (frontmatter fields must be defined), V1 Phase 37 (panel_hints in Writer agent).

- Update `scripts/publish-dossier.mjs`:
  - Read `sources.json` from dossier → inject as `sources` frontmatter
  - Read `verify.md` from dossier → set `verification: "verified"` if present, `"developing"` if absent
  - Read `PANEL_HINTS:` block from `draft.md` → inject as `panel_hints` frontmatter
  - If article title contains a known series name → set `series` and `seriesOrder`
- Update Writer agent prompt to output `SOURCES:` block alongside `PANEL_HINTS:`
- **Test:** Run `npm run publish:dossier` on a dossier with all artifacts → article frontmatter includes `sources`, `verification`, `panel_hints`. Run without `verify.md` → `verification: "developing"`
- **Files:** `scripts/publish-dossier.mjs`, relevant editorial prompts

---

## BLOCK I: Group Dashboards (Phases 96–99)

**Why this block exists:** V1 builds `/finance` and `/sports` dashboards. This block adds the remaining four group dashboards. Each follows the sector-specific credibility bar — designed for practitioners, not tourists.

---

### Phase 96 — /world Landing Page
**Goal:** A dashboard for global politics readers: country hotspots, active conflicts, upcoming elections, recent coverage.  
**Depends on:** V1 Phases 13–16 (world panel components).

- Create `app/world/page.tsx`:
  - Hero: "World Intelligence" heading
  - **Active hotspots** — 3-4 country profile cards for countries with recent coverage
  - **Conflict timeline** — aggregated from all world articles
  - **Upcoming elections** — next 5 elections globally
  - **Recent coverage** — latest world articles as cards
  - Powered by REST Countries + static JSON data from V1 panels
- **Files:** `app/world/page.tsx`, `app/world/layout.tsx`

---

### Phase 97 — /tech Landing Page
**Goal:** A dashboard for tech/AI readers: trending repos, model leaderboard snapshot, recent papers, coverage.  
**Depends on:** V1 Phases 17–20 (tech panel components).

- Create `app/tech/page.tsx`:
  - Hero: "Tech Intelligence" heading
  - **Trending repos** — top 5 GitHub trending repos this week
  - **AI Leaderboard** — top 5 models from LMSYS
  - **Recent papers** — latest papers mentioned in articles (from Papers With Code)
  - **Recent coverage** — latest tech/ai articles
- **Files:** `app/tech/page.tsx`, `app/tech/layout.tsx`

---

### Phase 98 — /science Landing Page
**Goal:** A dashboard for science/space readers: upcoming launches, ISS position, NASA APOD, coverage.  
**Depends on:** V1 Phases 21–22 (science panel components).

- Create `app/science/page.tsx`:
  - Hero: "Science & Space Intelligence" heading
  - **Next launch** — countdown to next rocket launch with details
  - **ISS tracker** — live position on mini map
  - **NASA APOD** — today's astronomy picture
  - **Recent coverage** — latest science/space articles
- **Files:** `app/science/page.tsx`, `app/science/layout.tsx`

---

### Phase 99 — /culture Landing Page
**Goal:** A dashboard for culture readers: anime season chart, game releases, box office, coverage.  
**Depends on:** V1 Phases 27–30 (culture panel components).

- Create `app/culture/page.tsx`:
  - Hero: "Culture Intelligence" heading
  - **Anime this season** — top 5 airing shows with scores
  - **Upcoming games** — next 5 game releases from RAWG
  - **Box office** — trending movies from TMDB
  - **Recent coverage** — latest anime/gaming/culture articles
- **Files:** `app/culture/page.tsx`, `app/culture/layout.tsx`

---

## BLOCK J: Monitoring & Observability (Phases 100–102)

**Why this block exists:** You can't run a production service if you don't know when it's broken. Right now, if NewsBites goes down at 3am, nobody knows until Marouane checks Telegram.

---

### Phase 100 — Health Check Endpoint
**Goal:** `/api/health` returns service status that uptime monitors can poll.  
**Why it matters:** Foundation for monitoring. Uptime monitors (UptimeRobot, Healthchecks.io) need an endpoint to check.  
**Depends on:** Nothing.

- Create `app/api/health/route.ts`:
  ```typescript
  export async function GET() {
    const articleCount = getAllArticles().length;
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      articles: articleCount,
      version: process.env.npm_package_version || '0.1.0',
    });
  }
  ```
- Register with a free uptime monitor (UptimeRobot free tier: 50 monitors, 5-min intervals)
  - Monitor `https://news.techinsiderbytes.com/api/health`
  - Alert via Telegram bot on downtime (integrate with Mimule)
- **Files:** `app/api/health/route.ts`

---

### Phase 101 — Client-Side Error Tracking
**Goal:** JavaScript errors in the browser are captured and logged, not silently swallowed.  
**Why it matters:** Panel errors, hydration mismatches, and render failures are invisible without error tracking. You can't fix what you can't see.  
**Depends on:** Nothing.

- Create `components/ErrorReporter.tsx` (client component):
  ```typescript
  'use client';
  useEffect(() => {
    window.addEventListener('error', (event) => {
      // POST to /api/errors with { message, stack, url, timestamp }
    });
    window.addEventListener('unhandledrejection', (event) => {
      // Same
    });
  }, []);
  ```
- Create `app/api/errors/route.ts`:
  - Receives error reports, appends to `logs/client-errors.jsonl`
  - Rate limit: max 10 errors per IP per minute (prevent spam)
- Create `scripts/review-errors.mjs` — reads `logs/client-errors.jsonl` and prints a summary
- Future: integrate with Sentry free tier (500K events/month) when volume justifies it
- **Files:** `components/ErrorReporter.tsx`, `app/api/errors/route.ts`, `scripts/review-errors.mjs`, `app/layout.tsx`

---

### Phase 102 — Simple Analytics (Privacy-Respecting)
**Goal:** Know which articles are read, how far readers scroll, and which panels they open — without third-party trackers.  
**Why it matters:** Editorial decisions need data. "Which verticals get the most reads?" "Do readers open panels?" "What's the average scroll depth?" Without analytics, you're guessing.  
**Depends on:** Nothing.

- Create `app/api/analytics/route.ts`:
  - Receives events: `{ type: 'pageview' | 'scroll' | 'panel_open', slug, data, timestamp }`
  - Appends to `logs/analytics.jsonl`
  - No cookies, no fingerprinting, no personal data — just aggregate event counts
  - IP addresses are not stored
- Create `lib/analytics-client.ts` (client-side tracker):
  ```typescript
  export function trackPageview(slug: string): void
  export function trackScroll(slug: string, percent: number): void  // fires at 25, 50, 75, 100%
  export function trackPanelOpen(slug: string, panelId: string): void
  ```
- Create `scripts/analytics-report.mjs` — generates a daily summary:
  - Total pageviews, unique articles viewed
  - Top 10 articles by views
  - Average scroll depth per vertical
  - Panel open rate
  - Outputs as a table to stdout (can pipe to Mimule for Telegram delivery)
- **Test:** Visit 3 articles, scroll through one completely. Run `node scripts/analytics-report.mjs` — shows the 3 pageviews, one with 100% scroll
- **Files:** `app/api/analytics/route.ts`, `lib/analytics-client.ts`, `scripts/analytics-report.mjs`

---

## BLOCK K: The Finishing Touches (Phases 103–106)

---

### Phase 103 — Print Stylesheet
**Goal:** Articles look professional when printed or saved as PDF.  
**Why it matters:** Researchers, analysts, and professionals print articles. A garbled print layout screams "amateur." A clean one screams "publication."  
**Depends on:** Nothing.

- Add `@media print` styles to `app/globals.css`:
  - Hide: navigation, sidebar panels, share buttons, footer, drawer, reading progress bar
  - Show: article content, source cards, entity chips, author, date
  - Font: serif (Playfair Display), black on white, 12pt
  - Images: constrained to page width
  - Page breaks: avoid breaking inside paragraphs, always break before h2
  - URL display: show link URLs after linked text in parentheses
- **Test:** Open an article, Ctrl+P — clean, readable printout with no UI chrome
- **Files:** `app/globals.css`

---

### Phase 104 — Keyboard Navigation & Shortcuts
**Goal:** Power users can navigate the entire site with keyboard only.  
**Why it matters:** Accessibility requirement (Phase 64) plus power-user delight. Bloomberg users live on the keyboard.  
**Depends on:** Phases 60 (search), 62 (bookmarks).

- Global keyboard shortcuts:
  - `Cmd/Ctrl + K` — open search (Phase 60)
  - `b` — toggle bookmark on current article
  - `j` / `k` — next/previous article (in reader app and article lists)
  - `d` — toggle dark mode
  - `?` — show keyboard shortcuts modal
- Create `components/KeyboardShortcuts.tsx`:
  - Client component, registers global `keydown` listeners
  - Disabled when user is typing in an input/textarea
- Create `components/ShortcutsModal.tsx`:
  - Lists all shortcuts in a clean grid
  - Triggered by `?` key
- **Test:** On an article page, press `b` — article bookmarked. Press `Cmd+K` — search opens. Press `?` — modal shows all shortcuts
- **Files:** `components/KeyboardShortcuts.tsx`, `components/ShortcutsModal.tsx`, `app/layout.tsx`

---

### Phase 105 — Automated Deploy Pipeline
**Goal:** Pushing to `main` automatically builds and deploys to the VPS.  
**Why it matters:** Manual SSH + `./deploy.sh` doesn't scale. Auto-deploy means articles and features go live in minutes, not whenever someone remembers to run a script.  
**Depends on:** Phase 89 (CI must pass first).

- Create `.github/workflows/deploy.yml`:
  ```yaml
  name: Deploy
  on:
    push:
      branches: [main]

  jobs:
    deploy:
      needs: check  # from ci.yml
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Deploy to VPS
          uses: appleboy/ssh-action@v1
          with:
            host: ${{ secrets.VPS_HOST }}
            username: ${{ secrets.VPS_USER }}
            key: ${{ secrets.VPS_SSH_KEY }}
            script: |
              cd /opt/newsbites
              git pull origin main
              npm install
              npm run build
              sudo systemctl restart newsbites
  ```
- Add GitHub secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- Keep `./deploy.sh` as manual fallback
- **Test:** Push a small change → GitHub Actions deploys it → site reflects the change within 3 minutes
- **Files:** `.github/workflows/deploy.yml`

---

### Phase 106 — Full Production Audit + V3 Scoping
**Goal:** Everything works. Every page is tested. The site is ready for real traffic.  
**Why it matters:** This is the sign-off phase. After this, TIB is production-grade.  
**Depends on:** All previous phases.

- **SEO audit:**
  - All article pages have unique metadata + JSON-LD (check 5 random articles)
  - Sitemap lists all pages (compare count with article count)
  - RSS feed validates (use W3C Feed Validator)
  - Google Search Console shows no errors
- **Performance audit:**
  - Lighthouse Performance ≥ 90 on homepage, article, reader app
  - LCP < 2.5s, CLS < 0.1 on all key pages
  - Bundle size documented
- **Accessibility audit:**
  - Lighthouse Accessibility ≥ 95 on all key pages
  - Full keyboard navigation works
  - Screen reader testing (basic: headings, links, images)
- **Feature audit:**
  - Dark mode works on all pages
  - Search returns relevant results
  - Bookmarks persist across sessions
  - Reading history tracks correctly
  - Share buttons work for all platforms
  - RSS feed includes latest articles
  - Entity pages show correct articles
  - Related articles are relevant
  - Panels render (if V1 is done)
  - PWA installs and works offline
  - Push notifications deliver
  - Predictions page calculates accuracy correctly
- **Error handling audit:**
  - 404 page shows suggestions
  - Error page shows recovery options
  - Panel errors don't break article pages
  - Offline page shows cached articles
- Write `NEWSBITES_LEVELING_PLAN_V3.md` scoping document:
  - i18n (French, Arabic reader segments)
  - Comments / community features
  - Email newsletter with AI-curated digest
  - Mobile app (React Native or Capacitor)
  - Monetization: premium content, newsletter sponsorships
  - Backend migration: move localStorage to a real user system with auth
  - Multi-author editorial: bylines, contributor pages, editorial standards page
  - AI chat interface: "Ask TIB" — readers can ask questions about articles and get answers grounded in TIB's corpus

---

## Extended Phase Completion Tracker

| Block | Phase | Title | Status |
|---|---|---|---|
| A | 53 | Per-Article Metadata & OG Tags | - |
| A | 54 | JSON-LD Structured Data | - |
| A | 55 | Dynamic Sitemap | - |
| A | 56 | RSS Feed | - |
| A | 57 | Dynamic OG Images | - |
| A | 58 | Google News Submission | - |
| B | 59 | Dark Mode | - |
| B | 60 | Full-Text Search | - |
| B | 61 | Reading Progress Bar | - |
| B | 62 | Bookmarks & Reading History | - |
| B | 63 | Custom Error Pages | - |
| B | 64 | Accessibility Audit | - |
| B | 65 | Continue Reading Bar | - |
| B | 66 | Related Articles Engine | - |
| C | 67 | Cover Image Pipeline | - |
| C | 68 | Core Web Vitals Audit | - |
| C | 69 | Unified API Cache Layer | - |
| C | 70 | Preconnect & Resource Hints | - |
| C | 71 | Image Optimization Config | - |
| D | 72 | Entity Extraction System | - |
| D | 73 | Entity Tags on Articles | - |
| D | 74 | "The Full Picture" Entity Pages | - |
| D | 75 | Entity Auto-Enrichment (Wikidata) | - |
| D | 76 | Inline Entity Tooltips | - |
| E | 77 | Share Buttons | - |
| E | 78 | Notification Preferences | - |
| E | 79 | Web Push Notifications | - |
| E | 80 | Personalized Daily Briefing | - |
| E | 81 | Prediction Tracker Dashboard | - |
| E | 82 | Article Series / Story Threads | - |
| F | 83 | PWA Manifest + Icons | - |
| F | 84 | Service Worker + Offline | - |
| F | 85 | Install Prompt UX | - |
| G | 86 | Testing Framework Setup | - |
| G | 87 | Unit Tests for Core Libs | - |
| G | 88 | Integration Tests for Fetchers | - |
| G | 89 | GitHub Actions CI Pipeline | - |
| G | 90 | Visual Regression Tests | - |
| H | 91 | Source Attribution Cards | - |
| H | 92 | Content Freshness Indicators | - |
| H | 93 | Verification Confidence Badge | - |
| H | 94 | Reading Level Indicator | - |
| H | 95 | Editorial Pipeline → Frontmatter Sync | - |
| I | 96 | /world Landing Page | - |
| I | 97 | /tech Landing Page | - |
| I | 98 | /science Landing Page | - |
| I | 99 | /culture Landing Page | - |
| J | 100 | Health Check Endpoint | - |
| J | 101 | Client-Side Error Tracking | - |
| J | 102 | Simple Analytics | - |
| K | 103 | Print Stylesheet | - |
| K | 104 | Keyboard Navigation | - |
| K | 105 | Automated Deploy Pipeline | - |
| K | 106 | Full Production Audit + V3 Scoping | - |

---

## Recommended Execution Order

Not all phases need to happen sequentially. Here's an optimized execution order that maximizes value delivered per phase:

### Sprint 1 — Instant Credibility (do first, biggest ROI)
Phases **53, 54, 55, 56** (SEO foundation — takes the site from invisible to discoverable)

### Sprint 2 — Reader Table Stakes
Phases **59, 60, 61, 63, 66** (dark mode, search, progress bar, error pages, related articles)

### Sprint 3 — Engagement Hooks
Phases **62, 65, 77** (bookmarks, continue reading, share buttons)

### Sprint 4 — Performance & Images
Phases **67, 68, 69, 70, 71** (cover images, Core Web Vitals, caching, optimization)

### Sprint 5 — The Knowledge Graph (the wow factor)
Phases **72, 73, 74, 75, 76** (entities → entity pages → tooltips — this is the Bloomberg moment)

### Sprint 6 — Editorial Quality
Phases **91, 92, 93, 94, 95** (sources, freshness, verification, reading level, pipeline sync)

### Sprint 7 — Testing & CI
Phases **86, 87, 88, 89** (framework, tests, CI — safety net before scaling)

### Sprint 8 — PWA & Notifications
Phases **83, 84, 85, 79** (installable app, offline, push notifications)

### Sprint 9 — Engagement Depth
Phases **57, 78, 80, 81, 82** (OG images, preferences, briefing, predictions, series)

### Sprint 10 — Group Dashboards
Phases **96, 97, 98, 99** (world, tech, science, culture dashboards)

### Sprint 11 — Monitoring & Polish
Phases **100, 101, 102, 103, 104** (health, errors, analytics, print, keyboard)

### Sprint 12 — Ship It
Phases **58, 90, 105, 106** (Google News, visual tests, auto-deploy, final audit)

---

## Free API Summary (New in V2)

| Purpose | API | Auth | Limits | Cost |
|---|---|---|---|---|
| Entity enrichment | Wikidata API | None | Very generous | Free |
| Search | fuse.js (client-side) | N/A | N/A | Free (npm package) |
| Push notifications | Web Push (VAPID) | Self-signed keys | Unlimited | Free |
| Uptime monitoring | UptimeRobot | Free account | 50 monitors | Free |
| OG images | Next.js ImageResponse | N/A | N/A | Free (built-in) |
| Bundle analysis | @next/bundle-analyzer | N/A | N/A | Free (npm package) |

---

## Risk Register (V2 Additions)

| Risk | Likelihood | Mitigation |
|---|---|---|
| Entity extraction produces false positives | Medium | Curated entity registry (not NLP guessing). Add/remove entities manually. Require exact match or known alias |
| Service worker caches stale content | Medium | Version service worker, cache-bust on deploy, add "Update available" toast |
| Push notification opt-in rate too low | Medium | Only prompt after engagement threshold (3 articles). Never prompt on first visit |
| OG image generation slow on build | Low | Images are generated once per article and cached. Only regenerate if title changes |
| Analytics JSONL files grow unbounded | Medium | Add log rotation in `scripts/analytics-report.mjs` — archive files older than 30 days |
| Dark mode CSS misses some components | Medium | Audit every component in dark mode during Phase 59. Use CSS variables everywhere, avoid hardcoded colors |

---

*This document extends V1. Execute V1 and V2 in whatever order makes sense — the Recommended Execution Order above interleaves them optimally.*  
*Update the tracker table as phases complete. When all 106 phases are done, the V3 scoping in Phase 106 becomes the next document.*
