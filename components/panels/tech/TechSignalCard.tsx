import type { Article } from "@/lib/articles";
import { detectAIModels } from "@/lib/panels/fetchers/tech";

interface TrendingRepo {
  name: string;
  description: string;
  stars: number;
  language: string;
  url: string;
}

async function fetchTrendingRepos(topic: string): Promise<TrendingRepo[]> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(topic)}+in:name&sort=stars&order=desc&per_page=5`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    
    const data = await res.json();
    return (data.items || []).slice(0, 3).map((repo: { name: string; description: string; stargazers_count: number; language: string; html_url: string }) => ({
      name: repo.name,
      description: repo.description || "",
      stars: repo.stargazers_count,
      language: repo.language || "Unknown",
      url: repo.html_url,
    }));
  } catch {
    return [];
  }
}

function formatNumber(num: number): string {
  const thousand = 1000;
  if (num >= thousand) return (num / thousand).toFixed(1).concat("K");
  return num.toString();
}

function TrendingCard({ repo }: { repo: TrendingRepo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 p-2 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-[#1B2A4A] truncate">{repo.name}</div>
        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{repo.description}</div>
      </div>
      <div className="text-[10px] text-slate-400 shrink-0">★ {formatNumber(repo.stars)}</div>
    </a>
  );
}

const TECH_TOPICS: Record<string, string> = {
  "gpt-4": "LLM",
  "gpt-4o": "LLM",
  "gpt-4o-mini": "LLM",
  "gpt-3.5": "LLM",
  "claude-3.5": "LLM",
  "claude-3": "LLM",
  "gemini-1.5": "LLM",
  "gemini-2.0": "LLM",
  "llama-3": "LLM",
  "llama-3.1": "LLM",
  "mistral": "LLM",
  "qwen": "LLM",
  "gemma": "LLM",
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  nextjs: "Next.js",
  pytorch: "PyTorch",
  tensorflow: "TensorFlow",
  "openai": "OpenAI",
  "anthropic": "Anthropic",
  "google-ai": "Google AI",
};

function detectTechTopic(content: string): string | null {
  const contentLower = content.toLowerCase();
  for (const [keyword, topic] of Object.entries(TECH_TOPICS)) {
    if (contentLower.includes(keyword)) {
      return topic;
    }
  }
  return null;
}

export async function TechSignalPanel({ article }: { article: Article }) {
  const { content = "" } = article;
  
  const detectedModels = detectAIModels(content);
  const techTopic = detectTechTopic(content);
  
  if (detectedModels.length === 0 && !techTopic) return null;
  
  const searchTopic = detectedModels[0] || techTopic;
  if (!searchTopic) return null;
  
  const trending = await fetchTrendingRepos(searchTopic);
  
  if (trending.length === 0) return null;

  return (
    <div className="tech-signal-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Trending in {searchTopic}</h3>
      <div className="space-y-2">
        {trending.map((repo, idx) => (
          <TrendingCard key={idx} repo={repo} />
        ))}
      </div>
    </div>
  );
}