'use client';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/articles';
import { fetchGameByTitle } from '@/lib/panels/fetchers/culture';

interface RAWGGame {
  id: number;
  name: string;
  background_image: string;
  metacritic: number | null;
  released: string;
  platforms: { platform: { name: string; slug: string } }[];
  genres: { name: string }[];
}

interface GameProfileCardProps {
  game: RAWGGame | null;
}

function GameProfileCardContent({ game }: GameProfileCardProps) {
  if (!game) return null;

  const getMetacriticColor = (score: number | null) => {
    if (!score) return 'opacity-40';
    if (score >= 75) return 'bg-[#22c55e] color-white';
    if (score >= 55) return 'bg-[var(--accent)] color-[var(--ink)]';
    return 'bg-[var(--accent-red)] color-white';
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('playstation') || p.includes('ps')) return '🎮';
    if (p.includes('xbox')) return '❌';
    if (p.includes('pc')) return '💻';
    if (p.includes('switch') || p.includes('nintendo')) return '🕹️';
    if (p.includes('linux')) return '🐧';
    if (p.includes('mac')) return '🍎';
    if (p.includes('android') || p.includes('ios')) return '📱';
    return '🎮';
  };

  const getDaysUntil = (date: string) => {
    const release = new Date(date);
    const today = new Date();
    const diff = release.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const platformSet = new Set(
    game.platforms?.map(p => p.platform.name.split(' ')[0]).slice(0, 4) || []
  );
  const uniquePlatforms = Array.from(platformSet);

  return (
    <>
      <div className="intel-panel-section-header">
        <span>Game Profile</span>
      </div>
      {game.background_image && (
        <img
          src={game.background_image}
          alt={game.name}
          className="w-full h-20 object-cover"
        />
      )}
      <div className="px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-2">{game.name}</p>
          {game.metacritic && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${getMetacriticColor(game.metacritic)}`}>
              ★ {game.metacritic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs opacity-60 mt-1">
          {game.released && (
            <span>
              {new Date(game.released).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              {getDaysUntil(game.released) > 0 && (
                <span className="ml-1 color-[var(--accent)]">
                  ({getDaysUntil(game.released)} days)
                </span>
              )}
            </span>
          )}
        </div>

        {uniquePlatforms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {uniquePlatforms.map((p) => (
              <span key={p} className="text-sm" title={p}>
                {getPlatformIcon(p)}
              </span>
            ))}
          </div>
        )}

        {game.genres?.slice(0, 3).map((g) => (
          <span key={g.name} className="inline-block text-[10px] opacity-50 mr-1">
            {g.name}
          </span>
        ))}
      </div>
    </>
  );
}

function GameProfilePanelLoader({ article }: { article: Article }) {
  const [game, setGame] = useState<RAWGGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGame() {
      try {
        const data = await fetchGameByTitle(article.title);
        setGame(data);
      } catch (e) {
        console.error('Failed to load game:', e);
      } finally {
        setLoading(false);
      }
    }
    loadGame();
  }, [article.title]);

  if (loading) {
    return (
      <>
        <div className="intel-panel-section-header">
          <span>Game Profile</span>
        </div>
        <div className="px-3 py-2 opacity-50">
          <p className="text-sm">Loading...</p>
        </div>
      </>
    );
  }

  return <GameProfileCardContent game={game} />;
}

export default GameProfilePanelLoader;