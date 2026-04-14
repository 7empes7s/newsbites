import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import {
  getGroupForVertical,
  getGroupLabel,
  getVerticalLabel,
} from "@/lib/article-taxonomy";
import { getAllVerticals, getArticlesByVertical } from "@/lib/articles";

export function generateStaticParams() {
  return getAllVerticals().map((vertical) => ({ vertical }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  const verticals = getAllVerticals();
  if (!verticals.includes(vertical)) {
    notFound();
  }

  const articles = getArticlesByVertical(vertical);
  const parentGroup = getGroupForVertical(vertical);

  return (
    <main className="page-shell">
      <section className="section-block section-block-lane">
        <div className="lane-hero">
          <div className="lane-hero-copy">
            <p className="eyebrow">Category Lane</p>
            <h1>{getVerticalLabel(vertical)}</h1>
            {parentGroup ? (
              <p className="article-meta">
                <Link href={`/group/${parentGroup}`}>
                  ← Back to {getGroupLabel(parentGroup)}
                </Link>
              </p>
            ) : null}
            <p className="about-copy">
              This lane isolates the latest approved coverage in one vertical so
              readers can move quickly without switching mental context.
            </p>
          </div>
          <div className="lane-hero-actions">
            <Link className="primary-link" href={`/app`}>
              Open in app
            </Link>
            <Link className="secondary-link" href="/">
              Back to edition
            </Link>
          </div>
        </div>
        {articles.length ? (
          <div className="story-grid">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p className="empty-state">No published stories in this vertical yet.</p>
        )}
      </section>
    </main>
  );
}
