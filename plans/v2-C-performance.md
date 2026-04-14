# V2 Block C — Performance & Image Pipeline
**Phases 67–71 | Depends on: Nothing**

> **Read `CONTEXT.md` first.** Google uses Core Web Vitals as a ranking signal. This block fixes images, caching, and page speed.

---

## Phase 67 — Cover Image Pipeline

**Goal:** Every article gets a real cover image that loads with a blur placeholder, properly sized, in WebP format.

### What to build

Create `public/images/articles/` directory. When publishing an article, copy the cover image there.

**File: `scripts/publish-dossier.mjs`** — Add image copying after publishing:

```javascript
import { copyFileSync, existsSync } from 'fs';
import path from 'path';

// After writing the article file:
const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
for (const ext of imageExtensions) {
  const src = path.join(dossierPath, `cover.${ext}`);
  if (existsSync(src)) {
    const dest = path.join(process.cwd(), 'public/images/articles', `${slug}.${ext}`);
    copyFileSync(src, dest);
    // Update the article frontmatter coverImage field
    coverImagePath = `/images/articles/${slug}.${ext}`;
    break;
  }
}
```

**File: `components/article-card.tsx`** — Replace bare `<img>` or missing images with `next/image`:

```typescript
import Image from 'next/image';

// Inside the card component, where the image should appear:
{article.coverImage ? (
  <div className="article-card-image-wrapper">
    <Image
      src={article.coverImage}
      alt={article.title}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px"
      className="article-card-image"
      placeholder="blur"
      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%231B2A4A'/%3E%3C/svg%3E"
    />
  </div>
) : (
  <div className="article-card-image-placeholder" />
)}
```

Add CSS:
```css
.article-card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.5rem;
}
.article-card-image { object-fit: cover; }
.article-card-image-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #1B2A4A, #0d1826);
  border-radius: 0.5rem;
}
```

---

## Phase 68 — Core Web Vitals Audit

**Goal:** All pages score ≥ 90 on Lighthouse Performance. LCP < 2.5s, CLS < 0.1.

### Steps

**1. Run baseline audit:**
```bash
npm run build && npm run start
# Then in another terminal:
npx lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=docs/lighthouse-baseline.json
```

**2. Common fixes:**

**LCP (Largest Contentful Paint — must be < 2.5s):**
- The hero image or article title is usually the LCP element
- If it's an image: add `priority` prop to the `<Image>` on article pages and homepage hero
- If it's text: ensure the fonts don't block rendering (Next.js `next/font` handles this, but verify)

**CLS (Cumulative Layout Shift — must be < 0.1):**
- Every `<Image>` must have explicit `width` + `height` OR use `fill` with a sized container
- Don't render dynamic content (ads, lazy-loaded widgets) above the fold without reserving space

**FCP (First Contentful Paint):**
- Add `preload` for the above-the-fold hero image:
  ```typescript
  // In app/layout.tsx or article page:
  import { Metadata } from 'next';
  // Next.js automatically handles font preloading via next/font
  ```

**3. Install bundle analyzer:**
```bash
npm install -D @next/bundle-analyzer
```

**File: `next.config.ts`** — Add analyzer:
```typescript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = { /* existing config */ };

export default withBundleAnalyzer(nextConfig);
```

Run: `ANALYZE=true npm run build` — review the bundle map for large packages.

**File: `docs/performance-audit.md`** — Document findings and fixes.

---

## Phase 69 — Unified API Cache Layer

**Goal:** All external API calls go through a single caching abstraction. Panel data survives across builds and doesn't re-fetch unnecessarily.

**File: `lib/cache.ts`**

```typescript
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'content/panels/cache');

type CacheEntry<T> = {
  data: T;
  ts: number;       // epoch ms when cached
};

export async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  staleTtlMultiplier = 3,
): Promise<T> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const filePath = path.join(CACHE_DIR, `${key.replace(/[^a-z0-9-]/gi, '_')}.json`);

  // Read existing cache
  let cached: CacheEntry<T> | null = null;
  try {
    cached = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch { /* no cache yet */ }

  const now = Date.now();
  const age = cached ? (now - cached.ts) / 1000 : Infinity;

  // Fresh? Return immediately
  if (cached && age < ttlSeconds) return cached.data;

  // Stale but within stale window? Return stale and revalidate in background
  if (cached && age < ttlSeconds * staleTtlMultiplier) {
    // Fire-and-forget background refresh
    fetcher()
      .then(data => {
        fs.writeFileSync(filePath, JSON.stringify({ data, ts: Date.now() }));
      })
      .catch(() => { /* keep stale */ });
    return cached.data;
  }

  // Expired or no cache: fetch fresh
  try {
    const data = await fetcher();
    fs.writeFileSync(filePath, JSON.stringify({ data, ts: now }));
    return data;
  } catch (err) {
    // If fetch fails and we have stale data, return it (graceful degradation)
    if (cached) return cached.data;
    throw err;
  }
}
```

**Usage in panel fetchers** (update all V1 fetchers to use this):
```typescript
import { cachedFetch } from '@/lib/cache';

export async function fetchStandings(competitionCode: string) {
  return cachedFetch(
    `football-standings-${competitionCode}`,
    300,  // 5 min TTL
    async () => {
      const res = await fetch(`${BASE}/competitions/${competitionCode}/standings`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
  );
}
```

**File: `scripts/clear-cache.mjs`**
```javascript
import fs from 'fs';
import path from 'path';
const dir = path.join(process.cwd(), 'content/panels/cache');
if (fs.existsSync(dir)) {
  fs.readdirSync(dir).forEach(f => fs.unlinkSync(path.join(dir, f)));
  console.log('Cache cleared.');
}
```

Add to `package.json` scripts: `"cache:clear": "node scripts/clear-cache.mjs"`

---

## Phase 70 — Preconnect & Resource Hints

**File: `app/layout.tsx`** — Add resource hints to `<head>`:

```typescript
// Add to the metadata export or directly in the <head> via layout:
export const metadata: Metadata = {
  // ... existing
};

// In the layout JSX, inside <head> (Next.js allows adding links via metadata.other
// or via a custom <head> export — use the method that works in Next.js 16):
```

Since Next.js 16 manages `<head>` through the metadata API, add preconnects via the `metadata` object:

```typescript
export const metadata: Metadata = {
  // ... existing metadata
  other: {
    // These render as <link> tags
  },
};
```

**Alternative — add directly in root layout JSX:**
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.football-data.org" />
        <link rel="dns-prefetch" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://api.jikan.moe" />
        <link rel="dns-prefetch" href="https://ll.thespacedevs.com" />
      </head>
      <body>...</body>
    </html>
  );
}
```

---

## Phase 71 — Image Optimization Config

**File: `next.config.ts`** — Add image domains for all panel image sources:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Sports: team crests from football-data.org
      { protocol: 'https', hostname: 'crests.football-data.org' },
      // Culture: anime cover art
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      // Culture: movie/game images
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'media.rawg.io' },
      // Science: NASA images
      { protocol: 'https', hostname: 'apod.nasa.gov' },
      { protocol: 'https', hostname: 'www.nasa.gov' },
      // Entities: Wikidata images
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

export default nextConfig;
```

---

## Done Checklist

- [ ] Phase 67: Cover images copy from dossier to `public/images/articles/` on publish
- [ ] Phase 67: `article-card.tsx` uses `next/image` with blur placeholder
- [ ] Phase 68: Lighthouse Performance ≥ 90 on homepage and article page
- [ ] Phase 68: `@next/bundle-analyzer` installed, baseline documented
- [ ] Phase 69: `lib/cache.ts` with `cachedFetch()` function
- [ ] Phase 69: All V1 panel fetchers updated to use `cachedFetch`
- [ ] Phase 69: `npm run cache:clear` script works
- [ ] Phase 70: Preconnect and dns-prefetch hints in root layout
- [ ] Phase 71: `next.config.ts` has all image remote patterns
