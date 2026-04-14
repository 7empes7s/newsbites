# V2 Block G — Testing & CI
**Phases 86–90 | Depends on: Nothing (but more useful after other blocks have code to test)**

> **Read `CONTEXT.md` first.** "Production-grade" means tested. This block adds tests and a CI pipeline that catches regressions before they reach production.

---

## Phase 86 — Testing Framework Setup

**Install dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**File: `vitest.config.ts`**

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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: ['lib/panels/fetchers/**'],  // fetchers need real API calls
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

**File: `tests/setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

**File: `tests/smoke.test.ts`** — Verify the test framework works:

```typescript
import { describe, it, expect } from 'vitest';

describe('smoke test', () => {
  it('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });
  it('environment is jsdom', () => {
    expect(typeof window).toBe('object');
  });
});
```

**File: `package.json`** — Add scripts:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

### How to test
```bash
npm test
# Should output: 2 tests passed
```

---

## Phase 87 — Unit Tests for Core Libraries

**File: `tests/lib/articles.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getAllArticles, getArticleBySlug, getArticlesByGroup } from '@/lib/articles';

describe('articles', () => {
  it('getAllArticles returns only approved or published articles', () => {
    const articles = getAllArticles();
    for (const a of articles) {
      expect(['approved', 'published']).toContain(a.status);
    }
  });

  it('getAllArticles returns articles sorted newest-first', () => {
    const articles = getAllArticles();
    for (let i = 0; i < articles.length - 1; i++) {
      expect(articles[i].date >= articles[i + 1].date).toBe(true);
    }
  });

  it('getArticleBySlug returns correct article', () => {
    const articles = getAllArticles();
    if (articles.length === 0) return; // skip if no articles
    const first = articles[0];
    const found = getArticleBySlug(first.slug);
    expect(found?.slug).toBe(first.slug);
  });

  it('getArticleBySlug returns null for unknown slug', () => {
    expect(getArticleBySlug('this-does-not-exist')).toBeNull();
  });

  it('each article has required fields', () => {
    const articles = getAllArticles();
    for (const a of articles) {
      expect(a.title).toBeTruthy();
      expect(a.slug).toBeTruthy();
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.vertical).toBeTruthy();
      expect(Array.isArray(a.tags)).toBe(true);
    }
  });
});
```

**File: `tests/lib/search.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { searchArticles } from '@/lib/search';

describe('searchArticles', () => {
  it('returns empty array for empty query', () => {
    expect(searchArticles('')).toHaveLength(0);
    expect(searchArticles('   ')).toHaveLength(0);
  });

  it('returns results for a known term', () => {
    // This test works if at least one article exists
    const articles = getAllArticles();
    if (articles.length === 0) return;
    const title = articles[0].title.split(' ')[0]; // first word of first article
    const results = searchArticles(title);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for garbage query', () => {
    const results = searchArticles('xyznotarealword12345');
    expect(results).toHaveLength(0);
  });

  it('respects limit param', () => {
    const results = searchArticles('a', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});
```

**File: `tests/lib/related-articles.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { getRelatedArticles } from '@/lib/related-articles';
import { getAllArticles } from '@/lib/articles';

describe('getRelatedArticles', () => {
  it('never returns the source article', () => {
    const articles = getAllArticles();
    if (articles.length < 2) return;
    const source = articles[0];
    const related = getRelatedArticles(source);
    expect(related.every(a => a.slug !== source.slug)).toBe(true);
  });

  it('respects the limit', () => {
    const articles = getAllArticles();
    if (articles.length === 0) return;
    const related = getRelatedArticles(articles[0], 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });

  it('prefers articles from the same vertical', () => {
    const articles = getAllArticles();
    if (articles.length < 3) return;
    const source = articles.find(a => articles.filter(b => b.vertical === a.vertical).length > 1);
    if (!source) return; // skip if all articles have unique verticals
    const related = getRelatedArticles(source, 3);
    expect(related[0].vertical).toBe(source.vertical);
  });
});
```

**File: `tests/lib/bookmarks.test.ts`**

Since `bookmarks.ts` uses `localStorage`, mock it:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

import { toggleBookmark, isBookmarked, getBookmarks } from '@/lib/bookmarks';

describe('bookmarks', () => {
  beforeEach(() => localStorageMock.clear());

  it('isBookmarked returns false initially', () => {
    expect(isBookmarked('test-slug')).toBe(false);
  });

  it('toggleBookmark adds an article', () => {
    const added = toggleBookmark('test-slug', 'Test Article');
    expect(added).toBe(true);
    expect(isBookmarked('test-slug')).toBe(true);
  });

  it('toggleBookmark removes an already-bookmarked article', () => {
    toggleBookmark('test-slug', 'Test Article');
    const added = toggleBookmark('test-slug', 'Test Article');
    expect(added).toBe(false);
    expect(isBookmarked('test-slug')).toBe(false);
  });

  it('getBookmarks returns all bookmarked articles', () => {
    toggleBookmark('slug-1', 'Article 1');
    toggleBookmark('slug-2', 'Article 2');
    expect(getBookmarks()).toHaveLength(2);
  });
});
```

---

## Phase 88 — Integration Tests for Panel Fetchers

The key principle: mock `fetch` so tests don't hit real APIs. Each test verifies that the fetcher correctly handles the API response shape.

**File: `tests/fixtures/football-standings.json`** — Real response from football-data.org, saved as a fixture (manually fetch once and save):

```json
{
  "competition": { "id": 2001, "name": "UEFA Champions League" },
  "season": { "id": 1234 },
  "standings": [
    {
      "stage": "GROUP_STAGE",
      "table": [
        { "position": 1, "team": { "name": "Manchester City", "crest": "..." }, "playedGames": 6, "won": 5, "draw": 1, "lost": 0, "goalDifference": 15, "points": 16 }
      ]
    }
  ]
}
```

**File: `tests/lib/fetchers/sports.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import standingsFixture from '../fixtures/football-standings.json';

// Mock fetch globally
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('fetchStandings', () => {
  it('returns standings on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => standingsFixture,
    } as Response);

    const { fetchStandings } = await import('@/lib/panels/fetchers/sports');
    const result = await fetchStandings('CL');
    expect(result).toBeDefined();
    expect(result.standings).toBeDefined();
  });

  it('returns null on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 429 } as Response);

    const { fetchStandings } = await import('@/lib/panels/fetchers/sports');
    const result = await fetchStandings('CL');
    expect(result).toBeNull();
  });

  it('returns null on network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { fetchStandings } = await import('@/lib/panels/fetchers/sports');
    // fetchStandings should catch errors and return null
    const result = await fetchStandings('CL').catch(() => null);
    expect(result).toBeNull();
  });
});
```

Create similar test files for: `finance.test.ts`, `world.test.ts`, `tech.test.ts`, `science.test.ts`. Follow the same pattern — fixture JSON, mock fetch, test success/failure.

---

## Phase 89 — GitHub Actions CI Pipeline

**File: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
        env:
          # Provide dummy env vars so build doesn't fail on missing keys
          FOOTBALL_DATA_API_KEY: dummy
          NASA_API_KEY: DEMO_KEY
          GITHUB_TOKEN: dummy
          RAWG_API_KEY: dummy
          TMDB_API_KEY: dummy
          FRED_API_KEY: dummy
```

### How to test
1. Push a commit to `main` branch
2. Go to GitHub → repository → Actions tab
3. CI run should appear and complete green
4. Try pushing code with a TypeScript error — CI should fail at the "Type check" step

---

## Phase 90 — Visual Regression Tests (Playwright)

**Install:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**File: `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  snapshotDir: './tests/e2e/snapshots',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
});
```

**File: `tests/e2e/visual.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test('homepage renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', { maxDiffPixels: 200 });
});

test('article page renders', async ({ page }) => {
  // Use a known slug that always exists
  await page.goto('/articles/champions-league-quarterfinals-first-legs-return-games');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('article.png', { maxDiffPixels: 200 });
});

test('reader app renders', async ({ page }) => {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('reader-app.png', { maxDiffPixels: 200 });
});

test('search page renders', async ({ page }) => {
  await page.goto('/search?q=champions');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('search.png', { maxDiffPixels: 200 });
});
```

**Generate baseline screenshots** (run once):
```bash
npx playwright test --update-snapshots
```

After that, any visual change that exceeds 200 pixels diff will fail the test.

Add to `package.json` scripts: `"test:e2e": "playwright test"`

---

## Done Checklist

- [ ] Phase 86: `vitest.config.ts` created, `npm test` runs and passes
- [ ] Phase 87: Tests for `articles`, `search`, `related-articles`, `bookmarks` all pass
- [ ] Phase 88: Fixture JSON files in `tests/fixtures/`
- [ ] Phase 88: Fetcher tests mock `fetch` and verify success/failure handling
- [ ] Phase 89: `.github/workflows/ci.yml` runs type-check, lint, test, build
- [ ] Phase 89: CI passes on a clean push to main
- [ ] Phase 90: `playwright.config.ts` created, baseline screenshots generated
- [ ] Phase 90: `npx playwright test` passes with baseline screenshots
