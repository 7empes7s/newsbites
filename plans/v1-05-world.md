# V1 Block 5 — World / Politics Panels
**Phases 13–16 | Depends on: Block 0 (panel infrastructure)**

> **Read `CONTEXT.md` first.**

---

## What You're Building

When a reader opens an article about Iran or Ukraine, the panel shows a **country profile** (flag, capital, population), a **conflict timeline**, **upcoming elections**, and **trade data**. All using free APIs (REST Countries, World Bank).

---

## Phase 13 — Country Profile Card

**File: `lib/panels/fetchers/world.ts`**

```typescript
// REST Countries API — completely free, no key
export async function fetchCountryProfile(countryCode: string) {
  const res = await fetch(
    `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,flags,capital,population,region,currencies,languages`,
    { next: { revalidate: 86400 } }  // country data rarely changes
  );
  if (!res.ok) return null;
  return res.json();
}

// Map common country names to ISO-3166 codes
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'united states': 'US', 'usa': 'US', 'america': 'US',
  'china': 'CN', 'russia': 'RU', 'ukraine': 'UA',
  'iran': 'IR', 'iraq': 'IQ', 'israel': 'IL',
  'france': 'FR', 'germany': 'DE', 'uk': 'GB',
  // Add more as needed
};

export function detectCountryCodes(
  tags: string[],
  panelHints?: { country_codes?: string[] }
): string[] {
  if (panelHints?.country_codes?.length) return panelHints.country_codes;
  // Fallback: try matching tags against country name map
  return tags
    .map(t => COUNTRY_NAME_TO_CODE[t.toLowerCase()])
    .filter(Boolean) as string[];
}
```

**File: `components/panels/world/CountryProfileCard.tsx`**

Shows: flag (SVG from REST Countries), country name, capital, population (formatted), region, currency, official language. Compact 2-column grid layout.

Register for `global-politics` vertical.

### How to test
1. Open an article about a country (e.g., the Iran/US article)
2. Add `panel_hints: { country_codes: ["IR", "US"] }` to its frontmatter
3. Panel should show country profile cards for both Iran and the US

---

## Phase 14 — Conflict + Event Timeline

**File: `components/panels/world/ConflictTimeline.tsx`**

A vertical timeline of key events related to the article's topic. Initially **static JSON-driven** — curated by the editorial pipeline.

**File: `content/panels/active-conflicts.json`**

```json
[
  {
    "id": "iran-nuclear",
    "title": "Iran Nuclear Negotiations",
    "countryCodes": ["IR", "US"],
    "events": [
      { "date": "2026-04-08", "summary": "US-Iran ceasefire announced" },
      { "date": "2026-03-15", "summary": "IAEA inspection access expanded" }
    ]
  }
]
```

The component matches `countryCodes` against the article's `panel_hints.country_codes` or detected countries. Shows events as a vertical timeline with dots and connecting lines.

Future: replace static JSON with GDELT API queries for real-time event feeds.

---

## Phase 15 — Election Calendar Widget

**File: `content/panels/election-calendar.json`** — Manually curated, updated by pipeline.

```json
[
  { "country": "Germany", "countryCode": "DE", "date": "2026-09-20", "type": "Federal", "note": "Bundestag election" },
  { "country": "Brazil", "countryCode": "BR", "date": "2026-10-04", "type": "Presidential" }
]
```

**File: `components/panels/world/ElectionCalendar.tsx`**

Shows upcoming elections in countries mentioned in the article. For elections within 90 days: countdown badge. Sorted by date.

---

## Phase 16 — Trade Data Panel

**File: `lib/panels/fetchers/world.ts` — Add:**

World Bank WITS trade data for articles tagged `trade`, `tariffs`, `sanctions`.

```typescript
// World Bank API — free, no key
export async function fetchTradeData(countryCode: string) {
  const res = await fetch(
    `https://api.worldbank.org/v2/country/${countryCode}/indicator/NE.TRD.GNFS.ZS?format=json&per_page=5`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}
```

**File: `components/panels/world/TradeDataCard.tsx`**

Shows trade-to-GDP ratio, top trading partners, export/import volumes.

---

## Done Checklist

- [ ] Phase 13: `CountryProfileCard.tsx` shows flag, capital, population, currency
- [ ] Phase 13: Country detection works from tags and panel_hints
- [ ] Phase 14: `ConflictTimeline.tsx` renders events from static JSON
- [ ] Phase 14: `active-conflicts.json` exists with at least one entry
- [ ] Phase 15: `ElectionCalendar.tsx` shows upcoming elections with countdown
- [ ] Phase 15: `election-calendar.json` exists with sample data
- [ ] Phase 16: `TradeDataCard.tsx` shows trade data from World Bank API
- [ ] All world panels register for `global-politics` vertical
