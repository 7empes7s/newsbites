# V2 Block F — PWA & Offline
**Phases 83–85 | Depends on: Nothing (but Phase 79 push notifications is more useful after Phase 83)**

> **Read `CONTEXT.md` first.** A Progressive Web App lets readers install TIB on their phone's home screen and read offline.

---

## Phase 83 — PWA Manifest + Icons

### What to build

**File: `app/manifest.ts`**

```typescript
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NewsBites — TechInsiderBytes',
    short_name: 'NewsBites',
    description: 'Sharp briefings across tech, finance, politics, culture, and more.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#0a0f1a',
    theme_color: '#1B2A4A',
    orientation: 'portrait',
    icons: [
      { src: '/brand-assets/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand-assets/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand-assets/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Today\'s Briefing',
        url: '/briefing',
        description: 'Your personalized daily news briefing',
      },
      {
        name: 'Search',
        url: '/search',
        description: 'Search all articles',
      },
    ],
  };
}
```

### Create the icons

The icons must exist at `public/brand-assets/`. Create them using the same `ImageResponse` technique from Phase 57 (or manually design them in any tool):

**Script: `scripts/generate-icons.mjs`**

```javascript
// Uses sharp (npm install -D sharp) to generate icons from a base SVG or image
import sharp from 'sharp';
import fs from 'fs';

const SIZES = [192, 512];
const BRAND_NAVY = '#1B2A4A';
const BRAND_AMBER = '#F5A623';

// Create a simple SVG icon programmatically
function createIconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${BRAND_NAVY}"/>
    <text x="${size/2}" y="${size * 0.65}" font-size="${size * 0.5}" text-anchor="middle"
      font-family="serif" font-weight="bold" fill="${BRAND_AMBER}">N</text>
  </svg>`;
}

for (const size of SIZES) {
  await sharp(Buffer.from(createIconSvg(size)))
    .png()
    .toFile(`public/brand-assets/icon-${size}.png`);
  console.log(`Created icon-${size}.png`);
}

// Maskable icon: same but with safe-zone padding (10% inset)
const maskSize = 512;
const padded = `<svg xmlns="http://www.w3.org/2000/svg" width="${maskSize}" height="${maskSize}">
  <rect width="${maskSize}" height="${maskSize}" fill="${BRAND_NAVY}"/>
  <text x="${maskSize/2}" y="${maskSize * 0.65}" font-size="${maskSize * 0.4}" text-anchor="middle"
    font-family="serif" font-weight="bold" fill="${BRAND_AMBER}">N</text>
</svg>`;
await sharp(Buffer.from(padded)).png().toFile('public/brand-assets/icon-maskable.png');
console.log('Created icon-maskable.png');
```

Add to `package.json` scripts: `"icons:generate": "node scripts/generate-icons.mjs"`

**File: `app/layout.tsx`** — Add `theme-color` meta tag:

```typescript
// Already handled by manifest.ts theme_color, but add explicitly for broader support:
export const metadata: Metadata = {
  // ... existing
  themeColor: '#1B2A4A',
};
```

### How to test
1. `npm run icons:generate` — check icons appear in `public/brand-assets/`
2. `npm run build && npm run start`
3. Open on mobile Chrome → "Add to Home Screen" option appears in browser menu
4. Install it → opens as standalone app without browser chrome
5. Open on desktop Chrome → install icon appears in address bar (on eligible pages)

---

## Phase 84 — Service Worker + Offline Caching

**Important:** Next.js 16 uses Turbopack by default. Service workers work best with the standard webpack build for production. The service worker is registered from the browser side — it's a static file in `public/`.

**File: `public/sw.js`**

```javascript
const CACHE_VERSION = 'v1';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const ARTICLE_CACHE = `articles-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// App shell files to pre-cache on install
const SHELL_FILES = [
  '/',
  '/app',
  '/search',
  '/offline',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('shell-') && k !== SHELL_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: apply caching strategies by URL pattern
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, cross-origin, and API requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Images: cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(event.request).then(cached =>
          cached || fetch(event.request).then(res => {
            cache.put(event.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  // Article pages: network-first, cache as fallback
  if (url.pathname.startsWith('/articles/')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(ARTICLE_CACHE).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(event.request).then(cached =>
            cached || caches.match('/offline')
          )
        )
    );
    return;
  }

  // App shell: cache-first
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).catch(() => caches.match('/offline'))
    )
  );
});
```

**File: `app/offline/page.tsx`** — The fallback page shown when offline and page isn't cached:

```typescript
export default function OfflinePage() {
  return (
    <main className="page-shell">
      <div className="offline-page">
        <h1>You're offline</h1>
        <p>Check your connection and try again.</p>
        <p>Articles you've read recently are still available.</p>
        <button onClick={() => window.location.reload()}>Try again</button>
        <a href="/">← Homepage</a>
      </div>
    </main>
  );
}
```

**File: `components/ServiceWorkerRegistration.tsx`** (client component)

```typescript
'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW registration failed:', err));
    }
  }, []);
  return null;
}
```

Add `<ServiceWorkerRegistration />` to the root layout.

### How to test
1. Open TIB in browser, open 3 articles
2. Open Chrome DevTools → Application → Service Worker — confirm "Activated and running"
3. DevTools → Network → Offline checkbox
4. Navigate to one of the 3 articles — loads from cache
5. Navigate to a new article — shows offline page

---

## Phase 85 — Install Prompt UX

**File: `components/InstallPrompt.tsx`** (client component)

```typescript
'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already dismissed within 7 days
    const dismissed = localStorage.getItem('newsbites-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400 * 1000) return;

    // Don't show on desktop
    if (window.innerWidth > 768) return;

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;

      // Only show after visiting 3 articles (tracked in sessionStorage)
      const visited = parseInt(sessionStorage.getItem('articles-visited') || '0');
      if (visited >= 3) setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Track article visits (call this from article pages)
  useEffect(() => {
    const count = parseInt(sessionStorage.getItem('articles-visited') || '0');
    sessionStorage.setItem('articles-visited', String(count + 1));
  }, []);

  async function install() {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') setShow(false);
    deferredPrompt.current = null;
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem('newsbites-install-dismissed', String(Date.now()));
  }

  if (!show) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <Download size={20} />
        <div>
          <strong>Read NewsBites like an app</strong>
          <p>Fast, offline, no app store required.</p>
        </div>
      </div>
      <div className="install-prompt-actions">
        <button onClick={install} className="install-btn-primary">Install</button>
        <button onClick={dismiss} className="install-btn-dismiss"><X size={16} /></button>
      </div>
    </div>
  );
}
```

Add CSS:
```css
.install-prompt {
  position: fixed; bottom: 1rem; left: 1rem; right: 1rem;
  background: #1B2A4A; color: white;
  border-radius: 0.75rem; padding: 1rem;
  display: flex; flex-direction: column; gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  z-index: 60;
}
.install-prompt-content { display: flex; align-items: flex-start; gap: 0.75rem; }
.install-prompt-content p { font-size: 0.8125rem; opacity: 0.7; margin-top: 0.125rem; }
.install-prompt-actions { display: flex; gap: 0.5rem; }
.install-btn-primary {
  flex: 1; padding: 0.5rem 1rem; background: #F5A623;
  border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer;
}
.install-btn-dismiss {
  padding: 0.5rem; background: rgba(255,255,255,0.1);
  border: none; border-radius: 0.5rem; cursor: pointer; color: white;
}
```

Add `<InstallPrompt />` to the root layout.

---

## Done Checklist

- [ ] Phase 83: `app/manifest.ts` returns valid PWA manifest
- [ ] Phase 83: Icons exist: `icon-192.png`, `icon-512.png`, `icon-maskable.png`
- [ ] Phase 83: "Add to Home Screen" appears in mobile Chrome
- [ ] Phase 84: `public/sw.js` installed and running (visible in DevTools → Application)
- [ ] Phase 84: Article pages load when offline (if previously visited)
- [ ] Phase 84: `/offline` page shown for uncached pages when offline
- [ ] Phase 85: Install prompt appears on mobile after 3 article visits
- [ ] Phase 85: Dismissing prompt suppresses it for 7 days
