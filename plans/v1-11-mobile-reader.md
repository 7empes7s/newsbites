# V1 Block 11 — Mobile UX + Reader App Integration
**Phases 33–36 | Depends on: Block 0, at least one vertical panel (Blocks 1–10)**

> **Read `CONTEXT.md` first.** The reader app (`/app`) is in `components/news-app-shell.tsx`.

---

## What You're Building

- **Phases 33–34:** Upgrade the mobile drawer from a CSS-only slide to a smooth **gesture-based** drawer with velocity-snap. Upgrade the tab bar to handle multiple panel sections with horizontal scroll.
- **Phases 35–36:** Add panel access to the **Focus mode** (card view) and **Flow mode** (TikTok scroll) in the `/app` reader.

---

## Phase 33 — Smooth Gesture Drawer

### What to change

**File: `components/article-panel/PanelDrawer.tsx`** — Upgrade from button-toggle to pointer-event gesture.

```typescript
'use client';
import { useState, useRef, useCallback } from 'react';

type Props = {
  sectionCount: number;
  children: React.ReactNode;
};

const COLLAPSED_HEIGHT = 48;  // px — just the tab strip
const EXPANDED_VH = 0.75;     // 75% of viewport height

export function PanelDrawer({ sectionCount, children }: Props) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientY - startYRef.current;
    setDragY(delta);
  }, [dragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    const delta = e.clientY - startYRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    const velocity = Math.abs(delta) / elapsed; // px/ms

    // Velocity snap: flick up opens, flick down closes
    if (velocity > 0.3) {
      setOpen(delta < 0); // negative delta = swiping up = open
    } else {
      // Position snap: if dragged more than 30% of way, toggle
      const threshold = window.innerHeight * EXPANDED_VH * 0.3;
      if (open) setOpen(Math.abs(delta) < threshold);
      else setOpen(delta < -threshold);
    }
    setDragY(0);
  }, [dragging, open]);

  if (sectionCount === 0) return null;

  const expandedHeight = typeof window !== 'undefined'
    ? window.innerHeight * EXPANDED_VH
    : 500;

  const currentHeight = open
    ? expandedHeight - Math.max(0, dragY)
    : COLLAPSED_HEIGHT - Math.min(0, dragY);

  return (
    <>
      {/* Background overlay when open */}
      {open && (
        <div
          ref={overlayRef}
          className="panel-drawer-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="panel-drawer-wrapper"
        style={{
          height: `${Math.max(COLLAPSED_HEIGHT, Math.min(expandedHeight, currentHeight))}px`,
          transition: dragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Drag handle */}
        <div className="panel-drawer-handle" aria-hidden="true" />

        {/* Tab strip */}
        <button
          className="panel-drawer-tab"
          onClick={() => !dragging && setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? 'Collapse intelligence panel' : 'Expand intelligence panel'}
        >
          <span className="panel-drawer-badge">{sectionCount}</span>
          <span>Intelligence</span>
          <span className={`panel-drawer-arrow ${open ? 'open' : ''}`}>▲</span>
        </button>

        {/* Content — only visible when open */}
        <div className="panel-drawer-content">
          {children}
        </div>
      </div>
    </>
  );
}
```

Add to `app/globals.css`:
```css
.panel-drawer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  z-index: 49; animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.panel-drawer-handle {
  width: 2.5rem; height: 4px; background: var(--color-border, #e5e7eb);
  border-radius: 9999px; margin: 0.5rem auto;
}
```

---

## Phase 34 — Panel Tab Bar + Multi-Section Navigation

### What to change

**File: `components/article-panel/PanelTabBar.tsx`** — Upgrade to horizontal-scroll with amber active underline.

```typescript
'use client';
import { useRef, useEffect } from 'react';

type Tab = { id: string; title: string };

type Props = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
};

export function PanelTabBar({ tabs, activeTab, onTabChange }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    const el = barRef.current?.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  if (tabs.length <= 1) return null;

  return (
    <div ref={barRef} className="panel-tab-bar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          data-tab={tab.id}
          aria-selected={tab.id === activeTab}
          className={`panel-tab ${tab.id === activeTab ? 'panel-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
}
```

Wire the tab bar into `ArticleIntelPanel.tsx` — track `activeTab` state, render only the active section's component (not all at once), scroll section count badge on the drawer handle.

---

## Phase 35 — Focus Mode Panel Integration

**File: `components/news-app-shell.tsx`** — The reader app. Find the Focus mode card rendering and add an "Intelligence" expand button below each card.

```typescript
// Inside the Focus mode card render (find the existing card JSX):
// Add a button below the article card:
<button
  className="focus-intelligence-btn"
  onClick={() => setExpandedPanel(expandedPanel === article.slug ? null : article.slug)}
>
  📊 Intelligence
</button>

{expandedPanel === article.slug && (
  <div className="focus-panel-inline">
    {/* Render panel sections for this article — lazy loaded */}
    <PanelSectionsInline article={article} />
  </div>
)}
```

Key rules:
- Panel data is **lazy-loaded**: only fetched when the user taps "Intelligence" on a card
- Collapse animation mirrors the drawer (CSS transition on max-height)
- `expandedPanel` is a `string | null` state — only one card can have panel open at a time

---

## Phase 36 — Flow Mode Panel Integration

**File: `components/news-app-shell.tsx`** — Find the Flow mode (TikTok-style) card rendering.

Add a small pill at the bottom-left of each card:

```typescript
// Inside Flow mode card render:
<div className="flow-panel-pill">
  <button
    className="flow-intelligence-pill"
    onClick={() => setFlowPanel(open => !open)}
  >
    📊 Intelligence
  </button>
</div>

{flowPanelOpen && (
  <div className="flow-panel-overlay" onClick={() => setFlowPanelOpen(false)}>
    <div
      className="flow-panel-sheet"
      onClick={e => e.stopPropagation()}
    >
      {/* Max 2 panel sections in Flow mode */}
      <PanelSectionsInline article={article} maxSections={2} />
    </div>
  </div>
)}
```

Rules:
- Flow panel is a half-sheet that slides up from below the card
- Swipe down or tap outside to close (use the same gesture logic from Phase 33)
- Max 2 panel sections in Flow mode (only the highest-priority ones)

---

## Done Checklist

- [ ] Phase 33: Drawer responds to swipe gestures (up = open, down = close)
- [ ] Phase 33: Velocity-snap works: quick flick toggles drawer regardless of position
- [ ] Phase 33: Background overlay appears when drawer is open
- [ ] Phase 33: Drag handle visible at top of drawer
- [ ] Phase 34: Tab bar scrolls horizontally when >2 sections
- [ ] Phase 34: Active tab highlighted with amber underline
- [ ] Phase 34: Clicking a tab shows only that section's content
- [ ] Phase 35: Focus mode cards have "📊 Intelligence" expand button
- [ ] Phase 35: Panel expands inline below the card, lazy-loaded
- [ ] Phase 36: Flow mode cards have "📊 Intelligence" pill
- [ ] Phase 36: Flow panel opens as a half-sheet overlay, max 2 sections
