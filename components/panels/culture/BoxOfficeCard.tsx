'use client';
import { useEffect, useState } from 'react';
import { fetchTrendingMovies } from '@/lib/panels/fetchers/culture';

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

interface BoxOfficeCardProps {
  movies: TMDBMovie[];
}

function BoxOfficeCardContent({ movies }: BoxOfficeCardProps) {
  if (movies.length === 0) return null;

  const getRatingColor = (rating: number) => {
    if (rating >= 7.5) return 'color-[#22c55e]';
    if (rating >= 6.0) return 'color-[var(--accent)]';
    return 'opacity-50';
  };

  return (
    <>
      <div className="intel-panel-section-header">
        <span>Trending Movies</span>
      </div>
      {movies.map((movie) => (
        <div key={movie.id} className="px-3 py-2 border-b border-[var(--line)] last:border-0">
          <div className="flex gap-2">
            {movie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                alt={movie.title}
                className="w-8 h-12 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium line-clamp-1">{movie.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] opacity-50">
                  {movie.release_date?.slice(0, 4) || 'TBA'}
                </span>
                <span className={`text-[10px] font-bold ${getRatingColor(movie.vote_average)}`}>
                  ★ {movie.vote_average.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function BoxOfficePanelLoader() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMovies() {
      try {
        const data = await fetchTrendingMovies();
        setMovies(data?.results?.slice(0, 3) || []);
      } catch (e) {
        console.error('Failed to load movies:', e);
      } finally {
        setLoading(false);
      }
    }
    loadMovies();
  }, []);

  if (loading) {
    return (
      <>
        <div className="intel-panel-section-header">
          <span>Trending Movies</span>
        </div>
        <div className="px-3 py-2 opacity-50">
          <p className="text-sm">Loading...</p>
        </div>
      </>
    );
  }

  return <BoxOfficeCardContent movies={movies} />;
}

export default BoxOfficePanelLoader;