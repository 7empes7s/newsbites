# V1 Block 4 — Finance Panels
**Phases 9–12 | Depends on: Block 0 (panel infrastructure)**

> **Read `CONTEXT.md` first.** The app already has finance components in `components/finance/` and `lib/finance/`. This block migrates them into the panel system and adds new features.

---

## What You're Building

Move the existing `FinanceOverlay` into the panel system so finance data appears in the sidebar (desktop) or drawer (mobile) like sports data does. Then add macro indicators (Fed rate, CPI, unemployment) and crypto panels.

---

## Phase 9 — Migrate FinanceOverlay to Panel System

### What to build

1. Create `components/panels/finance/FinancePanel.tsx` — wraps the existing `MarketCard` and `TickerChart` components from `components/finance/` into panel-compatible format
2. Create `lib/panels/fetchers/finance.ts` — wraps `lib/finance/market.ts` functions to match the `PanelConfig.fetchData` signature
3. Register `financePanels` in `lib/panels/registry.ts` for verticals: `finance`, `economy`, `crypto`
4. **Keep the existing `/finance` dashboard working** — don't delete the standalone components, just create panel wrappers

**Important:** The existing `FinanceOverlay` renders inline in the article body (between lead and content). After migration, it should render in the panel sidebar instead. Remove the inline overlay from `app/articles/[slug]/page.tsx` for articles that have panel sections.

### How to test
1. Open a finance article (e.g., `finance-liquidity-watch`)
2. Desktop: ticker chart and market data appear in the right panel
3. Mobile: drawer tab shows finance data
4. `/finance` dashboard still works independently (no regression)

---

## Phase 10 — Ticker Auto-Detection + Sparkline

### What to build

**File: `components/panels/finance/TickerSparklineCard.tsx`**

A compact card for each detected ticker: symbol, current price, 7-day mini sparkline chart (SVG), percentage change, and AI signal badge if available.

```typescript
type Props = {
  symbol: string;       // "NVDA"
  name: string;         // "NVIDIA Corporation"
  price: number;        // 1,234.56
  change: number;       // -2.3 (percentage)
  sparkline: number[];  // 7 data points for mini chart
};
```

The sparkline is a simple SVG polyline — no charting library needed:

```typescript
function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 80},${40 - ((v - min) / range) * 36}`)
    .join(' ');

  return (
    <svg width="80" height="40" viewBox="0 0 80 40">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
```

Use `lib/finance/tickers.ts` `detectTickerFromArticle()` to auto-detect tickers. For articles with multiple tickers, show top 2 with a "See all →" link to `/finance/charts`.

### How to test
1. Open an AI article that mentions NVIDIA — a compact ticker sparkline should appear in the panel
2. The sparkline should show 7 days of price data
3. Percentage change should be green (positive) or red (negative)

---

## Phase 11 — Macro Indicator Row

### What to build

**File: `lib/panels/fetchers/fred.ts`**

FRED (Federal Reserve Economic Data) API fetcher. Free key, very generous limits.

```typescript
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

// Key macro indicators
const INDICATORS = {
  FEDFUNDS: 'Fed Funds Rate',
  CPIAUCSL: 'CPI (YoY)',
  UNRATE: 'Unemployment',
  VIXCLS: 'VIX',
};

export async function fetchIndicator(seriesId: string) {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: process.env.FRED_API_KEY || '',
    file_type: 'json',
    sort_order: 'desc',
    limit: '1',
  });
  const res = await fetch(`${FRED_BASE}?${params}`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.observations?.[0] || null;
}
```

**File: `components/panels/finance/MacroIndicatorRow.tsx`**

Four compact stat chips in a 2x2 grid: Fed rate, CPI, unemployment, VIX. Each shows the value and a direction arrow (▲ up / ▼ down) compared to previous period.

Register for `economy` vertical articles.

### How to test
1. Open an economy-related article
2. Macro indicators should show current values with direction arrows
3. Values should match what's on the FRED website

---

## Phase 12 — Crypto Panel

### What to build

**File: `components/panels/finance/CryptoPanel.tsx`**

Shows:
- BTC and ETH price + 24h change (from Yahoo Finance unofficial API or CoinGecko)
- Fear & Greed Index (from `https://api.alternative.me/fng/` — free, no key)
- Crypto dominance % (CoinGecko free tier: `https://api.coingecko.com/api/v3/global` — no key, 50 req/min)

Register for `crypto` vertical articles.

### How to test
1. Create or find an article with `vertical: "crypto"` or tags including `bitcoin`
2. Panel should show BTC/ETH prices, Fear & Greed gauge, and dominance percentages
3. If APIs are down, the panel should hide silently (not crash)

---

## Done Checklist

- [ ] Phase 9: `FinancePanel.tsx` renders in panel sidebar
- [ ] Phase 9: Existing `/finance` dashboard still works
- [ ] Phase 9: Inline `FinanceOverlay` removed from article body (now in panel)
- [ ] Phase 10: `TickerSparklineCard.tsx` shows symbol, price, change, sparkline
- [ ] Phase 10: Auto-detects tickers from article text
- [ ] Phase 11: `MacroIndicatorRow.tsx` shows Fed rate, CPI, unemployment, VIX
- [ ] Phase 11: FRED API key added to `.env.local`
- [ ] Phase 12: `CryptoPanel.tsx` shows BTC/ETH, Fear & Greed, dominance
- [ ] Phase 12: All finance panels register for correct verticals
