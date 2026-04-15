const HACKERNEWS_BASE = 'https://hn.algolia.com/api/v1';

export async function fetchRedditPosts(query: string, limit = 5) {
  try {
    const res = await fetch(
      `${HACKERNEWS_BASE}/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!res.ok) {
      console.error('HackerNews API error:', res.status);
      return [];
    }
    
    const data = await res.json();
    if (!data?.hits) return [];
    
    return data.hits.map((h: { title: string; points: number; num_comments: number; url: string; objectID: string }) => ({
      title: h.title,
      score: h.points || 0,
      num_comments: h.num_comments || 0,
      permalink: `/item/${h.objectID}`,
      subreddit: 'hackernews',
      author: '',
      created_utc: Date.now(),
    }));
  } catch (e) {
    console.error('HackerNews fetch error:', e);
    return [];
  }
}

export interface RedditPost {
  title: string;
  score: number;
  num_comments: number;
  permalink: string;
  subreddit: string;
  author: string;
  created_utc: number;
}

export function analyzeSentiment(posts: RedditPost[]): 'positive' | 'neutral' | 'negative' {
  if (posts.length === 0) return 'neutral';
  
  const positiveWords = ['great', 'amazing', 'awesome', 'love', 'best', 'excellent', 'fantastic', 'wonderful', 'good', 'perfect'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'poor', 'disappointing', 'fail', 'broken'];
  
  const allTitles = posts.map(p => p.title.toLowerCase()).join(' ');
  
  const positiveCount = positiveWords.filter(w => allTitles.includes(w)).length;
  const negativeCount = negativeWords.filter(w => allTitles.includes(w)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}