# V2 Block B — Reader Experience Essentials
**Phases 59–66 | Depends on: Nothing**

> **Read `CONTEXT.md` first.** These are table-stakes features readers expect from any modern news app.

---

## Phase 59 — Dark Mode

### What to build

**File: `app/globals.css`** — Add CSS variables and dark mode overrides. Find the `:root` block (or create one) and define all color variables there. Then add a `[data-theme="dark"]` block with overrides.

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-brand-navy: #1B2A4A;
  --color-brand-amber: #F5A623;
}

[data-theme="dark"] {
  --color-bg: #0a0f1a;
  --color-surface: #141b2d;
  --color-text: #e2e8f0;
  --color-text-muted: #94a3b8;
  --color-border: #1e293b;
  --color-brand-navy: #e2e8f0;
  --color-brand-amber: #F5A623;
}
```

Update every existing CSS class that uses hardcoded colors (like `background: white`, `color: #1B2A4A`) to use `var(--color-bg)`, `var(--color-text)`, etc.

**File: `app/layout.tsx`** — Add a tiny inline script **before** the `<body>` tag to read localStorage and set `data-theme` before the first paint. This prevents the flash of wrong theme (FOUC):

```typescript
// In the <html> element, before <body>:
<script
  dangerouslySetInnerHTML={{
    __html: `
      try {
        const t = localStorage.getItem('newsbites-theme');
        if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch(e) {}
    `,
  }}
/>
```

**File: `components/ThemeToggle.tsx`** (client component)

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('newsbites-theme', next ? 'dark' : 'light');
  }

  return (
    <button onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
```

Add `<ThemeToggle />` to `components/site-chrome.tsx` in the header area.

### How to test
1. Click the toggle — page switches to dark mode instantly, no flash
2. Refresh the page — dark mode persists
3. Check homepage, article page, finance page, reader app — all look correct in dark mode

---

## Phase 60 — Full-Text Article Search

### What to build

**Install dependency:**
```bash
npm install fuse.js
```

**File: `lib/search.ts`**

```typescript
import Fuse from 'fuse.js';
import { getAllArticles } from '@/lib/articles';
import type { Article } from '@/lib/articles';

type SearchResult = {
  article: Article;
  score: number;
};

let fuse: Fuse<Article> | null = null;

function getFuse() {
  if (fuse) return fuse;
  const articles = getAllArticles();
  fuse = new Fuse(articles, {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'lead', weight: 2 },
      { name: 'tags', weight: 2 },
      { name: 'author', weight: 0.5 },
      { name: 'previewText', weight: 1 },
    ],
    threshold: 0.4,    // 0 = exact, 1 = anything. 0.4 is a good balance
    includeScore: true,
    minMatchCharLength: 2,
  });
  return fuse;
}

export function searchArticles(query: string, limit = 10): SearchResult[] {
  if (!query.trim()) return [];
  const results = getFuse().search(query, { limit });
  return results.map(r => ({ article: r.item, score: r.score ?? 1 }));
}
```

**File: `app/search/page.tsx`** (client component — needs URL param reading)

```typescript
'use client';
import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchArticles } from '@/lib/search';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        startTransition(() => {
          setResults(searchArticles(query));
          // Update URL without navigation
          router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
        });
      } else {
        setResults([]);
      }
    }, 300); // debounce
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <main className="page-shell">
      <div className="search-container">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="search-input"
          autoFocus
        />

        {query && results.length === 0 && (
          <p className="search-empty">No articles match "{query}"</p>
        )}
        {!query && (
          <p className="search-prompt">Start typing to search all articles</p>
        )}

        <ul className="search-results">
          {results.map(({ article }) => (
            <li key={article.slug}>
              {/* Reuse the existing article card or render inline */}
              <a href={`/articles/${article.slug}`} className="search-result-item">
                <span className="search-result-vertical">{article.vertical}</span>
                <h3>{article.title}</h3>
                <p>{article.lead}</p>
                <span className="search-result-meta">{article.dateLabel} · {article.readingTime}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
```

**File: `components/SearchButton.tsx`** (client component) — opens search on `Cmd+K` / `Ctrl+K`:

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchButton() {
  const router = useRouter();
  const openSearch = () => router.push('/search');

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <button onClick={openSearch} aria-label="Search articles (Cmd+K)">
      <Search size={18} />
    </button>
  );
}
```

Add `<SearchButton />` to `components/site-chrome.tsx`.

---

## Phase 61 — Reading Progress Bar

**File: `components/ReadingProgressBar.tsx`** (client component)

```typescript
'use client';
import { useState, useEffect } from 'react';

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docH > 0 ? Math.min(100, (scrollY / docH) * 100) : 0);
    }
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      className="reading-progress-bar"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}
```

Add to `app/globals.css`:
```css
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: #F5A623;
  z-index: 100;
  transition: width 0.1s linear;
}
```

Add `<ReadingProgressBar />` to `app/articles/[slug]/page.tsx`.

---

## Phase 62 — Bookmarks & Reading History

**File: `lib/bookmarks.ts`**

```typescript
const BOOKMARKS_KEY = 'newsbites-bookmarks';
const HISTORY_KEY = 'newsbites-history';

type BookmarkEntry = { slug: string; title: string; savedAt: string };
type HistoryEntry = { slug: string; title: string; readAt: string; scrollPercent: number };

// Bookmarks
export function getBookmarks(): BookmarkEntry[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]'); } catch { return []; }
}
export function isBookmarked(slug: string): boolean {
  return getBookmarks().some(b => b.slug === slug);
}
export function toggleBookmark(slug: string, title: string): boolean {
  const bookmarks = getBookmarks();
  const idx = bookmarks.findIndex(b => b.slug === slug);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.unshift({ slug, title, savedAt: new Date().toISOString() });
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks.slice(0, 200)));
  return idx < 0; // returns true if added
}

// Reading history
export function recordRead(slug: string, title: string, scrollPercent: number): void {
  try {
    const history: HistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const existing = history.findIndex(h => h.slug === slug);
    const entry: HistoryEntry = { slug, title, readAt: new Date().toISOString(), scrollPercent };
    if (existing >= 0) history.splice(existing, 1);
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  } catch { /* ignore */ }
}
export function getHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
```

**File: `components/BookmarkButton.tsx`** (client component):

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toggleBookmark, isBookmarked } from '@/lib/bookmarks';

export function BookmarkButton({ slug, title }: { slug: string; title: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(isBookmarked(slug)); }, [slug]);

  function handle() {
    const added = toggleBookmark(slug, title);
    setSaved(added);
  }

  return (
    <button onClick={handle} aria-label={saved ? 'Remove bookmark' : 'Bookmark this article'}>
      {saved ? <BookmarkCheck size={20} color="#F5A623" /> : <Bookmark size={20} />}
    </button>
  );
}
```

Add `<BookmarkButton slug={article.slug} title={article.title} />` to `app/articles/[slug]/page.tsx`.

Create `app/bookmarks/page.tsx` and `app/history/page.tsx` — both are simple client pages that read from localStorage and render article links. Follow the same pattern as the search results page.

---

## Phase 63 — Custom Error Pages

**File: `app/not-found.tsx`**

```typescript
import Link from 'next/link';
import { getLatestArticles } from '@/lib/articles';

export default function NotFound() {
  const suggestions = getLatestArticles(3);
  return (
    <main className="page-shell">
      <div className="error-page">
        <h1 className="error-code">404</h1>
        <p className="error-message">This page doesn't exist.</p>
        <p>But these articles might interest you:</p>
        <ul>
          {suggestions.map(a => (
            <li key={a.slug}><Link href={`/articles/${a.slug}`}>{a.title}</Link></li>
          ))}
        </ul>
        <Link href="/" className="error-home-link">← Back to homepage</Link>
      </div>
    </main>
  );
}
```

**File: `app/error.tsx`** (must be `'use client'`):

```typescript
'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="page-shell">
      <div className="error-page">
        <h1>Something went wrong</h1>
        <button onClick={reset}>Try again</button>
        <a href="/">← Back to homepage</a>
      </div>
    </main>
  );
}
```

---

## Phase 64 — Accessibility Audit

Run Lighthouse accessibility audit on: homepage, an article page, `/app`, `/search`.

Fix all issues found. The most common ones:

- **Missing alt text:** Every `<img>` needs `alt=""` (empty string for decorative) or descriptive text
- **Color contrast:** Check all text-on-background combinations — must be ≥ 4.5:1. Use https://webaim.org/resources/contrastchecker/
- **Skip link:** Add at the very top of `components/site-chrome.tsx`:
  ```html
  <a href="#main-content" className="sr-only focus:not-sr-only skip-link">Skip to content</a>
  ```
- **Icon buttons:** All buttons with only an icon need `aria-label`
- **Focus ring:** Add to `globals.css`:
  ```css
  :focus-visible {
    outline: 2px solid #F5A623;
    outline-offset: 2px;
    border-radius: 2px;
  }
  ```
- **Heading order:** Verify h1 → h2 → h3 order in article pages (no skipping)

### How to test
- Run `npx lighthouse http://localhost:3000 --only-categories=accessibility` — target score ≥ 95
- Navigate the entire site with Tab key only — every interactive element should be reachable

---

## Phase 65 — Continue Reading Bar

**File: `components/ContinueReadingBar.tsx`** (client component)

```typescript
'use client';
import { useState, useEffect } from 'react';
import { getHistory } from '@/lib/bookmarks';
import Link from 'next/link';
import { X } from 'lucide-react';

export function ContinueReadingBar() {
  const [article, setArticle] = useState<{ slug: string; title: string; scrollPercent: number } | null>(null);

  useEffect(() => {
    // Show once per session
    if (sessionStorage.getItem('continue-bar-shown')) return;

    const history = getHistory();
    const dismissed = JSON.parse(localStorage.getItem('newsbites-dismissed-continue') || '[]');
    const candidate = history.find(h =>
      h.scrollPercent < 90 &&
      !dismissed.includes(h.slug) &&
      // Only if read within last 7 days
      Date.now() - new Date(h.readAt).getTime() < 7 * 86400 * 1000
    );
    if (candidate) setArticle(candidate);
    sessionStorage.setItem('continue-bar-shown', '1');
  }, []);

  if (!article) return null;

  function dismiss() {
    const dismissed = JSON.parse(localStorage.getItem('newsbites-dismissed-continue') || '[]');
    dismissed.push(article!.slug);
    localStorage.setItem('newsbites-dismissed-continue', JSON.stringify(dismissed));
    setArticle(null);
  }

  return (
    <div className="continue-bar">
      <Link href={`/articles/${article.slug}`} className="continue-bar-link">
        Continue reading: <strong>{article.title}</strong>
        <span className="continue-bar-progress"> — {article.scrollPercent}% through</span>
      </Link>
      <button onClick={dismiss} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}
```

Add `<ContinueReadingBar />` to the homepage (`app/page.tsx`) and reader app (`app/app/page.tsx`).

---

## Phase 66 — Related Articles Engine

**File: `lib/related-articles.ts`**

```typescript
import type { Article } from '@/lib/articles';
import { getAllArticles } from '@/lib/articles';
import { getGroupForVertical } from '@/lib/article-taxonomy';

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const all = getAllArticles().filter(a => a.slug !== article.slug);
  const group = getGroupForVertical(article.vertical);

  const scored = all.map(a => {
    let score = 0;
    if (a.vertical === article.vertical) score += 3;
    else if (getGroupForVertical(a.vertical) === group) score += 1;
    // Shared tags
    const shared = a.tags.filter(t => article.tags.includes(t));
    score += shared.length * 2;
    return { article: a, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || b.article.date.localeCompare(a.article.date))
    .slice(0, limit)
    .map(s => s.article);
}
```

**File: `components/RelatedArticles.tsx`**

```typescript
import Link from 'next/link';
import type { Article } from '@/lib/articles';

export function RelatedArticles({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="related-articles">
      <h2 className="related-title">Related coverage</h2>
      <ul className="related-list">
        {articles.map(a => (
          <li key={a.slug} className="related-item">
            <Link href={`/articles/${a.slug}`}>
              <span className="related-vertical">{a.vertical}</span>
              <h3>{a.title}</h3>
              <p>{a.lead}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Add to `app/articles/[slug]/page.tsx` below the article content:
```typescript
const related = getRelatedArticles(article);
// ...
<RelatedArticles articles={related} />
```

---

## Done Checklist

- [ ] Phase 59: Dark mode togglable, persists across refreshes, no flash on load
- [ ] Phase 59: All pages look correct in dark mode
- [ ] Phase 60: `/search` page with debounced search input
- [ ] Phase 60: `Cmd+K` opens search
- [ ] Phase 61: Amber progress bar fills as reader scrolls through article
- [ ] Phase 62: Bookmark button on article pages, `/bookmarks` page lists saved articles
- [ ] Phase 62: Reading history recorded, `/history` page shows recently read
- [ ] Phase 63: Custom 404 page with 3 article suggestions
- [ ] Phase 63: Custom error page with retry button
- [ ] Phase 64: Lighthouse accessibility score ≥ 95 on key pages
- [ ] Phase 64: Skip-to-content link at top of page
- [ ] Phase 65: Continue reading bar appears on homepage for recent unfinished articles
- [ ] Phase 66: Related articles section appears at bottom of every article
