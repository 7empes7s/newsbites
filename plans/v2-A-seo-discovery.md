# V2 Block A — SEO & Discovery
**Phases 53–58 | Depends on: Nothing | Priority: Do this first**

> **Read `CONTEXT.md` first.** This block has the highest ROI of the entire plan. Without it, nobody finds the content through search or social sharing.

---

## What You're Building

Right now `news.techinsiderbytes.com` has:
- Generic `<title>NewsBites</title>` on every page
- No OpenGraph tags (links look ugly when shared)
- No structured data (search engines treat it like an anonymous blog)
- No sitemap (search engines miss pages)
- No RSS feed (power users and bots can't subscribe)

After this block: every article has rich share previews, a branded social card image, `NewsArticle` JSON-LD that gets picked up by Google News and AI search engines, a sitemap, and an RSS feed.

---

## Phase 53 — Per-Article Metadata & OpenGraph Tags

**File: `app/layout.tsx`** — Add `metadataBase` to the root metadata export:

```typescript
export const metadata: Metadata = {
  title: 'NewsBites',
  description: 'Sharp briefings across tech, finance, politics, culture, and more.',
  metadataBase: new URL('https://news.techinsiderbytes.com'), // ADD THIS
};
```

**File: `app/articles/[slug]/page.tsx`** — Add `generateMetadata` function (place it before the default export):

```typescript
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Not Found' };

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
      // The OG image is generated automatically in Phase 57.
      // Until then, leave images empty or add a default.
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.lead,
    },
  };
}
```

Also add metadata to group and category pages (`app/group/[group]/page.tsx`, `app/category/[vertical]/page.tsx`) using the group/vertical label and a description.

### How to test
1. `npm run build && npm run start`
2. View source on any article page — confirm unique `<title>` and `<meta property="og:title">` tags
3. Paste URL into a Telegram message — preview should show article title and lead

---

## Phase 54 — JSON-LD Structured Data (NewsArticle)

**File: `components/ArticleJsonLd.tsx`**

```typescript
import type { Article } from '@/lib/articles';

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
      logo: {
        '@type': 'ImageObject',
        url: 'https://news.techinsiderbytes.com/brand-assets/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://news.techinsiderbytes.com/articles/${article.slug}`,
    },
    articleSection: article.vertical,
    keywords: article.tags.join(', '),
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

**File: `app/articles/[slug]/page.tsx`** — Add `<ArticleJsonLd article={article} />` inside the `<main>` element.

**File: `app/layout.tsx`** — Add `WebSite` JSON-LD to the root layout so Google can show sitelinks:

```typescript
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'NewsBites — TechInsiderBytes',
  url: 'https://news.techinsiderbytes.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://news.techinsiderbytes.com/search?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};
// Add <script type="application/ld+json"> to the layout's <body>
```

### How to test
1. Deploy the change
2. Visit Google's Rich Results Test: https://search.google.com/test/rich-results
3. Paste any article URL → should show `NewsArticle` detected with no errors

---

## Phase 55 — Dynamic Sitemap + Robots.txt

**File: `app/sitemap.ts`**

```typescript
import type { MetadataRoute } from 'next';
import { getAllArticles, getAllGroups } from '@/lib/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://news.techinsiderbytes.com';

  const articles = getAllArticles().map(a => ({
    url: `${base}/articles/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const groups = getAllGroups().map(g => ({
    url: `${base}/group/${g}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/app`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/finance`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    ...groups,
    ...articles,
  ];
}
```

**File: `app/robots.ts`**

```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/admin/'] },
    ],
    sitemap: 'https://news.techinsiderbytes.com/sitemap.xml',
  };
}
```

### How to test
1. `npm run build && npm run start`
2. Visit `http://localhost:3000/sitemap.xml` — all articles should be listed
3. Visit `http://localhost:3000/robots.txt` — should show sitemap URL

---

## Phase 56 — RSS Feed

**File: `app/feed.xml/route.ts`**

```typescript
import { getAllArticles } from '@/lib/articles';

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const articles = getAllArticles().slice(0, 50);
  const base = 'https://news.techinsiderbytes.com';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>NewsBites — TechInsiderBytes</title>
    <link>${base}</link>
    <description>Sharp briefings across tech, finance, politics, culture, and more.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles.map(a => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${base}/articles/${a.slug}</link>
      <description>${escapeXml(a.lead)}</description>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <guid isPermaLink="true">${base}/articles/${a.slug}</guid>
      <category>${escapeXml(a.vertical)}</category>
      ${a.tags.map(t => `<category>${escapeXml(t)}</category>`).join('')}
    </item>`).join('')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

Add RSS link to root layout `<head>`:
```typescript
// In app/layout.tsx metadata:
alternates: {
  types: { 'application/rss+xml': 'https://news.techinsiderbytes.com/feed.xml' },
},
```

---

## Phase 57 — Dynamic OG Images (Auto-Generated Social Cards)

**File: `app/articles/[slug]/opengraph-image.tsx`**

Next.js 16 generates this as a PNG at build time. No external service needed.

```typescript
import { ImageResponse } from 'next/og';
import { getArticleBySlug } from '@/lib/articles';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return new ImageResponse(<div>Not Found</div>, { width: 1200, height: 630 });

  // Vertical label for the badge
  const verticalLabel = article.vertical.replace(/-/g, ' ').toUpperCase();

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        width: '100%',
        height: '100%',
        padding: '64px',
        background: 'linear-gradient(135deg, #1B2A4A 0%, #0d1826 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {/* Top-left logo text */}
      <div style={{ position: 'absolute', top: 48, left: 64, fontSize: 20, opacity: 0.6 }}>
        TechInsiderBytes
      </div>

      {/* Vertical badge */}
      <div
        style={{
          display: 'inline-flex',
          padding: '6px 16px',
          background: '#F5A623',
          borderRadius: 4,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 24,
          width: 'fit-content',
        }}
      >
        {verticalLabel}
      </div>

      {/* Title — limit to 2 lines */}
      <div
        style={{
          fontSize: article.title.length > 60 ? 44 : 52,
          fontWeight: 700,
          lineHeight: 1.2,
          maxWidth: '90%',
        }}
      >
        {article.title.length > 100 ? article.title.slice(0, 97) + '...' : article.title}
      </div>

      {/* Lead / subtitle */}
      <div style={{ marginTop: 20, fontSize: 22, opacity: 0.75, maxWidth: '80%', lineHeight: 1.4 }}>
        {article.lead.length > 120 ? article.lead.slice(0, 117) + '...' : article.lead}
      </div>

      {/* Domain */}
      <div style={{ marginTop: 36, fontSize: 18, opacity: 0.5 }}>
        news.techinsiderbytes.com
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
```

Update Phase 53's `generateMetadata` to reference this image:
```typescript
openGraph: {
  // ...
  images: [{ url: `/articles/${slug}/opengraph-image`, width: 1200, height: 630 }],
},
```

### How to test
1. Visit `/articles/champions-league-quarterfinals-first-legs-return-games/opengraph-image` in browser
2. Should display a 1200×630 PNG with navy background, amber "SPORTS" badge, and article title

---

## Phase 58 — Google News Submission (Manual Tasks)

This phase is **human tasks only**. AI coders don't need to write code — document the checklist.

**File: `docs/seo-submission-checklist.md`** — Create this file with the steps:

```markdown
# SEO Submission Checklist

## Prerequisites (must be done first)
- [ ] Phase 53 deployed (article metadata)
- [ ] Phase 54 deployed (JSON-LD)
- [ ] Phase 55 deployed (sitemap at /sitemap.xml)
- [ ] Phase 56 deployed (RSS at /feed.xml)

## Google Search Console
1. Go to https://search.google.com/search-console/
2. Add property: news.techinsiderbytes.com
3. Verify via HTML tag — add the meta tag to app/layout.tsx:
   `<meta name="google-site-verification" content="YOUR_CODE_HERE" />`
4. Submit sitemap: https://news.techinsiderbytes.com/sitemap.xml

## Google News Publisher Center
1. Go to https://publishercenter.google.com/
2. Add publication — site URL: https://news.techinsiderbytes.com
3. Content labels: Technology, Finance, World News, Science
4. RSS feed: https://news.techinsiderbytes.com/feed.xml

## Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters/
2. Add site, verify, submit sitemap URL

## Validate
- Rich Results Test: https://search.google.com/test/rich-results
- RSS Validator: https://validator.w3.org/feed/
- Schema Validator: https://validator.schema.org/
```

---

## Done Checklist

- [ ] Phase 53: Every article page has unique `<title>` and `og:title` meta tags
- [ ] Phase 53: `metadataBase` set in root layout
- [ ] Phase 54: `ArticleJsonLd` component renders `NewsArticle` schema on all article pages
- [ ] Phase 54: Google Rich Results Test shows no errors on a sample article
- [ ] Phase 55: `/sitemap.xml` lists all published articles
- [ ] Phase 55: `/robots.txt` includes sitemap URL
- [ ] Phase 56: `/feed.xml` returns valid RSS with latest articles
- [ ] Phase 57: `/articles/[slug]/opengraph-image` returns a 1200×630 branded PNG
- [ ] Phase 57: OG image URL referenced in article metadata
- [ ] Phase 58: `docs/seo-submission-checklist.md` created
