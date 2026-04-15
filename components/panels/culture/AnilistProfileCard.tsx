'use client';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/articles';
import { fetchAnilistShow } from '@/lib/panels/fetchers/culture';

interface AnilistMedia {
  title: { english: string | null; romaji: string };
  status: string;
  episodes: number | null;
  averageScore: number | null;
  description: string;
  studios: { nodes: { name: string }[] };
  streamingEpisodes: { title: string; url: string; site: string }[];
  coverImage: { large: string };
  season: string | null;
  seasonYear: number | null;
}

interface AnilistProfileCardProps {
  show: AnilistMedia | null;
}

function AnilistProfileCardContent({ show }: AnilistProfileCardProps) {
  if (!show) return null;

  const statusColors: Record<string, string> = {
    RELEASING: 'bg-[var(--accent)] color-[var(--ink)]',
    FINISHED: 'opacity-40',
    NOT_YET_RELEASED: 'bg-[var(--accent-soft)] color-[var(--accent-deep)]',
  };

  const truncatedDesc = show.description?.length > 200
    ? show.description.slice(0, 200) + '...'
    : show.description;

  return (
    <>
      <div className="intel-panel-section-header">
        <span>Show Profile</span>
      </div>
      <img
        src={show.coverImage.large}
        alt={show.title.english || show.title.romaji}
        className="w-full h-24 object-cover"
      />
      <div className="px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-2">
            {show.title.english || show.title.romaji}
          </p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[show.status] || 'opacity-40'}`}>
            {show.status?.replace('_', ' ') || 'Unknown'}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-xs opacity-60 mt-1">
          {show.averageScore && (
            <span className="color-[var(--accent)]">
              ★ {show.averageScore}/100
            </span>
          )}
          {show.episodes && (
            <span>{show.episodes} episods</span>
          )}
          {show.season && show.seasonYear && (
            <span>{show.season} {show.seasonYear}</span>
          )}
        </div>

        {show.studios?.nodes?.[0] && (
          <p className="text-xs opacity-50 mt-1">
            Studio: {show.studios.nodes.map(s => s.name).join(', ')}
          </p>
        )}

        {show.streamingEpisodes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {show.streamingEpisodes.slice(0, 3).map((ep, i) => (
              <a
                key={i}
                href={ep.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] underline color-[var(--accent)]"
              >
                {ep.site || 'Watch'}
              </a>
            ))}
          </div>
        )}

        {truncatedDesc && (
          <p className="text-xs opacity-60 mt-2 line-clamp-3">{truncatedDesc}</p>
        )}
      </div>
    </>
  );
}

function AnilistProfileCardLoader({ article }: { article: Article }) {
  const [show, setShow] = useState<AnilistMedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShow() {
      try {
        setLoading(true);
        const data = await fetchAnilistShow(article.title);
        setShow(data);
      } catch (e) {
        console.error('Failed to load AniList show:', e);
        setShow(null);
      } finally {
        setLoading(false);
      }
    }
    loadShow();
  }, [article.title]);

  if (loading) {
    return (
      <>
        <div className="intel-panel-section-header">
          <span>Show Profile</span>
        </div>
        <div className="px-3 py-2 opacity-50">
          <p className="text-sm">Loading...</p>
        </div>
      </>
    );
  }

  return <AnilistProfileCardContent show={show} />;
}

export default AnilistProfileCardLoader;