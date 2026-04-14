# V1 Block 8 — Wellness + Climate Panels
**Phases 23–26 | Depends on: Block 0 (panel infrastructure)**

> **Read `CONTEXT.md` first.**

---

## What You're Building

Health articles show **FDA alerts** and **WHO bulletins**. Climate articles show the **current CO2 level** and **temperature anomaly data**. These panels ground narrative articles in hard data.

---

## Phase 23 — FDA Alert Feed

**File: `lib/panels/fetchers/wellness.ts`**

```typescript
// OpenFDA — free, optional key, 1000 req/day
export async function fetchFDAAlerts(term: string) {
  const encoded = encodeURIComponent(term);
  const res = await fetch(
    `https://api.fda.gov/drug/enforcement.json?search=reason_for_recall:"${encoded}"&limit=5`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}
```

**File: `components/panels/wellness/FDAAlertCard.tsx`**

Shows recent recalls/alerts related to article topic. Each alert: product name, reason, severity badge (Class I = red, II = amber, III = grey), date.

Register for `healthcare`, `skincare` verticals.

---

## Phase 24 — WHO Bulletin + Clinical Trial Counter

```typescript
// WHO Global Health Observatory — free, no key
export async function fetchWHONews() {
  const res = await fetch(
    'https://www.who.int/api/news/newsitems?sf_culture=en&$top=5',
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}

// ClinicalTrials.gov v2 — free, no key
export async function fetchClinicalTrialCount(condition: string) {
  const encoded = encodeURIComponent(condition);
  const res = await fetch(
    `https://clinicaltrials.gov/api/v2/studies?query.cond=${encoded}&countTotal=true&pageSize=0`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}
```

**Files to create:**
- `components/panels/wellness/WHOBulletinCard.tsx` — latest WHO headlines
- `components/panels/wellness/ClinicalTrialCounter.tsx` — "X active trials for [condition]" with link to ClinicalTrials.gov

---

## Phase 25 — CO2 Widget + Temperature Anomaly

**File: `lib/panels/fetchers/climate.ts`**

```typescript
// NOAA Mauna Loa CO2 — free CSV, no key
export async function fetchCO2Level() {
  const res = await fetch(
    'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_weekly_mlo.csv',
    { next: { revalidate: 604800 } }  // weekly
  );
  if (!res.ok) return null;
  const text = await res.text();
  // Parse last non-comment line for latest CO2 ppm
  const lines = text.split('\n').filter(l => !l.startsWith('#') && l.trim());
  const lastLine = lines[lines.length - 1];
  const parts = lastLine.split(',');
  return { ppm: parseFloat(parts[parts.length - 1]), date: parts[0] };
}

// Open-Meteo — free, no key, unlimited non-commercial
export async function fetchTempAnomaly() {
  const res = await fetch(
    'https://archive-api.open-meteo.com/v1/archive?latitude=0&longitude=0&start_date=2026-01-01&end_date=2026-04-01&daily=temperature_2m_mean',
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}
```

**Files to create:**
- `components/panels/climate/CO2Widget.tsx` — current CO2 ppm, trend vs pre-industrial (280 ppm), mini sparkline of last 12 months
- `components/panels/climate/TempAnomalyChart.tsx` — temperature anomaly vs 1951-1980 average

Register for `climate`, `energy` verticals.

---

## Phase 26 — Renewable Energy Capacity Tracker

**File: `content/panels/renewable-capacity.json`** — Static data from IRENA annual reports.

```json
{
  "year": 2025,
  "global": { "solar_gw": 1850, "wind_gw": 1100, "hydro_gw": 1400 },
  "countries": {
    "CN": { "solar_gw": 620, "wind_gw": 400 },
    "US": { "solar_gw": 220, "wind_gw": 180 }
  }
}
```

**File: `components/panels/climate/RenewableCapacityCard.tsx`**

Shows installed capacity for solar/wind/hydro. If a country is mentioned in the article, shows country-specific data. YoY growth rate highlighted.

---

## Done Checklist

- [ ] Phase 23: `FDAAlertCard.tsx` shows recalls with severity badges
- [ ] Phase 24: `WHOBulletinCard.tsx` shows latest WHO headlines
- [ ] Phase 24: `ClinicalTrialCounter.tsx` shows trial count for article's condition
- [ ] Phase 25: `CO2Widget.tsx` shows current ppm with trend
- [ ] Phase 25: `TempAnomalyChart.tsx` shows temperature data
- [ ] Phase 26: `RenewableCapacityCard.tsx` shows capacity data
- [ ] All wellness/climate panels register for correct verticals
