# V2 Block E — Engagement & Social
**Phases 77–82 | Depends on: Phase 62 (history/bookmarks) for phases 80–81**

> **Read `CONTEXT.md` first.**

---

## Phase 77 — Share Buttons

**File: `components/ShareBar.tsx`** (client component)

```typescript
'use client';
import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

type Props = {
  url: string;   // full URL, e.g. https://news.techinsiderbytes.com/articles/...
  title: string;
};

const PLATFORMS = [
  {
    name: 'Twitter / X',
    icon: '𝕏',
    getHref: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'Telegram',
    icon: '✈',
    getHref: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'LinkedIn',
    icon: 'in',
    getHref: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    icon: '📱',
    getHref: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  },
];

export function ShareBar({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback: select text */ }
  }

  return (
    <div className="share-bar">
      <span className="share-label">Share:</span>
      {PLATFORMS.map(p => (
        <a
          key={p.name}
          href={p.getHref(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          aria-label={`Share on ${p.name}`}
        >
          {p.icon}
        </a>
      ))}
      <button onClick={copyLink} className="share-btn" aria-label="Copy link">
        {copied ? <Check size={16} /> : <Link2 size={16} />}
      </button>
    </div>
  );
}
```

Add to `app/articles/[slug]/page.tsx`:
- Below article title (top of article)
- Below article content (bottom of article, before related articles)

Pass the canonical URL: `url={`https://news.techinsiderbytes.com/articles/${article.slug}`}`

---

## Phase 78 — Notification Preferences Page

**File: `lib/notification-prefs.ts`**

```typescript
type NotificationPrefs = {
  followedVerticals: string[];    // ["ai", "sports"]
  breakingNews: boolean;
  dailyBriefing: boolean;
};

const KEY = 'newsbites-notification-prefs';

export function getNotificationPrefs(): NotificationPrefs {
  try {
    return { followedVerticals: [], breakingNews: false, dailyBriefing: false,
      ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch { return { followedVerticals: [], breakingNews: false, dailyBriefing: false }; }
}

export function setNotificationPrefs(prefs: Partial<NotificationPrefs>): void {
  localStorage.setItem(KEY, JSON.stringify({ ...getNotificationPrefs(), ...prefs }));
}
```

**File: `app/settings/page.tsx`** (client component)

Sections:
1. **Followed Verticals** — toggle per vertical (ai, finance, sports, global-politics, anime, gaming, etc.)
2. **Alerts** — "Breaking news alerts" toggle, "Daily briefing" toggle
3. **Appearance** — link to theme toggle (dark mode already works from Phase 59)

Clean, grouped layout with toggle switches (CSS-only, no library needed):

```css
.settings-toggle {
  display: flex; align-items: center; gap: 0.75rem;
}
.toggle-switch {
  width: 2.5rem; height: 1.25rem; border-radius: 9999px;
  background: var(--color-border); cursor: pointer;
  position: relative; transition: background 0.2s;
}
.toggle-switch.on { background: #F5A623; }
.toggle-knob {
  position: absolute; top: 2px; left: 2px;
  width: 1rem; height: 1rem; border-radius: 9999px;
  background: white; transition: transform 0.2s;
}
.toggle-switch.on .toggle-knob { transform: translateX(1.25rem); }
```

Add a gear icon link to settings in `components/site-chrome.tsx`.

---

## Phase 79 — Web Push Notifications

**Important:** Push notifications require HTTPS (already have it via Cloudflare). Needs a service worker (built in Phase 84). Do Phase 83 before this.

**Generate VAPID keys** (one-time, run on the server):
```bash
npx web-push generate-vapid-keys
```
Add to `.env.local`:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@techinsiderbytes.com
```

**Install dependency:**
```bash
npm install web-push
```

**File: `app/api/push/subscribe/route.ts`**

```typescript
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

const SUBS_FILE = path.join(process.cwd(), 'content/push-subscriptions.json');

export async function POST(request: Request) {
  const subscription = await request.json();
  const subs = existsSync(SUBS_FILE)
    ? JSON.parse(readFileSync(SUBS_FILE, 'utf8'))
    : [];
  // Dedup by endpoint
  if (!subs.find((s: { endpoint: string }) => s.endpoint === subscription.endpoint)) {
    subs.push({ ...subscription, subscribedAt: new Date().toISOString() });
    writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
  }
  return Response.json({ ok: true });
}
```

**File: `scripts/send-push.mjs`** — Send push for a new article:

```javascript
import webpush from 'web-push';
import { readFileSync, existsSync } from 'fs';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const slug = process.argv[2];
const title = process.argv[3];
if (!slug || !title) { console.error('Usage: node send-push.mjs <slug> <title>'); process.exit(1); }

const subsFile = 'content/push-subscriptions.json';
const subs = existsSync(subsFile) ? JSON.parse(readFileSync(subsFile, 'utf8')) : [];

const payload = JSON.stringify({
  title: `NewsBites: ${title}`,
  body: 'New article published',
  url: `https://news.techinsiderbytes.com/articles/${slug}`,
});

let sent = 0, failed = 0;
for (const sub of subs) {
  try {
    await webpush.sendNotification(sub, payload);
    sent++;
  } catch { failed++; }
}
console.log(`Push sent: ${sent} success, ${failed} failed`);
```

Call from `scripts/publish-dossier.mjs` after publishing:
```javascript
execSync(`node scripts/send-push.mjs ${slug} "${article.title}"`, { stdio: 'inherit' });
```

---

## Phase 80 — Personalized Daily Briefing Page

**File: `app/briefing/page.tsx`** (client component)

```typescript
'use client';
import { useState, useEffect } from 'react';
import { getNotificationPrefs } from '@/lib/notification-prefs';
import { getHistory } from '@/lib/bookmarks';

// We can't use getAllArticles() in a client component directly.
// Fetch from an API route instead.

export default function BriefingPage() {
  const [articles, setArticles] = useState([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

    const prefs = getNotificationPrefs();
    const history = getHistory();
    const readSlugs = new Set(history.map(h => h.slug));

    fetch('/api/briefing?' + new URLSearchParams({
      verticals: prefs.followedVerticals.join(','),
    }))
      .then(r => r.json())
      .then(data => setArticles(data.articles.filter(a => !readSlugs.has(a.slug)).slice(0, 5)));
  }, []);

  return (
    <main className="page-shell">
      <div className="briefing-header">
        <h1>{greeting} — Your Briefing</h1>
        <p className="briefing-date">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>
      <ol className="briefing-list">
        {articles.map((a, i) => (
          <li key={a.slug} className="briefing-item">
            <span className="briefing-number">{i + 1}</span>
            <div>
              <span className="briefing-vertical">{a.vertical}</span>
              <a href={`/articles/${a.slug}`}><h3>{a.title}</h3></a>
              <p>{a.lead}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
```

**File: `app/api/briefing/route.ts`**

```typescript
import { getAllArticles } from '@/lib/articles';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verticals = searchParams.get('verticals')?.split(',').filter(Boolean) ?? [];

  const all = getAllArticles();
  const last48h = Date.now() - 48 * 60 * 60 * 1000;

  // Score: vertical match = 3 pts, recent (<48h) = 2 pts
  const scored = all.map(a => {
    let score = 0;
    if (verticals.length === 0 || verticals.includes(a.vertical)) score += 3;
    if (new Date(a.date).getTime() > last48h) score += 2;
    return { ...a, score };
  });

  const articles = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score: _, ...a }) => a);

  return Response.json({ articles });
}
```

Add "Today's Briefing" link to `components/site-chrome.tsx`.

---

## Phase 81 — Prediction Tracker Dashboard

**File: `content/predictions/` directory** — One JSON file per prediction.

**File: `lib/predictions.ts`**

```typescript
import fs from 'fs';
import path from 'path';

type Prediction = {
  id: string;
  matchDate: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  prediction: { homeWin: number; draw: number; awayWin: number };
  predictedOutcome: 'homeWin' | 'draw' | 'awayWin';
  confidence: 'high' | 'medium' | 'low';
  articleSlug: string;
  resolved: boolean;
  correct?: boolean;
  actualResult?: { homeGoals: number; awayGoals: number };
};

export function getAllPredictions(): Prediction[] {
  const dir = path.join(process.cwd(), 'content/predictions');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

export function getPredictionStats() {
  const preds = getAllPredictions().filter(p => p.resolved);
  if (preds.length === 0) return null;
  const correct = preds.filter(p => p.correct).length;
  const byConf = { high: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, low: { correct: 0, total: 0 } };
  for (const p of preds) {
    byConf[p.confidence].total++;
    if (p.correct) byConf[p.confidence].correct++;
  }
  return { total: preds.length, correct, accuracy: (correct / preds.length * 100).toFixed(1), byConfidence: byConf };
}
```

**File: `app/predictions/page.tsx`** — Shows:
1. Overall accuracy headline: "TIB Pronostics: **63.2%** correct (47 of 75)"
2. Breakdown by confidence level
3. Recent predictions list with ✓/✗ badges, match result

**File: `scripts/record-prediction.mjs`** — Save a new prediction at publish time.
**File: `scripts/resolve-prediction.mjs`** — Fetch actual result and mark correct/incorrect.

---

## Phase 82 — Article Series / Story Threads

**File: `lib/articles.ts`** — Add `series` and `seriesOrder` to the `Frontmatter` type:

```typescript
type Frontmatter = {
  // ... existing fields
  series?: string;       // e.g. "Champions League 2025-26"
  seriesOrder?: number;  // 1, 2, 3...
};
```

**File: `lib/series.ts`**

```typescript
import { getAllArticles } from '@/lib/articles';
import type { Article } from '@/lib/articles';

export function getSeriesArticles(seriesName: string): Article[] {
  return getAllArticles()
    .filter(a => a.series === seriesName)
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
}

export function getArticleSeries(article: Article) {
  if (!article.series) return null;
  const articles = getSeriesArticles(article.series);
  const currentIndex = articles.findIndex(a => a.slug === article.slug);
  return { name: article.series, articles, currentIndex };
}
```

**File: `components/SeriesNav.tsx`**

```typescript
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Article } from '@/lib/articles';

type Props = {
  name: string;
  articles: Article[];
  currentIndex: number;
};

export function SeriesNav({ name, articles, currentIndex }: Props) {
  const prev = articles[currentIndex - 1];
  const next = articles[currentIndex + 1];

  return (
    <div className="series-nav">
      <div className="series-label">
        Part {currentIndex + 1} of {articles.length} in <strong>{name}</strong>
      </div>
      <div className="series-nav-links">
        {prev && (
          <Link href={`/articles/${prev.slug}`} className="series-nav-prev">
            <ChevronLeft size={16} /> {prev.title}
          </Link>
        )}
        {next && (
          <Link href={`/articles/${next.slug}`} className="series-nav-next">
            {next.title} <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
```

Add to `app/articles/[slug]/page.tsx` above article content if `getArticleSeries(article)` returns non-null.

---

## Done Checklist

- [ ] Phase 77: Share buttons for Twitter, Telegram, LinkedIn, WhatsApp, Copy Link
- [ ] Phase 77: Share bar appears at top and bottom of article
- [ ] Phase 78: `/settings` page with vertical toggles and alert preferences
- [ ] Phase 79: Web Push: subscribe endpoint, VAPID keys, send script
- [ ] Phase 79: Push notification fires when article published
- [ ] Phase 80: `/briefing` page shows 5 personalized articles, filters already-read
- [ ] Phase 81: `/predictions` page shows accuracy stats and recent predictions
- [ ] Phase 82: Series nav appears on articles with `series` frontmatter
