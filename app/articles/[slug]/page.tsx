import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getVerticalLabel } from "@/lib/article-taxonomy";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { detectTickerFromArticle } from "@/lib/finance/tickers";
import { FinanceOverlay } from "@/components/finance/FinanceOverlay";

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    article?: string;
    from?: string;
    mode?: string;
    group?: string;
  }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const appParams = new URLSearchParams();
  appParams.set("article", query.article || article.slug);
  if (query.mode === "flow") appParams.set("mode", "flow");
  if (query.group && query.group !== "all") appParams.set("group", query.group);

  const appHref = `/app?${appParams.toString()}`;
  const isFromReaderApp = query.from === "app";

  // Detect if the article is linked to a publicly traded ticker
  const ticker = detectTickerFromArticle(article.title, article.content ?? "");

  return (
    <main className="page-shell">
      <article className="article-page">
        <div className="article-content">
          <p className="article-meta">
            {getVerticalLabel(article.vertical)} • {article.dateLabel} •{" "}
            {article.readingTime}
          </p>
          <h1>{article.title}</h1>
          <p className="article-summary">{article.lead}</p>

          {/* Finance overlay — shown when article mentions a tracked ticker */}
          {ticker && (
            <FinanceOverlay ticker={ticker.symbol} tickerLabel={ticker.name} />
          )}

          <div className="prose">
            <Markdown remarkPlugins={[remarkGfm]}>{article.content}</Markdown>
          </div>
        </div>
        <aside className="article-sidebar">
          <div className="sidebar-panel">
            <h2>Author</h2>
            <p>{article.author}</p>
          </div>
          <div className="sidebar-panel">
            <h2>Tags</h2>
            <p>{article.tags.join(", ")}</p>
          </div>
          <div className="sidebar-panel">
            <h2>Status</h2>
            <p>{article.status}</p>
          </div>
          {ticker && (
            <div className="sidebar-panel">
              <h2>Market Data</h2>
              <Link href={`/finance/charts?ticker=${ticker.symbol}`} className="lane-link">
                {ticker.name} ({ticker.symbol}) charts →
              </Link>
            </div>
          )}
          <div className="sidebar-panel">
            <h2>Reader App</h2>
            <Link className="lane-link" href={appHref}>
              {isFromReaderApp ? "Back to where you left off" : "Open this story in the app"}
            </Link>
          </div>
        </aside>
      </article>
    </main>
  );
}
