# V2 Block D — Entity Knowledge Graph
**Phases 72–76 | Depends on: Nothing (but Phase 74 is more useful after Phase 66 related articles)**

> **Read `CONTEXT.md` first.** This is the most ambitious block in V2. Every article gets linked entities. Entities get their own pages aggregating all coverage. This is the Bloomberg Terminal concept applied to news.

---

## What Is the Entity Graph?

Every article mentions real-world things: companies (NVIDIA), people (Sam Altman), countries (Iran), technologies (GPT-5). These are **entities**. Right now they're just words in text — they don't connect to anything.

After this block: entities are structured objects. An article about NVIDIA links to the NVIDIA entity page. The entity page shows every TIB article mentioning NVIDIA, plus live stock data (from the finance panel), plus related entities (AMD, OpenAI, Jensen Huang). Readers can explore the knowledge web.

---

## Phase 72 — Entity Extraction System

### What to build

**File: `lib/panels/types.ts`** — Add entity types (or create a new `lib/entities.ts`):

```typescript
// lib/entities.ts
export type EntityType = 'company' | 'person' | 'country' | 'technology' | 'organization' | 'event';

export type Entity = {
  slug: string;          // url-safe: "nvidia-corporation"
  name: string;          // canonical: "NVIDIA Corporation"
  type: EntityType;
  aliases: string[];     // ["NVIDIA", "Nvidia", "NVDA"] — used for matching
  metadata?: {
    ticker?: string;     // stock ticker if company
    countryCode?: string; // ISO-3166-1 alpha-2 if country
  };
};
```

**Seed the entity registry.** Create these files (start with the entities relevant to your current articles):

**File: `content/entities/companies.json`**
```json
[
  { "slug": "nvidia-corporation", "name": "NVIDIA Corporation", "type": "company", "aliases": ["NVIDIA", "Nvidia", "NVDA"], "metadata": { "ticker": "NVDA" } },
  { "slug": "openai", "name": "OpenAI", "type": "company", "aliases": ["OpenAI", "Open AI"] },
  { "slug": "amd", "name": "Advanced Micro Devices", "type": "company", "aliases": ["AMD", "Advanced Micro Devices"], "metadata": { "ticker": "AMD" } },
  { "slug": "apple", "name": "Apple Inc.", "type": "company", "aliases": ["Apple", "AAPL"], "metadata": { "ticker": "AAPL" } },
  { "slug": "arsenal-fc", "name": "Arsenal FC", "type": "organization", "aliases": ["Arsenal", "The Gunners"] },
  { "slug": "psg", "name": "Paris Saint-Germain", "type": "organization", "aliases": ["PSG", "Paris Saint-Germain", "Paris SG"] }
]
```

**File: `content/entities/people.json`**
```json
[
  { "slug": "sam-altman", "name": "Sam Altman", "type": "person", "aliases": ["Sam Altman"] },
  { "slug": "jensen-huang", "name": "Jensen Huang", "type": "person", "aliases": ["Jensen Huang", "Jensen"] }
]
```

**File: `content/entities/countries.json`**
```json
[
  { "slug": "iran", "name": "Iran", "type": "country", "aliases": ["Iran", "Islamic Republic of Iran"], "metadata": { "countryCode": "IR" } },
  { "slug": "united-states", "name": "United States", "type": "country", "aliases": ["United States", "USA", "US", "America"], "metadata": { "countryCode": "US" } },
  { "slug": "china", "name": "China", "type": "country", "aliases": ["China", "PRC", "People's Republic of China"], "metadata": { "countryCode": "CN" } }
]
```

**File: `content/entities/technologies.json`**
```json
[
  { "slug": "gpt-5", "name": "GPT-5", "type": "technology", "aliases": ["GPT-5", "GPT5", "gpt-5"] },
  { "slug": "react", "name": "React", "type": "technology", "aliases": ["React", "React.js", "ReactJS"] }
]
```

**File: `lib/entities.ts`** — Entity loader and matcher:

```typescript
import companiesData from '@/content/entities/companies.json';
import peopleData from '@/content/entities/people.json';
import countriesData from '@/content/entities/countries.json';
import techData from '@/content/entities/technologies.json';
import type { Entity } from '@/lib/entities-types';

const ALL_ENTITIES: Entity[] = [
  ...companiesData,
  ...peopleData,
  ...countriesData,
  ...techData,
] as Entity[];

export function getAllEntities(): Entity[] {
  return ALL_ENTITIES;
}

export function getEntityBySlug(slug: string): Entity | null {
  return ALL_ENTITIES.find(e => e.slug === slug) ?? null;
}

// Extract entities mentioned in an article (title + lead + content)
export function extractEntities(
  text: string,
  panelHints?: { tickers?: string[]; country_codes?: string[] }
): Entity[] {
  const lowerText = text.toLowerCase();
  const found = new Map<string, Entity>();

  for (const entity of ALL_ENTITIES) {
    for (const alias of [entity.name, ...entity.aliases]) {
      // Whole-word match — avoid matching "Iran" inside "Ukraine"
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text) && !found.has(entity.slug)) {
        found.set(entity.slug, entity);
        break;
      }
    }
  }

  return Array.from(found.values());
}
```

**File: `lib/articles.ts`** — Add `entities` as a computed property in `readArticleFile`:

```typescript
import { extractEntities } from '@/lib/entities';

// In readArticleFile(), after building the Article object:
const entities = extractEntities(
  `${frontmatter.title} ${frontmatter.lead} ${content}`,
  frontmatter.panel_hints
);

return {
  ...frontmatter,
  entities,    // add this
  // ... rest of computed fields
};
```

Also add `entities: Entity[]` to the `Article` type.

### How to test
```bash
# Quick test — add a script or use ts-node:
node -e "
const { getArticleBySlug } = require('./lib/articles');
const a = getArticleBySlug('openai-altman-trust-investigation');
console.log(a.entities.map(e => e.name));
"
# Should output: ['OpenAI', 'Sam Altman']
```

---

## Phase 73 — Entity Tags on Articles

**File: `components/EntityChip.tsx`**

```typescript
import Link from 'next/link';
import { Building2, User, Globe, Cpu, Landmark } from 'lucide-react';
import type { Entity, EntityType } from '@/lib/entities';

const ICONS: Record<EntityType, React.ComponentType<{ size: number }>> = {
  company: Building2,
  person: User,
  country: Globe,
  technology: Cpu,
  organization: Landmark,
  event: Landmark,
};

export function EntityChip({ entity }: { entity: Entity }) {
  const Icon = ICONS[entity.type];
  return (
    <Link href={`/entity/${entity.slug}`} className="entity-chip">
      <Icon size={12} />
      <span>{entity.name}</span>
    </Link>
  );
}
```

Add to `app/globals.css`:
```css
.entity-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  background: var(--color-surface, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  font-size: 0.75rem;
  color: var(--color-text, #0f172a);
  text-decoration: none;
  transition: border-color 0.15s;
}
.entity-chip:hover { border-color: #F5A623; }
```

**File: `app/articles/[slug]/page.tsx`** — Add entity chips below the tags section:

```typescript
import { EntityChip } from '@/components/EntityChip';
// ...
{article.entities.length > 0 && (
  <div className="article-entities">
    <span className="entities-label">Entities:</span>
    <div className="entities-row">
      {article.entities.map(e => <EntityChip key={e.slug} entity={e} />)}
    </div>
  </div>
)}
```

---

## Phase 74 — "The Full Picture" Entity Pages

**File: `app/entity/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import { getEntityBySlug } from '@/lib/entities';
import { getAllArticles } from '@/lib/articles';
import { ArticleCard } from '@/components/article-card';

export function generateStaticParams() {
  return getAllEntities().map(e => ({ slug: e.slug }));
}

export default async function EntityPage({ params }) {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);
  if (!entity) notFound();

  // All articles that mention this entity
  const articles = getAllArticles().filter(a =>
    a.entities?.some(e => e.slug === slug)
  ).sort((a, b) => b.date.localeCompare(a.date));

  // Related entities: other entities frequently co-mentioned
  const coMentioned = new Map<string, number>();
  for (const article of articles) {
    for (const e of article.entities ?? []) {
      if (e.slug !== slug) {
        coMentioned.set(e.slug, (coMentioned.get(e.slug) || 0) + 1);
      }
    }
  }
  const relatedEntitySlugs = [...coMentioned.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);
  const relatedEntities = relatedEntitySlugs.map(getEntityBySlug).filter(Boolean);

  return (
    <main className="page-shell">
      {/* Entity header */}
      <div className="entity-header">
        <span className="entity-type-badge">{entity.type}</span>
        <h1>{entity.name}</h1>
        {entity.metadata?.ticker && (
          <span className="entity-ticker">${entity.metadata.ticker}</span>
        )}
        <p className="entity-stat">
          Mentioned in <strong>{articles.length}</strong> article{articles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Coverage timeline */}
      {articles.length > 0 && (
        <section className="entity-coverage">
          <h2>Coverage</h2>
          <div className="entity-articles">
            {articles.map(a => <ArticleCard key={a.slug} article={a} />)}
          </div>
        </section>
      )}

      {/* Related entities */}
      {relatedEntities.length > 0 && (
        <section className="entity-related">
          <h2>Related</h2>
          <div className="entity-related-chips">
            {relatedEntities.map(e => e && <EntityChip key={e.slug} entity={e} />)}
          </div>
        </section>
      )}
    </main>
  );
}
```

### How to test
1. Open an article → click an entity chip → `/entity/nvidia-corporation` loads
2. Page shows all NVIDIA articles, the ticker, and related entities (AMD, OpenAI)
3. Visit `/entity/arsenal-fc` → shows sports articles mentioning Arsenal

---

## Phase 75 — Entity Auto-Enrichment (Wikidata)

**File: `lib/entity-enrichment.ts`**

```typescript
type EnrichedEntity = {
  description: string;
  image?: string;
  website?: string;
};

const WIKIDATA_CACHE_DIR = 'content/entities/enriched';

export async function enrichEntity(entity: Entity): Promise<EnrichedEntity | null> {
  import fs from 'fs';
  import path from 'path';

  const cachePath = path.join(process.cwd(), WIKIDATA_CACHE_DIR, `${entity.slug}.json`);
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });

  // Cache for 30 days
  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (Date.now() - cached.ts < 30 * 86400 * 1000) return cached.data;
  }

  try {
    // Search Wikidata
    const searchRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(entity.name)}&language=en&format=json&limit=1`,
      { headers: { 'User-Agent': 'NewsBites/1.0' } }
    );
    const searchData = await searchRes.json();
    const id = searchData.search?.[0]?.id;
    if (!id) return null;

    // Get entity details
    const detailRes = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`,
      { headers: { 'User-Agent': 'NewsBites/1.0' } }
    );
    const detail = await detailRes.json();
    const wdEntity = detail.entities?.[id];

    const description = wdEntity?.descriptions?.en?.value || '';
    const imageClaim = wdEntity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    const image = imageClaim
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageClaim)}`
      : undefined;
    const websiteClaim = wdEntity?.claims?.P856?.[0]?.mainsnak?.datavalue?.value;

    const data: EnrichedEntity = { description, image, website: websiteClaim };
    fs.writeFileSync(cachePath, JSON.stringify({ data, ts: Date.now() }));
    return data;
  } catch {
    return null;
  }
}
```

**File: `scripts/enrich-entities.mjs`** — Run this periodically (monthly is fine):

```javascript
import { getAllEntities } from '../lib/entities.js';
import { enrichEntity } from '../lib/entity-enrichment.js';

const entities = getAllEntities();
console.log(`Enriching ${entities.length} entities from Wikidata...`);

for (const entity of entities) {
  process.stdout.write(`  ${entity.name}... `);
  try {
    const data = await enrichEntity(entity);
    console.log(data?.description ? '✓' : '(no data)');
    await new Promise(r => setTimeout(r, 500)); // rate limit: 2 req/sec
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
}
```

Add to `package.json` scripts: `"entities:enrich": "node scripts/enrich-entities.mjs"`

Use enriched data on entity pages (Phase 74): show description below entity name.

---

## Phase 76 — Inline Entity Tooltips

**File: `components/EntityTooltip.tsx`** (client component)

```typescript
'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import type { Entity } from '@/lib/entities';

type Props = {
  entity: Entity;
  description?: string;
  children: React.ReactNode;
};

export function EntityTooltip({ entity, description, children }: Props) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  function show() {
    clearTimeout(timerRef.current);
    setOpen(true);
  }
  function hide() {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <span className="entity-tooltip-wrapper" onMouseEnter={show} onMouseLeave={hide}>
      <span className="entity-inline-link">{children}</span>
      {open && (
        <div className="entity-tooltip" role="tooltip">
          <div className="entity-tooltip-type">{entity.type}</div>
          <div className="entity-tooltip-name">{entity.name}</div>
          {description && <p className="entity-tooltip-desc">{description}</p>}
          <Link href={`/entity/${entity.slug}`} className="entity-tooltip-cta">
            Full picture →
          </Link>
        </div>
      )}
    </span>
  );
}
```

Add CSS:
```css
.entity-tooltip-wrapper { position: relative; display: inline; }
.entity-inline-link {
  border-bottom: 1px dotted #F5A623;
  cursor: help;
}
.entity-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  padding: 0.75rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 50;
  font-size: 0.8125rem;
}
.entity-tooltip-type { font-size: 0.6875rem; text-transform: uppercase; color: var(--color-text-muted); }
.entity-tooltip-name { font-weight: 700; margin: 0.25rem 0; }
.entity-tooltip-desc { color: var(--color-text-muted); margin: 0.25rem 0 0.5rem; line-height: 1.4; }
.entity-tooltip-cta { color: #F5A623; font-weight: 600; text-decoration: none; }
```

**Integration:** This requires a custom remark plugin to wrap entity mentions in article markdown. That's complex — as a simpler alternative, only wrap entities that appear in the article title and lead (not the full markdown body). Do it in the `app/articles/[slug]/page.tsx` server component by scanning `article.title` and `article.lead` for entity names and wrapping them.

---

## Done Checklist

- [ ] Phase 72: Entity JSON files created for companies, people, countries, technologies
- [ ] Phase 72: `extractEntities()` correctly finds entities in article text
- [ ] Phase 72: `Article` type has `entities: Entity[]` computed field
- [ ] Phase 73: Entity chips appear on article pages with type icons
- [ ] Phase 73: Clicking a chip navigates to `/entity/[slug]`
- [ ] Phase 74: Entity pages show all articles mentioning that entity
- [ ] Phase 74: Related entities section shows co-mentioned entities
- [ ] Phase 75: `npm run entities:enrich` populates Wikidata descriptions
- [ ] Phase 75: Entity page shows description from Wikidata
- [ ] Phase 76: Hovering entity names shows tooltip with description and "Full picture →" link
