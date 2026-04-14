# V2 Block J — Monitoring & Observability
**Phases 100–102 | Depends on: Nothing**

> **Read `CONTEXT.md` first.** You can't run a production service if you don't know when it's broken. Right now, if NewsBites goes down at 3am, nobody knows until Marouane checks Telegram. This block fixes that.

---

## Why This Block Exists

The VPS already has a watchdog system for the Vast GPU (`vast-watchdog.service`) — the same philosophy applies to NewsBites itself. This block adds three lightweight observability layers:
- **Is the site up?** → Health check endpoint (Phase 100)
- **What errors are clients hitting?** → Client-side error tracking (Phase 101)
- **Are readers actually reading?** → Privacy-respecting analytics (Phase 102)

All three avoid third-party services and run on the existing VPS. No Sentry account, no Google Analytics, no cookies, no GDPR friction.

---

## Phase 100 — Health Check Endpoint

**Goal:** `/api/health` returns service status that uptime monitors can poll.

**Why it matters:** UptimeRobot (free tier: 50 monitors, 5-min check intervals) can send a Telegram alert the moment the site goes down. One endpoint unlocks free uptime monitoring.

### File: `app/api/health/route.ts`

```typescript
import { getAllArticles } from '@/lib/articles';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const articles = getAllArticles();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    articles: articles.length,
    version: process.env.npm_package_version ?? '0.1.0',
  });
}
```

Response shape: `{ status: "ok", timestamp: "...", articles: 24, version: "0.1.0" }`

### Uptime monitoring setup (manual steps, not code)

1. Register at UptimeRobot (free)
2. Add monitor: `GET https://news.techinsiderbytes.com/api/health`, 5-min interval
3. Alert contact: Telegram bot integration (UptimeRobot supports Telegram via bot token)
   - Use Mimule's bot token and Marouane's chat ID from `/opt/mimoun/.env`
   - Or configure a separate UptimeRobot → Telegram webhook

### How to test
1. `curl https://news.techinsiderbytes.com/api/health` → returns JSON with `status: "ok"` and article count
2. Count should match `ls /opt/newsbites/content/articles/*.md | wc -l`

**Files:** `app/api/health/route.ts`

---

## Phase 101 — Client-Side Error Tracking

**Goal:** JavaScript errors in the browser are captured and written to a log file.

**Why it matters:** Panel errors, hydration mismatches, and React render failures are invisible without tracking. A PanelErrorBoundary (from V1 Phase 0) silently catches errors so the article loads — but right now those errors disappear. Phase 101 captures them.

### File: `components/ErrorReporter.tsx`

```typescript
'use client';

import { useEffect } from 'react';

export function ErrorReporter() {
  useEffect(() => {
    function report(type: string, message: string, stack?: string) {
      // Fire-and-forget — don't await, don't block anything
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.slice(0, 500),  // cap length
          stack: stack?.slice(0, 2000),
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {/* never throw from error reporter */});
    }

    const onError = (e: ErrorEvent) => report('error', e.message, e.error?.stack);
    const onUnhandled = (e: PromiseRejectionEvent) =>
      report('unhandledrejection', String(e.reason), e.reason?.stack);

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, []);

  return null;
}
```

Add `<ErrorReporter />` to `app/layout.tsx` (inside `<body>`, after `<SiteChrome>`).

### File: `app/api/errors/route.ts`

```typescript
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limit: max 10 reports per IP per minute
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const entry = rateLimiter.get(ip) ?? { count: 0, resetAt: now + 60_000 };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60_000;
  }

  entry.count++;
  rateLimiter.set(ip, entry);

  if (entry.count > 10) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.message) return NextResponse.json({ ok: false }, { status: 400 });

  const logsDir = join(process.cwd(), 'logs');
  mkdirSync(logsDir, { recursive: true });
  appendFileSync(join(logsDir, 'client-errors.jsonl'), JSON.stringify(body) + '\n');

  return NextResponse.json({ ok: true });
}
```

### File: `scripts/review-errors.mjs`

```javascript
import { readFileSync, existsSync } from 'node:fs';

const logPath = new URL('../logs/client-errors.jsonl', import.meta.url).pathname;
if (!existsSync(logPath)) { console.log('No errors logged yet.'); process.exit(0); }

const lines = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
const errors = lines.map(l => JSON.parse(l));

// Summary
const byMessage = {};
for (const e of errors) {
  byMessage[e.message] = (byMessage[e.message] ?? 0) + 1;
}

console.log(`\nClient errors (last ${errors.length} events):`);
console.log('─'.repeat(60));
Object.entries(byMessage)
  .sort(([,a],[,b]) => b - a)
  .slice(0, 20)
  .forEach(([msg, count]) => console.log(`  ${count}×  ${msg.slice(0, 80)}`));
```

Add `logs/` to `.gitignore`.

### How to test
1. Temporarily add `throw new Error('test-error')` to a client component
2. Visit the page — error is captured
3. `node scripts/review-errors.mjs` → shows the test error with count 1
4. Remove the test error

**Files:** `components/ErrorReporter.tsx`, `app/api/errors/route.ts`, `scripts/review-errors.mjs`, `app/layout.tsx`, `.gitignore`

---

## Phase 102 — Simple Analytics (Privacy-Respecting)

**Goal:** Know which articles are read, how far readers scroll, and which panels they open — no third-party trackers, no cookies, no PII.

**Why it matters:** Editorial decisions need data. "Which verticals get the most reads?" "Do readers open panels?" "What's the average scroll depth?" Without this, every editorial decision is a guess.

### File: `app/api/analytics/route.ts`

```typescript
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.type || !['pageview', 'scroll', 'panel_open'].includes(body.type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Sanitize — never store IP or any PII
  const event = {
    type:      body.type,
    slug:      String(body.slug ?? '').slice(0, 200),
    data:      body.data,
    timestamp: new Date().toISOString(),
  };

  const logsDir = join(process.cwd(), 'logs');
  mkdirSync(logsDir, { recursive: true });
  appendFileSync(join(logsDir, 'analytics.jsonl'), JSON.stringify(event) + '\n');

  return NextResponse.json({ ok: true });
}
```

### File: `lib/analytics-client.ts`

```typescript
'use client';

function send(type: string, slug: string, data?: unknown) {
  // Batch sends using beacon API when available, fallback to fetch
  const body = JSON.stringify({ type, slug, data });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }));
  } else {
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  }
}

export function trackPageview(slug: string) {
  send('pageview', slug);
}

export function trackScroll(slug: string, percent: number) {
  // Only fire at 25%, 50%, 75%, 100%
  if ([25, 50, 75, 100].includes(percent)) send('scroll', slug, { percent });
}

export function trackPanelOpen(slug: string, panelId: string) {
  send('panel_open', slug, { panelId });
}
```

Integrate into:
- `app/articles/[slug]/page.tsx` — call `trackPageview(slug)` from a client wrapper `useEffect`
- `components/article-panel/PanelDrawer.tsx` — call `trackPanelOpen(slug, panelId)` when drawer opens and a tab changes

### File: `scripts/analytics-report.mjs`

```javascript
import { readFileSync, existsSync } from 'node:fs';

const logPath = new URL('../logs/analytics.jsonl', import.meta.url).pathname;
if (!existsSync(logPath)) { console.log('No analytics yet.'); process.exit(0); }

const lines = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
const events = lines.map(l => JSON.parse(l));

const pageviews = events.filter(e => e.type === 'pageview');
const panelOpens = events.filter(e => e.type === 'panel_open');
const scrolls    = events.filter(e => e.type === 'scroll' && e.data?.percent === 100);

const bySlug = {};
for (const e of pageviews) bySlug[e.slug] = (bySlug[e.slug] ?? 0) + 1;

const topArticles = Object.entries(bySlug).sort(([,a],[,b]) => b - a).slice(0, 10);

console.log(`\n📊 Analytics Report`);
console.log(`Total pageviews:   ${pageviews.length}`);
console.log(`Articles viewed:   ${Object.keys(bySlug).length}`);
console.log(`Panel opens:       ${panelOpens.length}`);
console.log(`Full reads (100%): ${scrolls.length}`);
console.log(`Panel open rate:   ${pageviews.length ? ((panelOpens.length / pageviews.length) * 100).toFixed(1) : 0}%`);
console.log('\nTop 10 articles:');
topArticles.forEach(([slug, count], i) => console.log(`  ${i+1}. ${count}× ${slug}`));
```

Add a cron job or manual daily invocation — can pipe output to Telegram via Mimule:

```bash
node /opt/newsbites/scripts/analytics-report.mjs | node /opt/mimoun/openclaw-config/scripts/telegram-send.js
```

### How to test
1. Visit 3 different articles
2. Scroll one to 100%
3. `node scripts/analytics-report.mjs` → shows 3 pageviews, the one 100% scroll, correct top article

**Files:** `app/api/analytics/route.ts`, `lib/analytics-client.ts`, `scripts/analytics-report.mjs`, `app/articles/[slug]/page.tsx`, `components/article-panel/PanelDrawer.tsx`

---

## Done Checklist

- [ ] Phase 100: `GET /api/health` returns `{ status: "ok", articles: N, ... }`
- [ ] Phase 100: UptimeRobot monitor created (manual step, not code)
- [ ] Phase 101: `ErrorReporter.tsx` mounted in root layout
- [ ] Phase 101: `POST /api/errors` writes to `logs/client-errors.jsonl`
- [ ] Phase 101: Rate limit: no more than 10 reports/IP/minute
- [ ] Phase 101: `node scripts/review-errors.mjs` prints error summary
- [ ] Phase 102: `trackPageview()` called on article pages
- [ ] Phase 102: `trackPanelOpen()` called when drawer opens
- [ ] Phase 102: `POST /api/analytics` writes to `logs/analytics.jsonl` with no PII
- [ ] Phase 102: `node scripts/analytics-report.mjs` prints correct counts
- [ ] `logs/` added to `.gitignore`
