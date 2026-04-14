# V2 Block H — Editorial Quality Signals
**Phases 91–95 | Depends on: Nothing (91–94); Phase 95 depends on 91–94 and V1 Phase 37**

> **Read `CONTEXT.md` first.** TIB's editorial pipeline is AI-driven. Readers need visible signals that the content is verified, sourced, and fresh. These signals build trust and pass the "domain expert credibility bar" — see `feedback_expert_credibility_bar.md` in Claude memory.

---

## Why This Block Exists

An AI-written publication faces a trust problem: readers (and editors) can't see the work that went into a story. These five phases make the editorial pipeline's work visible:
- **Where did this story come from?** → Source cards (Phase 91)
- **Is this still current?** → Freshness indicators (Phase 92)
- **Has this been fact-checked?** → Verification badge (Phase 93)
- **Is this written for me?** → Reading level pill (Phase 94)
- **Do articles arrive with all this automatically?** → Pipeline sync (Phase 95)

---

## Phase 91 — Source Attribution Cards

**Goal:** Every article shows its sources in a structured, clickable card at the bottom of the article.

**Why it matters:** Transparent sourcing separates credible journalism from content farms. Domain experts check sources — making them visible and structured proves TIB does real journalism.

### Frontmatter extension

Add optional `sources` field to Article frontmatter:

```yaml
sources:
  - name: "UEFA"
    url: "https://www.uefa.com/uefachampionsleague/..."
    type: "primary"
  - name: "Reuters"
    url: "https://reuters.com/sports/..."
    type: "wire"
  - name: "The Athletic"
    url: "https://theathletic.com/..."
    type: "analysis"
```

Valid `type` values: `primary` | `wire` | `analysis` | `data` | `background`

### lib/articles.ts changes

Add to `Frontmatter` type:

```typescript
sources?: Array<{
  name: string;
  url: string;
  type: 'primary' | 'wire' | 'analysis' | 'data' | 'background';
}>;
```

### File: `components/SourceCard.tsx`

```typescript
import type { Article } from '@/lib/articles';

const TYPE_LABELS: Record<string, string> = {
  primary:    'Primary Source',
  wire:       'Wire Report',
  analysis:   'Analysis',
  data:       'Data Source',
  background: 'Background',
};

export function SourceCard({ sources }: { sources: Article['sources'] }) {
  if (!sources?.length) return null;

  // Group by type
  const grouped = sources.reduce<Record<string, typeof sources>>((acc, s) => {
    (acc[s.type] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="source-card">
      <p className="source-card-count">This article cites {sources.length} source{sources.length > 1 ? 's' : ''}</p>
      {Object.entries(grouped).map(([type, list]) => (
        <div key={type} className="source-group">
          <p className="source-group-label">{TYPE_LABELS[type] ?? type}</p>
          {list.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=16`}
                alt=""
                className="source-favicon"
                width={16}
                height={16}
              />
              <span>{source.name}</span>
              <span className="source-arrow">↗</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
```

Position: below article content (`.prose`), above related articles / reader app link.

### CSS to add to `globals.css`

```css
.source-card { border: 1px solid var(--line); border-radius: 20px; padding: 16px; margin-top: 24px; background: rgba(255,247,234,0.96); }
.source-card-count { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-soft); margin-bottom: 12px; }
.source-group { margin-bottom: 12px; }
.source-group-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-soft); margin-bottom: 6px; }
.source-link { display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 0.88rem; color: var(--navy); padding: 4px 0; }
.source-link:hover { text-decoration: underline; }
.source-favicon { border-radius: 2px; opacity: 0.8; }
.source-arrow { margin-left: auto; color: var(--ink-soft); font-size: 0.75rem; }
```

### How to test
1. Add `sources:` to any article frontmatter with 2–3 entries
2. Open the article — source card appears below prose, above Reader App link
3. Click a source — opens in new tab
4. Article with no `sources` field → no source card (graceful default)

**Files:** `lib/articles.ts`, `components/SourceCard.tsx`, `app/articles/[slug]/page.tsx`, `app/globals.css`

---

## Phase 92 — Content Freshness Indicators

**Goal:** Articles show visible freshness signals: "2 hours ago", "NEW", or "⚡ BREAKING".

**Why it matters:** Readers need to know if they're reading something from today or last week. Freshness signals prevent acting on stale information.

### File: `lib/freshness.ts`

```typescript
import type { Article } from '@/lib/articles';

export type FreshnessLevel = 'breaking' | 'fresh' | 'recent' | 'standard';

export interface FreshnessInfo {
  level: FreshnessLevel;
  label: string;   // "2 hours ago" | "Yesterday" | "Apr 10"
  badge?: string;  // "⚡ BREAKING" | "NEW" | undefined
}

export function getFreshness(article: Article, now = new Date()): FreshnessInfo {
  const published = new Date(article.date);
  const breakingUntil = article.breakingUntil ? new Date(article.breakingUntil) : null;
  const ageMs = now.getTime() - published.getTime();
  const ageHours = ageMs / 3_600_000;

  if (breakingUntil && now < breakingUntil) {
    return { level: 'breaking', label: getRelativeLabel(ageMs), badge: '⚡ BREAKING' };
  }
  if (ageHours < 2) {
    return { level: 'breaking', label: 'Just now', badge: '⚡ BREAKING' };
  }
  if (ageHours < 24) {
    return { level: 'fresh', label: getRelativeLabel(ageMs), badge: 'NEW' };
  }
  if (ageHours < 24 * 7) {
    return { level: 'recent', label: getRelativeLabel(ageMs) };
  }
  return { level: 'standard', label: article.dateLabel };
}

function getRelativeLabel(ageMs: number): string {
  const hours = Math.floor(ageMs / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(ageMs / 86_400_000);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
```

### lib/articles.ts changes

Add `breakingUntil?: string` to `Frontmatter` type.

### components/article-card.tsx changes

Replace the static date display with `getFreshness(article).label`. When `badge` is set, render:

```tsx
<span className={`freshness-badge freshness-badge--${freshness.level}`}>
  {freshness.badge}
</span>
```

### CSS

```css
.freshness-badge { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 6px; }
.freshness-badge--breaking { background: #F5A623; color: #fff; animation: pulse-badge 1.5s ease-in-out infinite; }
.freshness-badge--fresh { background: var(--navy); color: #fff; }
@keyframes pulse-badge { 0%,100% { opacity: 1; } 50% { opacity: 0.65; } }
```

### How to test
1. Publish an article with today's date — shows "NEW" badge on article card
2. Add `breakingUntil: "2026-04-14T12:00:00Z"` to frontmatter — shows "⚡ BREAKING" with pulse animation
3. An article from last week → shows absolute date, no badge

**Files:** `lib/freshness.ts`, `lib/articles.ts`, `components/article-card.tsx`, `app/globals.css`

---

## Phase 93 — Verification Confidence Badge

**Goal:** Each article shows a badge indicating how thoroughly the claims have been checked.

**Why it matters:** AI-written content needs transparent quality signals. This tells the reader "claims were verified by the pipeline" vs "this is a developing story."

### Frontmatter extension

Add optional `verification` field:

```yaml
verification: "verified"   # verified | developing | opinion | analysis
```

### File: `components/VerificationBadge.tsx`

```typescript
const BADGE_CONFIG = {
  verified:   { icon: '✓', label: 'Verified',   className: 'badge-verified',   title: 'All claims fact-checked by editorial pipeline' },
  developing: { icon: '●', label: 'Developing', className: 'badge-developing', title: 'Story is evolving — details may change' },
  opinion:    { icon: '◆', label: 'Opinion',    className: 'badge-opinion',    title: 'Editorial perspective, not factual claims' },
  analysis:   { icon: '▲', label: 'Analysis',   className: 'badge-analysis',   title: 'Data-driven interpretation' },
} as const;

type VerificationType = keyof typeof BADGE_CONFIG;

export function VerificationBadge({ verification }: { verification?: string }) {
  if (!verification) return null;
  const config = BADGE_CONFIG[verification as VerificationType];
  if (!config) return null;

  return (
    <span className={`verification-badge ${config.className}`} title={config.title}>
      {config.icon} {config.label}
    </span>
  );
}
```

Display in:
- Article header — next to date/reading time meta
- Article card — below the lead text (small, secondary)

### CSS

```css
.verification-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em; padding: 2px 7px; border-radius: 8px; }
.badge-verified   { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
.badge-developing { background: #fff8e1; color: #f57f17; border: 1px solid #ffe0b2; }
.badge-opinion    { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
.badge-analysis   { background: #f3e5f5; color: #6a1b9a; border: 1px solid #e1bee7; }
```

### Editorial pipeline integration

`scripts/validate-story-package.mjs` should set `verification: "verified"` when `verify.md` exists in the dossier, `"developing"` when it doesn't. This is a Phase 95 task — Phase 93 only builds the component.

### How to test
1. Add `verification: "verified"` to article frontmatter → green badge in article header
2. `verification: "developing"` → amber badge
3. No `verification` field → no badge (no regressions)

**Files:** `components/VerificationBadge.tsx`, `lib/articles.ts`, `app/articles/[slug]/page.tsx`, `components/article-card.tsx`, `app/globals.css`

---

## Phase 94 — Reading Level Indicator

**Goal:** Each article shows an estimated reading level ("General Audience" / "Informed" / "Specialist").

**Why it matters:** TIB serves two audiences. Making the reading level visible helps readers self-select and signals to domain experts that TIB doesn't dumb things down.

### File: `lib/reading-level.ts`

```typescript
export type ReadingLevel = 'general' | 'informed' | 'specialist';

export interface ReadingLevelInfo {
  level: ReadingLevel;
  label: string;
  description: string;
  icon: string;
}

export function getReadingLevel(content: string): ReadingLevelInfo {
  const words = content.split(/\s+/).filter(Boolean);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const jargonWords = words.filter(w => w.length > 10).length;
  const jargonDensity = jargonWords / Math.max(words.length, 1);

  if (avgSentenceLength > 25 || jargonDensity > 0.12) {
    return { level: 'specialist',  label: 'Specialist',       description: 'Technical depth — ideal for practitioners', icon: '🔬' };
  }
  if (avgSentenceLength > 18 || jargonDensity > 0.05) {
    return { level: 'informed',    label: 'Informed Reader',  description: 'Requires prior knowledge of the topic',      icon: '📊' };
  }
  return   { level: 'general',    label: 'General Audience', description: 'Accessible to any reader',                   icon: '👤' };
}
```

Display as a small pill in article header meta (after reading time):

```tsx
// In app/articles/[slug]/page.tsx
import { getReadingLevel } from '@/lib/reading-level';
const rl = getReadingLevel(article.content ?? '');
// <span className="reading-level-pill">{rl.icon} {rl.label}</span>
```

### CSS

```css
.reading-level-pill { font-size: 0.72rem; color: var(--ink-soft); padding: 1px 6px; border: 1px solid var(--line); border-radius: 8px; }
```

### How to test
1. Simple anime recap article → "👤 General Audience"
2. Dense AI systems paper analysis → "🔬 Specialist"
3. Policy analysis article → "📊 Informed Reader"

**Files:** `lib/reading-level.ts`, `app/articles/[slug]/page.tsx`

---

## Phase 95 — Editorial Pipeline → Frontmatter Sync

**Goal:** The Paperclip editorial pipeline automatically populates `panel_hints`, `sources`, `verification`, and `series` frontmatter when publishing articles.

**Why it matters:** All the new frontmatter fields from Phases 91–94 are useless if articles arrive without them. This phase closes the loop between editorial and presentation.

**Depends on:** Phases 91–94 (frontmatter fields must exist), V1 Phase 37 (Writer agent `panel_hints` output — scheduled for a later week).

### scripts/publish-dossier.mjs changes

1. **Sources injection** — read `sources.json` from the dossier → inject as `sources:` frontmatter array
2. **Verification injection** — check for `verify.md` in dossier:
   - Present → `verification: "verified"`
   - Absent → `verification: "developing"`
3. **panel_hints injection** — scan `draft.md` for a `PANEL_HINTS:` YAML block → inject as `panel_hints:` frontmatter
4. **Series detection** — if article title matches a known series pattern → set `series` and `seriesOrder`

### Writer agent prompt changes

Update `prompts/publisher-desk.md` (and `prompts/writer.md` when it exists) to output a `SOURCES:` block alongside `PANEL_HINTS:`:

```
SOURCES:
- name: "Reuters"
  url: "https://reuters.com/..."
  type: "wire"
- name: "Official statement"
  url: "https://..."
  type: "primary"
```

### sources.json format

Standardize the dossier `sources.json` format so `publish-dossier.mjs` can parse it:

```json
[
  { "name": "Reuters", "url": "https://...", "type": "wire" },
  { "name": "IAEA", "url": "https://...", "type": "primary" }
]
```

### How to test
1. Run `npm run publish:dossier` on a dossier with `verify.md` and `sources.json` → article frontmatter includes `sources:`, `verification: "verified"`
2. Run on a dossier without `verify.md` → `verification: "developing"`
3. Run on a dossier with a `PANEL_HINTS:` block in `draft.md` → `panel_hints:` appears in frontmatter

**Files:** `scripts/publish-dossier.mjs`, `prompts/publisher-desk.md`

---

## Done Checklist

- [ ] Phase 91: `SourceCard.tsx` renders at bottom of article
- [ ] Phase 91: Sources grouped by type (primary, wire, analysis, etc.)
- [ ] Phase 91: Articles without `sources` field show nothing (no regression)
- [ ] Phase 92: `lib/freshness.ts` `getFreshness()` returns correct level for all age ranges
- [ ] Phase 92: "NEW" badge shows on article cards for same-day articles
- [ ] Phase 92: "⚡ BREAKING" badge pulses for articles with `breakingUntil` set
- [ ] Phase 93: `VerificationBadge.tsx` renders green for `verified`, amber for `developing`
- [ ] Phase 93: Badge visible in article header and on article cards
- [ ] Phase 93: No badge for articles without `verification` field
- [ ] Phase 94: `lib/reading-level.ts` classifies a dense AI article as "Specialist"
- [ ] Phase 94: Reading level pill shows in article header
- [ ] Phase 95: `publish-dossier.mjs` injects `sources` from `sources.json`
- [ ] Phase 95: `publish-dossier.mjs` sets `verification: "verified"` when `verify.md` present
- [ ] Phase 95: `publish-dossier.mjs` injects `panel_hints` from `PANEL_HINTS:` block in `draft.md`
