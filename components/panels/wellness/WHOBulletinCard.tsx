import { fetchWHONews } from "@/lib/panels/fetchers/wellness";

interface WHONewsItem {
  Title: string;
  UrlName: string;
  PublicationDateAndTime: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildWHOUrl(dateStr: string, urlName: string): string {
  const date = new Date(dateStr);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `https://www.who.int/news/item/${dd}-${mm}-${yyyy}-${urlName}`;
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
        const fullUrl = buildWHOUrl(item.PublicationDateAndTime, item.UrlName);
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