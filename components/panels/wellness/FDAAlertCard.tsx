import type { Article } from "@/lib/articles";
import { fetchFDAAlerts } from "@/lib/panels/fetchers/wellness";

interface Alert {
  recall_number: string;
  product_description: string;
  reason_for_recall: string;
  classification: string;
  recalling_firm: string;
  recall_initiation_date: string;
}

function getSeverityColor(classification: string): string {
  switch (classification) {
    case "Class I":
      return "var(--accent-red)";
    case "Class II":
      return "var(--accent)";
    default:
      return "var(--ink-soft)";
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildFDASearchUrl(recallNumber: string): string {
  return `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts?search=${encodeURIComponent(recallNumber)}`;
}

export async function FDAAlertPanel({ article }: { article: Article }) {
  const term = article.tags?.[0] || article.vertical || "drug";
  
  const data = await fetchFDAAlerts(term);
  const alerts = data?.results as Alert[] | undefined;
  
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="intel-panel-section-header">
        <span>FDA Alerts</span>
      </div>
      <p className="text-xs opacity-60 mb-2 ml-3">Active recalls for &quot;{term}&quot;</p>
      {alerts.map((alert, idx) => {
        const productName = alert.product_description.split(",")[0] || "Product";
        const firm = alert.recalling_firm || "Unknown firm";
        const searchUrl = buildFDASearchUrl(alert.recall_number || "");
        
        return (
          <div key={idx} className="px-3 py-2 border-b border-[var(--line)] last:border-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium line-clamp-2">{productName.slice(0, 80)}</p>
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: `${getSeverityColor(alert.classification || "Class III")}20`, color: getSeverityColor(alert.classification || "Class III") }}
              >
                {alert.classification?.replace("Class ", "") || "III"}
              </span>
            </div>
            <p className="text-xs opacity-70 mt-1 line-clamp-2">{alert.reason_for_recall}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] opacity-50">{firm.slice(0, 30)}</span>
              <a 
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] hover:underline color-[var(--accent)]"
              >
                {alert.recall_number}
              </a>
            </div>
          </div>
        );
      })}
    </>
  );
}