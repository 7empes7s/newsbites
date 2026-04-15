'use client';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/articles';
import { fetchUpcomingGames } from '@/lib/panels/fetchers/culture';

interface RAWGGame {
  id: number;
  name: string;
  background_image: string | null;
  released: string;
  metacritic: number | null;
}

const GENRE_MAP: Record<string, number> = {
  action: 4,
  indie: 5,
  adventure: 3,
  rpg: 5,
  strategy: 2,
  shooter: 2,
  casual: 4,
  simulation: 6,
  puzzle: 7,
  racing: 1,
  sports: 15,
  fighting: 6,
};

interface ReleasesCalendarCardProps {
  games: RAWGGame[];
}

function ReleasesCalendarCardContent({ games }: ReleasesCalendarCardProps) {
  if (games.length === 0) return null;

  const getDaysUntil = (date: string) => {
    const release = new Date(date);
    const today = new Date();
    const diff = release.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <div className="intel-panel-section-header">
        <span>Upcoming Releases</span>
      </div>
      {games.map((game) => (
        <div key={game.id} className="px-3 py-2 border-b border-[var(--line)] last:border-0">
          <div className="flex gap-2">
            {game.background_image && (
              <img
                src={game.background_image}
                alt={game.name}
                className="w-8 h-10 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium line-clamp-1">{game.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] opacity-50">
                  {new Date(game.released).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {getDaysUntil(game.released) > 0 && (
                  <span className="text-[10px] color-[var(--accent)]">
                    {getDaysUntil(game.released)}d
                  </span>
                )}
                {game.metacritic && (
                  <span className={`text-[10px] font-bold ${
                    game.metacritic >= 75 ? 'color-[#22c55e]' :
                    game.metacritic >= 55 ? 'color-[var(--accent)]' : 'color-[var(--accent-red)]'
                  }`}>
                    ★{game.metacritic}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function ReleasesCalendarPanelLoader({ article }: { article: Article }) {
  const [games, setGames] = useState<RAWGGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      try {
        const genreId = article.tags
          .map(t => GENRE_MAP[t.toLowerCase()])
          .find(id => id);
        
        const data = await fetchUpcomingGames(genreId);
        setGames(data?.results?.slice(0, 5) || []);
      } catch (e) {
        console.error('Failed to load games:', e);
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, [article.tags.join(',')]);

  if (loading) {
    return (
      <>
        <div className="intel-panel-section-header">
          <span>Upcoming Releases</span>
        </div>
        <div className="px-3 py-2 opacity-50">
          <p className="text-sm">Loading...</p>
        </div>
      </>
    );
  }

  return <ReleasesCalendarCardContent games={games} />;
}

export default ReleasesCalendarPanelLoader;