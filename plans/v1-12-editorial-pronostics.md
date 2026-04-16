# V1 Block 12 — Editorial Pipeline + Pronostics V2
**Phases 37–40 | Depends on: Blocks 1–2 (sports), Block 0 (panel infra)**

> **Read `CONTEXT.md` first.** The editorial pipeline lives in `/opt/mimoun/openclaw-config/workspace/newsbites_editorial/`.

---

## What You're Building

- **Phases 37–38:** Close the loop between the AI editorial pipeline and the panel system. Articles auto-arrive with `panel_hints` in frontmatter, and panel data is pre-warmed at publish time.
- **Phases 39–40:** Upgrade pronostics with injury signals, and add NBA + Formula 1 panels.

---

## Phase 37 — Writer Agent `panel_hints` Output

### What to change

**Context:** The editorial pipeline has a `Writer` agent that drafts articles. Its prompt lives in `/opt/mimoun/openclaw-config/workspace/newsbites_editorial/prompts/small-model/` (exact filename — check the directory, don't assume).

Add instructions to the Writer prompt to output a `PANEL_HINTS:` block after the article draft:

```
After completing the article draft, output a PANEL_HINTS block:

PANEL_HINTS:
competition: <football-data.org competition code if this is a sports/football article, else omit>
teams: <comma-separated official team names if sports, else omit>
tickers: <comma-separated stock ticker symbols (e.g. AAPL, NVDA) if finance article, else omit>
country_codes: <comma-separated ISO-3166-1 alpha-2 codes for countries mentioned, else omit>
github_repos: <owner/repo format if a specific GitHub repo is discussed, else omit>
nasa_mission: <exact mission name if a NASA/space mission is the article's subject, else omit>
```

**File: `scripts/publish-dossier.mjs`** — Add parsing logic:

After reading the draft, look for a `PANEL_HINTS:` block and parse it into YAML for the frontmatter:

```javascript
function parsePanelHints(draftContent) {
  const match = draftContent.match(/PANEL_HINTS:([\s\S]+?)(?:\n\n|$)/);
  if (!match) return null;

  const hints = {};
  const lines = match[1].trim().split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (!value || value === 'omit') continue;

    if (key.trim() === 'teams') hints.teams = value.split(',').map(s => s.trim());
    else if (key.trim() === 'tickers') hints.tickers = value.split(',').map(s => s.trim());
    else if (key.trim() === 'country_codes') hints.country_codes = value.split(',').map(s => s.trim());
    else hints[key.trim()] = value;
  }
  return Object.keys(hints).length > 0 ? hints : null;
}
```

Inject `panel_hints` into the article frontmatter when publishing.

### How to test
- Ask the Writer agent to draft a sports article
- Verify the output contains a `PANEL_HINTS:` block with a competition code and team names
- Run `npm run publish:dossier` — check that the published article's frontmatter has `panel_hints`

---

## Phase 38 — Panel Cache Warming at Publish Time

### What to build

**File: `scripts/warm-panel-cache.mjs`**

```javascript
import { getPanelSections } from '../lib/panels/registry.js';
import { getArticleBySlug } from '../lib/articles.js';
import fs from 'fs';
import path from 'path';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node warm-panel-cache.mjs <slug>'); process.exit(1); }

const article = getArticleBySlug(slug);
if (!article) { console.error(`Article not found: ${slug}`); process.exit(1); }

const sections = getPanelSections(article);
const cacheDir = path.join(process.cwd(), 'content/panels/cache');
fs.mkdirSync(cacheDir, { recursive: true });

console.log(`Warming ${sections.length} panel sections for: ${slug}`);

for (const section of sections) {
  try {
    const data = await section.fetchData(article);
    const cachePath = path.join(cacheDir, `${slug}-${section.id}.json`);
    fs.writeFileSync(cachePath, JSON.stringify({ data, ts: Date.now() }));
    console.log(`  ✓ ${section.id}`);
  } catch (err) {
    console.log(`  ✗ ${section.id}: ${err.message}`);
  }
}
```

Call this script from `scripts/publish-dossier.mjs` after publishing:
```javascript
// At the end of publish-dossier.mjs:
execSync(`node scripts/warm-panel-cache.mjs ${slug}`, { stdio: 'inherit' });
```

Update panel fetchers to check the cache file first before making an API call. Use the `cachedFetch` from V2 Block C if it's been built, or a simple inline check:

```javascript
const cachePath = `content/panels/cache/${slug}-${sectionId}.json`;
if (fs.existsSync(cachePath)) {
  const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const age = (Date.now() - cached.ts) / 1000;
  if (age < revalidate) return cached.data;
}
```

---

## Phase 39 — Pronostics V2: Injury Signals

### What to add to `lib/panels/pronostics.ts`

```typescript
type InjuryReport = {
  playerName: string;
  reason: 'injured' | 'suspended';
  isKeyPlayer: boolean;
};

type PronosticInput = {
  homeForm: FormResult[];
  awayForm: FormResult[];
  h2hHomeWins: number;
  h2hDraws: number;
  h2hAwayWins: number;
  isNeutralVenue?: boolean;
  homeInjuries?: InjuryReport[];
  awayInjuries?: InjuryReport[];
};

// Extend calculatePronostic to accept PronosticInput
// If a key player is injured/suspended, reduce that team's score by 0.2 per key player
export function calculatePronosticV2(input: PronosticInput): PronosticResult & {
  warnings: string[];
} {
  let { homeScore, awayScore } = /* existing calculation */ ...;

  const warnings: string[] = [];

  for (const injury of input.homeInjuries ?? []) {
    if (injury.isKeyPlayer) {
      homeScore -= 0.2;
      warnings.push(`${injury.playerName} (${injury.reason}) unavailable for home team`);
    }
  }
  for (const injury of input.awayInjuries ?? []) {
    if (injury.isKeyPlayer) {
      awayScore -= 0.2;
      warnings.push(`${injury.playerName} (${injury.reason}) unavailable for away team`);
    }
  }

  // ... rest of calculation
  return { ...result, warnings };
}
```

Update `PronosticWidget.tsx` to show injury disclaimers below the bars:
```typescript
{warnings.length > 0 && (
  <ul className="pronostic-warnings">
    {warnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
  </ul>
)}
```

---

## Phase 40 — NBA + F1 Pronostics

### NBA (balldontlie.io)

```typescript
// lib/panels/fetchers/sports.ts — Add:
export async function fetchNBAStandings() {
  const res = await fetch('https://api.balldontlie.io/v1/standings?season=2025', {
    headers: { Authorization: process.env.BALLDONTLIE_API_KEY || '' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}
```

**File: `components/panels/sports/NBAStandingsCard.tsx`** — Compact NBA standings card (East + West conference). Register for `tags: ["nba", "basketball"]`.

### Formula 1 (OpenF1 — free, no key)

```typescript
// lib/panels/fetchers/sports.ts — Add:
export async function fetchF1Standings() {
  const res = await fetch('https://api.openf1.org/v1/drivers?session_key=latest', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}
```

**File: `components/panels/sports/F1RaceCard.tsx`** — Shows driver championship standings (top 5) and next race schedule. Register for `tags: ["formula-1", "f1"]`.

---

## Done Checklist

- [ ] Phase 37: Writer agent prompt includes `PANEL_HINTS:` output instructions
- [ ] Phase 37: `publish-dossier.mjs` parses `PANEL_HINTS:` and injects into frontmatter
- [ ] Phase 38: `warm-panel-cache.mjs` script fetches and stores all panel data on publish
- [x] Phase 38: Panel fetchers check cache before making API calls
- [ ] Phase 39: `calculatePronosticV2` adjusts scores for injured/suspended key players
- [ ] Phase 39: `PronosticWidget` shows injury warnings below probability bars
- [ ] Phase 40: `NBAStandingsCard.tsx` shows East/West standings
- [ ] Phase 40: `F1RaceCard.tsx` shows driver standings and next race
