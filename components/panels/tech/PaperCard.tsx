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

export async function PaperCardPanel({ article }: { article: Article }) {
  const title = article.title;
  
  const paper = await fetchPaperWithCode(title);
  
  if (!paper) return null;

  return (
    <div className="paper-card-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Related Paper</h3>
      <PaperCard paper={paper} />
    </div>
  );
}