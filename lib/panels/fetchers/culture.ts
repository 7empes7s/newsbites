const JIKAN_BASE = 'https://api.jikan.moe/v4';
const ANILIST_URL = 'https://graphql.anilist.co';
const RAWG_BASE = 'https://api.rawg.io/api/games';
const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function fetchCurrentSeasonAnime() {
  const res = await fetch(`${JIKAN_BASE}/seasons/now?limit=10`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAnimeByTitle(title: string) {
  const encoded = encodeURIComponent(title);
  const res = await fetch(`${JIKAN_BASE}/anime?q=${encoded}&limit=1`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

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
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { search: title } }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.Media || null;
}

export async function fetchGameByTitle(title: string) {
  const key = process.env.RAWG_API_KEY || '';
  const encoded = encodeURIComponent(title);
  const res = await fetch(
    `${RAWG_BASE}?search=${encoded}&key=${key}&page_size=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}

export async function fetchUpcomingGames(genreId?: number) {
  const key = process.env.RAWG_API_KEY || '';
  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
  const genreParam = genreId ? `&genres=${genreId}` : '';
  const res = await fetch(
    `${RAWG_BASE}?key=${key}&dates=${today},${future}&ordering=released&page_size=5${genreParam}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchTrendingMovies() {
  const key = process.env.TMDB_API_KEY || '';
  const res = await fetch(
    `${TMDB_BASE}/trending/movie/week?api_key=${key}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}
