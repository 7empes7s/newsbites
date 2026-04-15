import { fetchWHONews } from "@/lib/panels/fetchers/wellness";

interface WHONewsItem {
  Title: string;
  ItemDefaultUrl: string;
  PublicationDateAndTime: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function WHOBulletinPanel() {
  const data = await fetchWHONews();
  const news = data?.value as WHONewsItem[] | undefined;
  
  if (!news || news.length === 0) {
    return null;
  }

  return (
    <>
      <div className="intel-panel-section-header">
        <span>WHO Health News</span>
      </div>
      {news.map((item, idx) => {
        const fullUrl = `https://www.who.int${item.ItemDefaultUrl}`;
        return (
          <div key={idx} className="px-3 py-2 border-b border-[var(--line)] last:border-0">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm line-clamp-2 hover:text-[var(--accent)] hover:underline block"
            >
              {item.Title}
            </a>
            <p className="text-xs opacity-60 mt-1">{formatDate(item.PublicationDateAndTime)}</p>
          </div>
        );
      })}
    </>
  );
}