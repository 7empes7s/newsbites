import type { Article } from "@/lib/articles";
import { fetchPaperWithCode } from "@/lib/panels/fetchers/tech";

function formatNumber(num: number): string {
  const million = 1000000;
  const thousand = 1000;
  if (num >= million) return (num / million).toFixed(1).concat("M");
  if (num >= thousand) return (num / thousand).toFixed(1).concat("K");
  return num.toString();
}

interface PaperCardProps {
  paper: {
    title: string;
    abstract: string;
    url: string;
    repo_url?: string;
    stars?: number;
  };
}

function PaperCard({ paper }: PaperCardProps) {
  const truncatedAbstract = paper.abstract.length > 200 
    ? paper.abstract.slice(0, 200) + "..." 
    : paper.abstract;

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <a
        href={paper.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-[#1B2A4A] hover:text-[#F5A623] hover:underline block"
      >
        {paper.title}
      </a>
      <p className="text-xs text-slate-500 mt-2 line-clamp-3">{truncatedAbstract}</p>
      
      <div className="flex items-center gap-3 mt-3">
        {paper.repo_url && (
          <a
            href={paper.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#F5A623] hover:underline"
          >
            View Implementation →
          </a>
        )}
        {paper.stars !== undefined && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <span>★</span> {formatNumber(paper.stars)}
          </span>
        )}
      </div>
    </div>
  );
}

const PAPER_KEYWORDS = [
  "machine learning", "neural network", "deep learning", "transformer",
  "llm", "language model", "gpt", "claude", "gemini", "anthropic", "openai",
  "python", "pytorch", "tensorflow", "keras",
];

function extractPaperKeywords(content: string): string[] {
  const contentLower = content.toLowerCase();
  const keywords: string[] = [];
  for (const kw of PAPER_KEYWORDS) {
    if (contentLower.includes(kw)) {
      keywords.push(kw);
    }
  }
  return keywords.slice(0, 3);
}

export async function PaperCardPanel({ article }: { article: Article }) {
  const { content = "" } = article;
  
  const keywords = extractPaperKeywords(content);
  if (keywords.length === 0) return null;
  
  const papers = await Promise.all(
    keywords.map(kw => fetchPaperWithCode(kw))
  );
  
  const validPapers = papers.filter((p): p is NonNullable<typeof p> => p !== null);
  
  const uniquePapers = validPapers.reduce((acc, paper) => {
    if (!acc.find(p => p.title === paper.title)) {
      acc.push(paper);
    }
    return acc;
  }, [] as typeof validPapers);
  
  if (uniquePapers.length === 0) return null;

  return (
    <div className="paper-card-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Related Papers</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {uniquePapers.slice(0, 5).map((paper, idx) => (
          <PaperCard key={idx} paper={paper} />
        ))}
      </div>
    </div>
  );
}