import type { Article } from "@/lib/articles";
import { fetchClinicalTrialCount } from "@/lib/panels/fetchers/wellness";

function formatNumber(num: number): string {
  const thousand = 1000;
  if (num >= thousand) return (num / thousand).toFixed(1) + "K";
  return num.toString();
}

export async function ClinicalTrialPanel({ article }: { article: Article }) {
  const condition = article.tags?.[0] || article.vertical || "health";
  
  const data = await fetchClinicalTrialCount(condition);
  const totalCount = data?.totalCount as number | undefined;
  
  if (!totalCount || totalCount === 0) {
    return null;
  }

  const searchUrl = `https://clinicaltrials.gov/search?query=${encodeURIComponent(condition)}`;

  return (
    <>
      <div className="intel-panel-section-header">
        <span>Clinical Trials</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-60">Active trials for</p>
            <p className="text-lg font-semibold">{formatNumber(totalCount)}</p>
          </div>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline"
          >
            View all →
          </a>
        </div>
      </div>
    </>
  );
}