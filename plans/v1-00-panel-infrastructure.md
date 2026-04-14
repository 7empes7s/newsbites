# V1 Block 0 — Panel Infrastructure Foundation
**Phases 1–2 | Depends on: Nothing | Needed by: All other V1 blocks**

> **Read `CONTEXT.md` first.** It has the file structure, types, and styling rules you need.

---

## What You're Building

A **universal panel system** that sits alongside every article. On desktop, it's a 320px right column. On mobile, it's a bottom drawer. Right now, you're building the **empty shell** — the panels themselves come in later blocks.

Think of it like building a picture frame before you have the painting.

### What It Looks Like
- **Desktop (lg and up):** Article on the left, 320px panel column on the right
- **Mobile:** Article full-width, a 48px tab strip anchored to the bottom of the screen. Tap/swipe up to expand to 75% of the screen height.

---

## Phase 1 — ArticleIntelPanel Shell

### What to build

**File: `components/article-panel/ArticleIntelPanel.tsx`**

This is a **server component** (no `"use client"`). It receives panel sections as props and renders them in a container.

```typescript
// components/article-panel/ArticleIntelPanel.tsx
import type { PanelConfig } from '@/lib/panels/types';

type Props = {
  sections: PanelConfig[];
  children: React.ReactNode;
};

export function ArticleIntelPanel({ sections, children }: Props) {
  if (sections.length === 0) return <>{children}</>;

  return (
    <div className="article-intel-layout">
      <div className="article-intel-main">{children}</div>
      <aside className="article-intel-panel">
        {/* Panel sections will be rendered here by later phases */}
        <div className="panel-empty-state">
          <p>Intelligence panel</p>
        </div>
      </aside>
    </div>
  );
}
```

**File: `components/article-panel/PanelDrawer.tsx`**

This is a **client component** (`"use client"`). Mobile-only bottom drawer.

```typescript
// components/article-panel/PanelDrawer.tsx
'use client';
import { useState } from 'react';

type Props = {
  sectionCount: number;
  children: React.ReactNode;
};

export function PanelDrawer({ sectionCount, children }: Props) {
  const [open, setOpen] = useState(false);

  if (sectionCount === 0) return null;

  return (
    <div className="panel-drawer-wrapper">
      {/* Collapsed tab strip — always visible on mobile */}
      <button
        className="panel-drawer-tab"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Collapse panel' : 'Expand panel'}
      >
        <span className="panel-drawer-badge">{sectionCount}</span>
        <span>Intelligence</span>
        <span className={`panel-drawer-arrow ${open ? 'open' : ''}`}>▲</span>
      </button>

      {/* Expanded content */}
      <div className={`panel-drawer-content ${open ? 'panel-drawer-open' : ''}`}>
        {children}
      </div>
    </div>
  );
}
```

**File: `app/globals.css` — Add these styles at the end:**

```css
/* === Panel System === */
.article-intel-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 72rem;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .article-intel-layout {
    grid-template-columns: 1fr 320px;
  }
}

.article-intel-panel {
  display: none;
}

@media (min-width: 1024px) {
  .article-intel-panel {
    display: block;
    position: sticky;
    top: 5rem;
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
  }
}

.panel-drawer-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--color-surface, #fff);
  border-top: 1px solid var(--color-border, #e5e7eb);
  transition: transform 0.3s ease;
}

@media (min-width: 1024px) {
  .panel-drawer-wrapper {
    display: none;
  }
}

.panel-drawer-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  background: none;
  border: none;
  color: inherit;
}

.panel-drawer-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background: #F5A623;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}

.panel-drawer-arrow {
  margin-left: auto;
  transition: transform 0.3s ease;
}

.panel-drawer-arrow.open {
  transform: rotate(180deg);
}

.panel-drawer-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.panel-drawer-open {
  max-height: 75vh;
  overflow-y: auto;
}

.panel-empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.875rem;
}
```

**File: `app/articles/[slug]/page.tsx` — Modify the layout:**

Change the existing `<main>` wrapper to use the new panel layout. The key change:
1. Import `ArticleIntelPanel` and `PanelDrawer`
2. Wrap the article content in `ArticleIntelPanel`
3. Add `PanelDrawer` for mobile

The article page currently has an `<article>` with `article-content` and `article-sidebar` divs. Wrap the whole `<article>` inside `<ArticleIntelPanel>`.

### How to test
1. Run `npm run dev`
2. Open any article page in the browser
3. Desktop (wide window): you should see the article on the left and a "Intelligence panel" placeholder on the right
4. Mobile (narrow window or phone): you should see a small tab strip at the bottom with a badge. Tap it — it expands upward
5. Articles with no panel sections should render exactly as before (no visual change)

---

## Phase 2 — Panel Registry + Type System

### What to build

**File: `lib/panels/types.ts`**

```typescript
// lib/panels/types.ts
import type { Article } from '@/lib/articles';

export type PanelSectionProps = {
  article: Article;
  data: unknown;
};

export type PanelConfig = {
  id: string;                                          // unique section id
  title: string;                                       // tab label, e.g. "Standings"
  icon: string;                                        // lucide icon name, e.g. "trophy"
  Component: React.ComponentType<PanelSectionProps>;   // the React component to render
  fetchData: (article: Article) => Promise<unknown>;   // data fetcher
  revalidate: number;                                  // ISR seconds
  priority: number;                                    // lower = shown first
};
```

**File: `lib/panels/registry.ts`**

```typescript
// lib/panels/registry.ts
import type { Article } from '@/lib/articles';
import type { PanelConfig } from '@/lib/panels/types';

// Each vertical block will add its panels to these arrays in later phases.
// For now, they're all empty.
const sportsPanels: PanelConfig[] = [];
const financePanels: PanelConfig[] = [];
const worldPanels: PanelConfig[] = [];
const techPanels: PanelConfig[] = [];
const sciencePanels: PanelConfig[] = [];
const wellnessPanels: PanelConfig[] = [];
const climatePanels: PanelConfig[] = [];
const culturePanels: PanelConfig[] = [];

export function getPanelSections(article: Article): PanelConfig[] {
  const configs: PanelConfig[] = [];
  const { vertical, tags } = article;

  if (vertical === 'sports' || tags?.includes('football')) configs.push(...sportsPanels);
  if (['finance', 'economy', 'crypto'].includes(vertical))  configs.push(...financePanels);
  if (['global-politics', 'world'].includes(vertical))       configs.push(...worldPanels);
  if (['ai', 'trends', 'cybersecurity'].includes(vertical))  configs.push(...techPanels);
  if (['space', 'science'].includes(vertical))                configs.push(...sciencePanels);
  if (['healthcare', 'tcm', 'skincare'].includes(vertical))  configs.push(...wellnessPanels);
  if (['climate', 'energy'].includes(vertical))               configs.push(...climatePanels);
  if (['anime', 'gaming', 'culture'].includes(vertical))     configs.push(...culturePanels);

  return configs.sort((a, b) => a.priority - b.priority);
}
```

**File: `lib/articles.ts` — Add `panel_hints` to the Article type:**

Add this to the `Frontmatter` type (all fields optional so existing articles don't break):

```typescript
panel_hints?: {
  competition?: string;
  teams?: string[];
  tickers?: string[];
  country_codes?: string[];
  github_repos?: string[];
  nasa_mission?: string;
};
```

**File: `components/article-panel/PanelTabBar.tsx`**

```typescript
// components/article-panel/PanelTabBar.tsx
'use client';

type Props = {
  tabs: { id: string; title: string; icon: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
};

export function PanelTabBar({ tabs, activeTab, onTabChange }: Props) {
  if (tabs.length <= 1) return null;

  return (
    <div className="panel-tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`panel-tab ${activeTab === tab.id ? 'panel-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
}
```

**File: `components/article-panel/PanelSkeleton.tsx`**

```typescript
// components/article-panel/PanelSkeleton.tsx
export function PanelSkeleton() {
  return (
    <div className="panel-skeleton">
      <div className="skeleton-line skeleton-line-short" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-line-medium" />
    </div>
  );
}
```

Add skeleton styles to `app/globals.css`:

```css
.panel-tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  overflow-x: auto;
}

.panel-tab {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-muted, #6b7280);
  border-bottom: 2px solid transparent;
}

.panel-tab-active {
  color: #F5A623;
  border-bottom-color: #F5A623;
}

.panel-skeleton {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-line {
  height: 0.75rem;
  background: var(--color-border, #e5e7eb);
  border-radius: 0.25rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line-short { width: 40%; }
.skeleton-line-medium { width: 70%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

### How to test
1. Run `npm run dev`
2. Open any article page — it should render exactly as before (no regressions)
3. `getPanelSections()` returns an empty array for all articles (no panels registered yet)
4. Check that TypeScript compiles: `npx tsc --noEmit`

---

## Done Checklist

- [ ] Phase 1: `ArticleIntelPanel.tsx` renders desktop sidebar
- [ ] Phase 1: `PanelDrawer.tsx` renders mobile bottom drawer
- [ ] Phase 1: Article page layout uses 2-column grid on desktop
- [ ] Phase 1: No visual regression on mobile (article looks the same)
- [ ] Phase 2: `lib/panels/types.ts` exports `PanelConfig` and `PanelSectionProps`
- [ ] Phase 2: `lib/panels/registry.ts` exports `getPanelSections()`
- [ ] Phase 2: `panel_hints` field added to Article type (optional)
- [ ] Phase 2: `PanelTabBar.tsx` and `PanelSkeleton.tsx` exist
- [ ] Phase 2: `npx tsc --noEmit` passes
