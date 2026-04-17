import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getVerticalLabel } from "@/lib/article-taxonomy";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { ArticleIntelPanel } from "@/components/article-panel/ArticleIntelPanel";
import { ArticleMarketContext } from "@/components/ArticleMarketContext";
import { ArticleJsonLd } from "@/components/ArticleJsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Not Found" };

  return {
    title: `${article.title} | NewsBites`,
    description: article.lead,
    openGraph: {
      title: article.title,
      description: article.lead,
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
      tags: article.tags,
      siteName: "NewsBites — TechInsiderBytes",
      images: [{ url: `/articles/${slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.lead,
    },
  };
}

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

  return (
    <main className="page-shell">
      <ArticleJsonLd article={article} />
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

          <ArticleMarketContext article={article} />
        </div>
        <aside className="article-sidebar">
          {/* Dynamic intelligence panel — renders when vertical/tags match a registered panel */}
          <ArticleIntelPanel article={article} />

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
