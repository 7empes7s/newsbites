# V2 Block K — The Finishing Touches
**Phases 103–106 | Depends on: Phase 89 (CI) for Phase 105; all previous phases for Phase 106**

> **Read `CONTEXT.md` first.** This block is the production sign-off. Phases 103–105 are standalone polish. Phase 106 is the audit and V3 scoping — it runs after everything else.

---

## Why This Block Exists

V2 ends here. Phase 106 is the gate: after it passes, NewsBites is production-grade. These four phases cover the finishing details that separate a personal project from a real publication:
- **Print / PDF** → professionals expect it (Phase 103)
- **Keyboard navigation** → power users and accessibility (Phase 104)
- **Auto-deploy** → manual `./deploy.sh` doesn't scale to AI-published stories (Phase 105)
- **Full audit** → the checklist that proves everything works (Phase 106)

---

## Phase 103 — Print Stylesheet

**Goal:** Articles look professional when printed or saved as PDF.

**Why it matters:** Researchers, analysts, and professionals print articles. A garbled print layout signals an amateur project. A clean one signals a real publication.

### Changes to `app/globals.css`

Add a `@media print` block. These rules apply when the user presses Ctrl+P or uses browser "Save as PDF":

```css
@media print {
  /* Hide all UI chrome */
  .site-chrome,
  .site-footer,
  .article-sidebar,
  .intel-panel-desktop,
  .intel-drawer,
  .reading-progress-bar,
  .share-buttons,
  nav,
  aside,
  [class*="badge--breaking"] {
    display: none !important;
  }

  /* Article content takes full width */
  .article-page {
    display: block;
    max-width: 100%;
  }

  .article-content {
    max-width: 100%;
  }

  /* Typography */
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 12pt;
    color: #000;
    background: #fff;
  }

  h1, h2, h3 {
    font-family: Georgia, serif;
    color: #000;
    page-break-after: avoid;
  }

  /* Never break inside a paragraph */
  p, li, blockquote {
    page-break-inside: avoid;
    orphans: 3;
    widows: 3;
  }

  /* Always break before major sections */
  h2 { page-break-before: auto; }

  /* Images: fit page width, no overflow */
  img {
    max-width: 100% !important;
    height: auto !important;
  }

  /* Show link URLs in parentheses after the link text */
  a[href]:after {
    content: ' (' attr(href) ')';
    font-size: 0.8em;
    color: #555;
  }

  /* Don't annotate internal links or javascript: links */
  a[href^="/"]:after,
  a[href^="#"]:after,
  a[href^="javascript:"]:after {
    content: '';
  }

  /* Source cards should print cleanly */
  .source-card {
    border: 1px solid #ccc;
    padding: 12pt;
    margin-top: 16pt;
  }

  /* Page header/footer via CSS */
  @page {
    margin: 2cm 2.5cm;
  }
}
```

### How to test
1. Open any article in a browser
2. Press Ctrl+P (Cmd+P on Mac)
3. Verify: navigation, sidebar, drawers are hidden
4. Verify: article body fills the page
5. Verify: external links show their URL in parentheses
6. Save as PDF — file should be clean, professional, and readable

**Files:** `app/globals.css`

---

## Phase 104 — Keyboard Navigation & Shortcuts

**Goal:** Power users can navigate the entire site with keyboard only.

**Why it matters:** Accessibility requirement (Phase 64 prerequisite) plus power-user delight. Bloomberg, FT, and The Economist users live on the keyboard — building this signals editorial credibility.

**Depends on:** Phase 60 (search — `Cmd+K` trigger), Phase 62 (bookmarks — `b` key).

### File: `components/KeyboardShortcuts.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore when typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (target.matches('input, textarea, select, [contenteditable]')) return;

      const meta = e.metaKey || e.ctrlKey;

      switch (true) {
        case meta && e.key === 'k':
          e.preventDefault();
          // Dispatch custom event that SearchBar listens to
          window.dispatchEvent(new CustomEvent('tib:open-search'));
          break;

        case e.key === 'b' && !meta:
          // Dispatch bookmark toggle for current article (handled by ArticlePage)
          window.dispatchEvent(new CustomEvent('tib:toggle-bookmark', { detail: { pathname } }));
          break;

        case e.key === 'd' && !meta:
          // Toggle dark mode (dispatched to theme manager)
          window.dispatchEvent(new CustomEvent('tib:toggle-dark-mode'));
          break;

        case e.key === '?':
          window.dispatchEvent(new CustomEvent('tib:toggle-shortcuts-modal'));
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pathname]);

  return null;
}
```

### File: `components/ShortcutsModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

const SHORTCUTS = [
  { keys: ['Cmd', 'K'],  description: 'Open search' },
  { keys: ['b'],         description: 'Bookmark current article' },
  { keys: ['d'],         description: 'Toggle dark mode' },
  { keys: ['?'],         description: 'Show this help' },
  { keys: ['j'],         description: 'Next article (in reader app)' },
  { keys: ['k'],         description: 'Previous article (in reader app)' },
  { keys: ['Esc'],       description: 'Close any open panel/modal' },
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen(v => !v);
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('tib:toggle-shortcuts-modal', toggle);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('tib:toggle-shortcuts-modal', toggle);
      window.removeEventListener('keydown', close);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="shortcuts-overlay" onClick={() => setOpen(false)} role="dialog" aria-label="Keyboard shortcuts">
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <h2>Keyboard Shortcuts</h2>
        <table className="shortcuts-table">
          <tbody>
            {SHORTCUTS.map(({ keys, description }) => (
              <tr key={description}>
                <td>
                  {keys.map(k => <kbd key={k} className="shortcuts-key">{k}</kbd>)}
                </td>
                <td>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="shortcuts-dismiss">Press <kbd className="shortcuts-key">Esc</kbd> or click outside to close</p>
      </div>
    </div>
  );
}
```

Add both to `app/layout.tsx`:

```tsx
<KeyboardShortcuts />
<ShortcutsModal />
```

### CSS to add to `globals.css`

```css
.shortcuts-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9000; display: flex; align-items: center; justify-content: center; }
.shortcuts-modal { background: #fff; border-radius: 16px; padding: 24px; max-width: 480px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.shortcuts-modal h2 { font-family: var(--font-display), serif; margin: 0 0 16px; font-size: 1.2rem; }
.shortcuts-table { width: 100%; border-collapse: collapse; }
.shortcuts-table td { padding: 6px 8px; font-size: 0.88rem; }
.shortcuts-table td:first-child { white-space: nowrap; }
.shortcuts-key { background: var(--line); border: 1px solid rgba(0,0,0,0.15); border-radius: 5px; padding: 2px 6px; font-family: monospace; font-size: 0.78rem; margin-right: 3px; }
.shortcuts-dismiss { margin-top: 16px; font-size: 0.78rem; color: var(--ink-soft); text-align: center; }
```

### How to test
1. On any page, press `?` — shortcuts modal opens
2. Press `Esc` — modal closes
3. Press `Cmd+K` — search opens (requires Phase 60 to be done; otherwise just logs the event)
4. While in an `<input>`, press `?` — nothing happens (no interference while typing)

**Files:** `components/KeyboardShortcuts.tsx`, `components/ShortcutsModal.tsx`, `app/layout.tsx`, `app/globals.css`

---

## Phase 105 — Automated Deploy Pipeline

**Goal:** Pushing to `main` automatically builds and deploys to the VPS.

**Why it matters:** The autopipeline publishes articles without human intervention. If `main` doesn't auto-deploy, newly published articles sit in the repo but never go live until someone manually SSHes in. That gap kills the value of the automated editorial pipeline.

**Depends on:** Phase 89 (GitHub Actions CI must pass before deploy runs).

### File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    needs: check   # references the CI job from Phase 89's ci.yml
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to Hetzner VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          script: |
            set -e
            cd /opt/newsbites
            git fetch origin main
            git reset --hard origin/main
            npm install --legacy-peer-deps --prefer-offline
            npm run build
            sudo systemctl restart newsbites.service
            echo "Deploy complete: $(date -u)"
```

### GitHub Secrets to add

In GitHub repo Settings → Secrets and variables → Actions:
- `VPS_HOST` → `178.104.120.71` (Hetzner VPS IP)
- `VPS_USER` → `root`
- `VPS_SSH_KEY` → contents of an SSH private key that has access to the VPS (generate a dedicated deploy key: `ssh-keygen -t ed25519 -C "newsbites-deploy" -f ~/.ssh/newsbites_deploy`)

### sudoers entry needed

The deploy SSH user needs passwordless sudo for the systemctl command:

```
# In /etc/sudoers.d/deploy
root ALL=(ALL) NOPASSWD: /bin/systemctl restart newsbites.service
```

(If running as root already, this is not needed.)

### Keep `./deploy.sh` as manual fallback

Do not remove `deploy.sh`. Useful when:
- GitHub Actions is down
- Deploy needs to run before pushing
- Quick local testing

### How to test
1. Add the three GitHub secrets
2. Make a trivial change (e.g., add a comment) and push to main
3. Watch GitHub Actions → deploy job runs → VPS restarts → change is live
4. Total time from push to live: should be under 3 minutes

**Files:** `.github/workflows/deploy.yml`

---

## Phase 106 — Full Production Audit + V3 Scoping

**Goal:** Everything works. Every page is tested. The site is ready for real traffic.

**Depends on:** All V1 and V2 phases. This is the final sign-off.

### Audit checklist (run manually)

#### SEO
- [ ] All article pages have unique `<title>` and `<meta name="description">` (sample 5 random articles)
- [ ] All article pages have JSON-LD `NewsArticle` structured data (Phase 54)
- [ ] `/sitemap.xml` lists all published articles — count matches `ls content/articles/*.md | wc -l`
- [ ] `/rss.xml` validates at [W3C Feed Validator](https://validator.w3.org/feed/)
- [ ] `/api/health` responds with `status: "ok"` and correct article count
- [ ] Google Search Console: 0 crawl errors, sitemap submitted

#### Performance
- [ ] Lighthouse Performance ≥ 90 on `/`, an article page, and `/app`
- [ ] LCP < 2.5s on all key pages (check via DevTools → Lighthouse)
- [ ] CLS < 0.1 on all key pages
- [ ] `@next/bundle-analyzer` run — no unexpectedly large chunks

#### Accessibility
- [ ] Lighthouse Accessibility ≥ 95 on `/`, an article page
- [ ] All images have `alt` attributes
- [ ] Full keyboard navigation works (Tab through nav, article links, panel tabs)
- [ ] `?` shortcut opens shortcuts modal

#### Features (spot-check one each)
- [ ] Dark mode toggles on all pages
- [ ] Search returns relevant results for a known article title
- [ ] Bookmarks persist after page reload
- [ ] Share buttons copy the correct URL
- [ ] RSS feed contains the latest article
- [ ] A vertical panel renders on an appropriate article (at least one V1 vertical done)
- [ ] PWA installs from Chrome (if Phase 83–85 done)
- [ ] `/api/analytics` records a pageview correctly

#### Error handling
- [ ] 404 page shows a helpful message and links
- [ ] Panel errors don't crash the article page (test by temporarily breaking a fetcher)
- [ ] `node scripts/review-errors.mjs` runs without crashing (even if log is empty)

### V3 Scoping document

Create `NEWSBITES_LEVELING_PLAN_V3.md` as a scope document (not a full plan — just a directional list of topics for V3):

```markdown
# NewsBites V3 — Future Scope

## Potential V3 tracks:
- **i18n:** French and Arabic reader segments (RTL support required)
- **Community:** Comment threads (moderated), reader reactions
- **Newsletter:** Weekly AI-curated digest email via Resend/SendGrid
- **Mobile app:** React Native or Capacitor wrapper
- **Monetization:** Premium content tier, newsletter sponsorships, reader memberships
- **User system:** Move localStorage bookmarks/history to real auth (Clerk or NextAuth)
- **Multi-author:** Bylines, contributor pages, editorial standards page
- **AI chat:** "Ask TIB" — readers ask questions, get answers grounded in TIB's article corpus
- **Automated SEO:** AI-generated meta descriptions and OG image text for every article
```

The V3 plan should NOT be written until Phase 106's audit is complete and passing. Write it then, not before.

---

## Done Checklist

- [ ] Phase 103: `@media print` styles added — article content renders cleanly in print preview
- [ ] Phase 103: Navigation, sidebar, drawers hidden in print
- [ ] Phase 103: External link URLs shown in parentheses after link text
- [ ] Phase 104: `KeyboardShortcuts.tsx` + `ShortcutsModal.tsx` mounted in root layout
- [ ] Phase 104: `?` key opens shortcuts modal
- [ ] Phase 104: `Cmd+K` dispatches search open event
- [ ] Phase 104: Keyboard events ignored while user is typing in an input
- [ ] Phase 105: `.github/workflows/deploy.yml` created
- [ ] Phase 105: Three GitHub secrets configured (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`)
- [ ] Phase 105: A test push to `main` triggers automatic deploy
- [ ] Phase 105: `./deploy.sh` still works as manual fallback
- [ ] Phase 106: All SEO audit items pass
- [ ] Phase 106: All Performance audit items pass (Lighthouse ≥ 90)
- [ ] Phase 106: All Accessibility audit items pass (Lighthouse ≥ 95)
- [ ] Phase 106: All feature spot-checks pass
- [ ] Phase 106: `NEWSBITES_LEVELING_PLAN_V3.md` created with scope topics
