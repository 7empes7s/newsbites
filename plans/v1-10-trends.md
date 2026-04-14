# V1 Block 10 — Trends Panels
**Phases 31–32 | Depends on: Block 0 (panel infrastructure)**

> **Read `CONTEXT.md` first.**

---

## What You're Building

Articles about trends show **actual virality data**: a Google Trends sparkline for the article's primary keyword, and a Reddit sentiment meter showing what people are actually saying.

---

## Phase 31 — Google Trends Sparkline

### The challenge

Google Trends has no official API. The unofficial `google-trends-api` npm package works but is fragile. The approach here is: build a **server-side API route** that wraps the unofficial library and caches aggressively, so if the library breaks, only the trends sparkline disappears — the article is unaffected.

**Install the package:**
```bash
npm install google-trends-api
```

**File: `app/api/trends/route.ts`**

```typescript
import googleTrends from 'google-trends-api';

// Simple in-memory cache to avoid hammering Google
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 3600 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('q');
  if (!keyword) return Response.json({ error: 'Missing q param' }, { status: 400 });

  const cached = cache.get(keyword);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return Response.json(cached.data);
  }

  try {
    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
    });
    const parsed = JSON.parse(result);
    const points = parsed?.default?.timelineData?.map(
      (p: { value: number[] }) => p.value[0]
    ) ?? [];
    const data = { keyword, points };
    cache.set(keyword, { data, ts: Date.now() });
    return Response.json(data);
  } catch {
    // Return empty rather than 500 — trends is non-critical
    return Response.json({ keyword, points: [] });
  }
}
```

**File: `components/panels/trends/GoogleTrendsSparkline.tsx`** (client component)

```typescript
'use client';
import { useState, useEffect } from 'react';

type Props = { keyword: string };

export function GoogleTrendsSparkline({ keyword }: Props) {
  const [points, setPoints] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trends?q=${encodeURIComponent(keyword)}`)
      .then(r => r.json())
      .then(data => { setPoints(data.points || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [keyword]);

  if (loading) return <div className="panel-section"><div className="skeleton-line" /></div>;
  if (points.length === 0) return null; // hide silently if no data

  const max = Math.max(...points, 1);
  const svgPoints = points
    .map((v, i) => `${(i / (points.length - 1)) * 120},${30 - (v / max) * 26}`)
    .join(' ');
  const currentScore = points[points.length - 1] ?? 0;

  return (
    <div className="panel-section">
      <h3 className="panel-section-title">Trending Interest</h3>
      <div className="trends-widget">
        <div className="trends-meta">
          <span className="trends-keyword">{keyword}</span>
          <span className="trends-score">{currentScore}/100</span>
        </div>
        <svg viewBox="0 0 120 30" width="100%" height="48">
          <polyline points={svgPoints} fill="none" stroke="#F5A623" strokeWidth="1.5" />
        </svg>
        <p className="trends-label">Interest over time — last 7 days</p>
      </div>
    </div>
  );
}
```

Add to `app/globals.css`:
```css
.trends-widget { padding: 0.25rem 0; }
.trends-meta { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
.trends-keyword { font-weight: 600; font-size: 0.875rem; }
.trends-score { font-size: 0.875rem; color: #F5A623; font-weight: 700; }
.trends-label { font-size: 0.6875rem; color: var(--color-text-muted, #6b7280); margin-top: 0.25rem; }
```

Register for `trends` vertical. Keyword = article's first tag or title's first word.

---

## Phase 32 — Reddit Sentiment Meter

**File: `app/api/reddit/route.ts`**

Reddit API free tier: 60 req/min with app credentials.

```typescript
// Reddit OAuth token exchange
async function getRedditToken() {
  const clientId = process.env.REDDIT_CLIENT_ID || '';
  const clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'NewsBites/1.0',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token as string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) return Response.json({ error: 'Missing q' }, { status: 400 });

  try {
    const token = await getRedditToken();
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://oauth.reddit.com/search?q=${encoded}&sort=hot&limit=5&t=week`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'NewsBites/1.0',
        },
      }
    );
    const data = await res.json();
    const posts = data?.data?.children?.map((c: { data: { title: string; score: number; num_comments: number; url: string } }) => ({
      title: c.data.title,
      score: c.data.score,
      comments: c.data.num_comments,
      url: c.data.url,
    })) ?? [];
    return Response.json({ posts });
  } catch {
    return Response.json({ posts: [] });
  }
}
```

**File: `components/panels/trends/RedditSentimentCard.tsx`** (client component)

Shows:
- Simple sentiment label: "Positive" / "Neutral" / "Negative" (based on keyword tone in titles — simple word-matching heuristic)
- Top 3 Reddit posts: title (truncated 80 chars), upvote count, comment count
- Link to full post

Add Reddit app credentials to `.env.local`:
```
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
```

Get credentials at: reddit.com/prefs/apps → create app → "script" type.

### How to test
1. Open `trends-interface-fatigue` article
2. Panel shows a Google Trends sparkline for "interface fatigue" or the article's first tag
3. Reddit sentiment card shows top posts about the topic
4. If either API fails, the section disappears silently (no error shown to reader)

---

## Done Checklist

- [ ] Phase 31: `app/api/trends/route.ts` fetches and caches Google Trends data
- [ ] Phase 31: `GoogleTrendsSparkline.tsx` renders SVG sparkline as client component
- [ ] Phase 31: Fails silently (returns nothing) if API breaks
- [ ] Phase 32: `app/api/reddit/route.ts` fetches top posts for a query
- [ ] Phase 32: `RedditSentimentCard.tsx` shows posts with upvote/comment counts
- [ ] Phase 32: Reddit credentials added to `.env.local`
- [ ] Both panels register for `trends` vertical
