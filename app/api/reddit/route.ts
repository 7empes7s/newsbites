import { fetchRedditPosts, analyzeSentiment, type RedditPost } from '@/lib/panels/fetchers/trends';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) return Response.json({ error: 'Missing q param' }, { status: 400 });
  
  try {
    const posts = await fetchRedditPosts(query, 5);
    const sentiment = analyzeSentiment(posts);
    const formattedPosts = posts.map((p: RedditPost) => ({
      title: p.title.slice(0, 80),
      score: p.score,
      comments: p.num_comments,
      url: p.subreddit === 'hackernews' 
        ? `https://news.ycombinator.com${p.permalink}`
        : `https://reddit.com${p.permalink}`,
      subreddit: p.subreddit,
    }));
    return Response.json({ sentiment, posts: formattedPosts });
  } catch (e) {
    console.error('[Reddit API] Error:', e);
    return Response.json({ sentiment: 'neutral', posts: [] });
  }
}