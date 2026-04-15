'use client';

import React, { useEffect, useState } from 'react';
import { fetchCurrentSeasonAnime, fetchAnimeByTitle } from '@/lib/panels/fetchers/culture';
import type { Article } from '@/lib/articles';
import { PlayCircle } from 'lucide-react';

interface JikanAnime {
  mal_id: number;
  title: string;
  images: { jpg: { small_image_url: string; large_image_url: string } };
  score: number | null;
  episodes: number | null;
  genres: { name: string }[];
}

interface AniSeasonCardProps {
  article: Article;
}

function AniSeasonCardContent({ animeList, featured }: { animeList: JikanAnime[]; featured: JikanAnime | null }) {
  if (animeList.length === 0) return null;

  const isFeatured = (a: JikanAnime) =>
    featured?.mal_id === a.mal_id;

  return (
    <>
      <div className="intel-panel-section-header flex items-center gap-2">
        <PlayCircle className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm font-bold text-[var(--ink)]">Current Season Anime</span>
      </div>
      <div className="space-y-1">
        {animeList.map((anime) => (
          <div key={anime.mal_id} className="px-3 py-2 border-b border-[var(--line)] last:border-0">
            <div className={`flex gap-2 ${isFeatured(anime) ? 'rounded bg-[var(--accent-soft)] p-2 -mx-2 ring-1 ring-[var(--accent)]' : ''}`}>
              <img
                src={anime.images.jpg.small_image_url}
                alt={anime.title}
                className="w-8 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-medium line-clamp-1 text-[var(--ink)]">{anime.title}</p>
                  {isFeatured(anime) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--ink)] font-bold whitespace-nowrap">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {anime.score && (
                    <span className="text-[10px] text-[var(--accent)] font-bold">
                      ★ {anime.score}
                    </span>
                  )}
                  <span className="text-[10px] opacity-50">
                    {anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}
                  </span>
                </div>
                {anime.genres?.slice(0, 2).map((g) => (
                  <span key={g.name} className="inline-block text-[9px] opacity-50 mr-1">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AniSeasonCardLoader({ article }: AniSeasonCardProps) {
  const [data, setData] = useState<{ animeList: JikanAnime[]; featured: JikanAnime | null }>({
    animeList: [],
    featured: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnime() {
      try {
        setLoading(true);
        const seasonData = await fetchCurrentSeasonAnime();
        const anime = seasonData?.data?.slice(0, 5) || [];
        
        let featuredShow = null;
        if (article.title) {
          featuredShow = await fetchAnimeByTitle(article.title);
        }
        
        setData({ animeList: anime, featured: featuredShow });
      } catch (e) {
        console.error('Failed to load anime:', e);
        setData({ animeList: [], featured: null });
      } finally {
        setLoading(false);
      }
    }
    loadAnime();
  }, [article.title]);

  if (loading) {
    return (
      <div className="intel-panel-segment-header animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  return <AniSeasonCardContent animeList={data.animeList} featured={data.featured} />;
}

export default AniSeasonCardLoader;