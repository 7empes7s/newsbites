'use client';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/articles';

interface RedditPost {
  title: string;
  score: number;
  comments: number;
  url: string;
  subreddit: string;
}

function RedditSentimentCardContent({ posts, sentiment }: { posts: RedditPost[]; sentiment: string }) {
  if (posts.length === 0) return null;

  const sentimentColors: Record<string, string> = {
    positive: 'bg-emerald-500 text-white',
    neutral: 'bg-slate-400 text-white',
    negative: 'bg-rose-500 text-white',
  };

  return (
    <>
      <div className="intel-panel-section-header flex items-center gap-2">
        <span>Tech Sentiment</span>
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${sentimentColors[sentiment] || sentimentColors.neutral}`}>
          {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
        </span>
      </div>
      <div className="px-3 py-2 space-y-2">
        {posts.slice(0, 3).map((post, idx) => (
          <a
            key={idx}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <p className="text-xs line-clamp-2 hover:underline">{post.title}</p>
            <div className="flex items-center gap-2 mt-1 text-[10px] opacity-50">
              <span>▲{post.score}</span>
              <span>💬{post.comments}</span>
              <span>{post.subreddit === 'hackernews' ? 'HN' : `r/${post.subreddit}`}</span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

function RedditSentimentCardLoader({ article }: { article: Article }) {
  const [data, setData] = useState<{ posts: RedditPost[]; sentiment: string }>({
    posts: [],
    sentiment: 'neutral',
  });
  const [loading, setLoading] = useState(true);

  const keyword = article.tags?.[0] || article.title.split(' ')[0];

  useEffect(() => {
    async function loadReddit() {
      try {
        const res = await fetch(`/api/reddit?q=${encodeURIComponent(keyword)}`);
        const json = await res.json();
        setData({ posts: json.posts || [], sentiment: json.sentiment || 'neutral' });
      } catch (e) {
        console.error('Failed to load Reddit:', e);
        setData({ posts: [], sentiment: 'neutral' });
      } finally {
        setLoading(false);
      }
    }
    loadReddit();
  }, [keyword]);

  if (loading) {
    return (
      <div className="intel-panel-section-header animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  return <RedditSentimentCardContent posts={data.posts} sentiment={data.sentiment} />;
}

export default RedditSentimentCardLoader;