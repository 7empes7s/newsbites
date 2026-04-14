# V1 Block 9 — Culture Panels (Anime, Gaming, Film)
**Phases 27–30 | Depends on: Block 0 (panel infrastructure)**

> **Read `CONTEXT.md` first.**

---

## What You're Building

Anime articles show the **current season chart** and a rich show profile. Gaming articles show a **RAWG game card** with Metacritic score and platforms. Culture articles show **box office data**.

---

## Phase 27 — Anime Season Chart

**File: `lib/panels/fetchers/culture.ts`**

```typescript
// Jikan v4 (MyAnimeList wrapper) — free, no key, 3 req/sec
export async function fetchCurrentSeasonAnime() {
  const res = await fetch(
    'https://api.jikan.moe/v4/seasons/now?limit=10',
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAnimeByTitle(title: string) {
  const encoded = encodeURIComponent(title);
  const res = await fetch(
    `https://api.jikan.moe/v4/anime?q=${encoded}&limit=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}
```

**File: `components/panels/culture/AniSeasonCard.tsx`**

Shows top 5 airing anime this season:
- Cover art thumbnail (from Jikan's `images.jpg.small_image_url`)
- Title
- MAL score badge
- Episode count
- Genre tags (first 2)
- If a specific show matches the article's tags → highlight it with amber border + "Featured" badge

Register for `anime` vertical.

---

## Phase 28 — AniList Rich Panel

AniList GraphQL gives richer data than Jikan. Free tier: 90 req/min, no key needed.

**Endpoint:** `https://graphql.anilist.co`

```typescript
// lib/panels/fetchers/culture.ts — Add:
export async function fetchAnilistShow(title: string) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        title { english romaji }
        status
        episodes
        averageScore
        description(asHtml: false)
        studios { nodes { name } }
        streamingEpisodes { title url site }
        coverImage { large }
        season seasonYear
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { search: title } }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.Media || null;
}
```

**File: `components/panels/culture/AnilistProfileCard.tsx`**

Full show card:
- Cover art (large)
- Title (English, then Romaji fallback)
- Status badge (RELEASING = green, FINISHED = grey, NOT_YET_RELEASED = amber)
- Score out of 100
- Studio name
- Streaming platform links (Crunchyroll, Netflix, etc.)
- Synopsis snippet (first 200 chars)

---

## Phase 29 — RAWG Game Profile Card

**File: `lib/panels/fetchers/culture.ts` — Add:**

```typescript
// RAWG — free key, 20K req/month
export async function fetchGameByTitle(title: string) {
  const encoded = encodeURIComponent(title);
  const key = process.env.RAWG_API_KEY || '';
  const res = await fetch(
    `https://api.rawg.io/api/games?search=${encoded}&key=${key}&page_size=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}

export async function fetchUpcomingGames(genre?: string) {
  const key = process.env.RAWG_API_KEY || '';
  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
  const genreParam = genre ? `&genres=${genre}` : '';
  const res = await fetch(
    `https://api.rawg.io/api/games?key=${key}&dates=${today},${future}&ordering=released&page_size=5${genreParam}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}
```

**File: `components/panels/culture/GameProfileCard.tsx`**

Shows:
- Cover art (`background_image`)
- Game title
- Metacritic score badge (green ≥75, amber 55–74, red <55)
- Release date + "X days until release" for upcoming games
- Platform icons (PlayStation, Xbox, PC, Switch)
- Genre chips (first 3)

Register for `gaming` vertical. Add `RAWG_API_KEY` to `.env.local`.

---

## Phase 30 — Release Calendar + Box Office

**File: `components/panels/culture/ReleasesCalendarCard.tsx`**

Lists upcoming game releases in the same genre as the article's game. Uses `fetchUpcomingGames()` with genre filter.

**File: `components/panels/culture/BoxOfficeCard.tsx`**

For `culture` articles that aren't gaming or anime. Uses TMDB:

```typescript
// lib/panels/fetchers/culture.ts — Add:
export async function fetchTrendingMovies() {
  const key = process.env.TMDB_API_KEY || '';
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${key}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}
```

Shows top 3 trending movies: poster, title, rating, release date.

Add `TMDB_API_KEY` to `.env.local`.

### How to test
1. Open `spring-2026-anime-release-window` — anime season chart appears
2. Open `playstation-playerbase-gran-turismo-7` — game profile card with Metacritic score appears
3. Upcoming game releases list shows games in same genre

---

## Done Checklist

- [ ] Phase 27: `AniSeasonCard.tsx` shows top 5 airing anime this season
- [ ] Phase 27: Mentioned anime highlighted with amber border
- [ ] Phase 28: `AnilistProfileCard.tsx` shows full show card with streaming links
- [ ] Phase 29: `GameProfileCard.tsx` shows Metacritic score, platforms, release date
- [ ] Phase 29: `RAWG_API_KEY` and `TMDB_API_KEY` added to `.env.local`
- [ ] Phase 30: `ReleasesCalendarCard.tsx` shows upcoming game releases
- [ ] Phase 30: `BoxOfficeCard.tsx` shows TMDB trending movies
- [ ] All culture panels register for `anime`, `gaming`, `culture` verticals
