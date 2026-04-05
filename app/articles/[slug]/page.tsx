import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllArticles, getArticleBySlug, getVerticalLabel } from "@/lib/articles";

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

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
        </aside>
      </article>
    </main>
  );
}
