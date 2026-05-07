import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getVerticalLabel } from "@/lib/article-taxonomy";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import type { ImageSource } from "@/lib/articles";
import { ArticleIntelPanel } from "@/components/article-panel/ArticleIntelPanel";
import { ArticleMarketContext } from "@/components/ArticleMarketContext";
import { ArticleJsonLd } from "@/components/ArticleJsonLd";

function ImageSourceBadge({ raw }: { raw?: string }) {
  if (!raw) return null;
  let source: ImageSource;
  try { source = JSON.parse(raw); } catch { return null; }

  if (source.type === "ai") {
    return <p className="image-source-badge image-source-ai">AI-generated image</p>;
  }
  if (source.type === "stock" && source.photographer) {
    const platform = source.provider === "pexels" ? "Pexels" : source.provider === "pixabay" ? "Pixabay" : source.provider;
    const platformUrl = source.provider === "pexels" ? "https://www.pexels.com" : source.provider === "pixabay" ? "https://pixabay.com" : null;
    return (
      <p className="image-source-badge image-source-stock">
        Photo:{" "}
        {source.photographerUrl
          ? <a href={source.photographerUrl} target="_blank" rel="noopener noreferrer">{source.photographer}</a>
          : source.photographer}
        {platform && platformUrl && (
          <> /{" "}<a href={platformUrl} target="_blank" rel="noopener noreferrer">{platform}</a></>
        )}
        {source.sourceUrl && (
          <> · <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">source</a></>
        )}
      </p>
    );
  }
  return null;
}

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

          {article.coverImage && (
            <div className="article-cover-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.coverImage} alt="" aria-hidden="true" />
              <ImageSourceBadge raw={article.imageSource} />
            </div>
          )}

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
