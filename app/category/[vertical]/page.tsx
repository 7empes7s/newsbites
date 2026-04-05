import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { getVerticalLabel, verticals, type Vertical } from "@/lib/article-taxonomy";
import {
  getArticlesByVertical,
} from "@/lib/articles";

export function generateStaticParams() {
  return verticals.map((vertical) => ({ vertical }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  if (!verticals.includes(vertical as Vertical)) {
    notFound();
  }

  const typedVertical = vertical as Vertical;
  const articles = getArticlesByVertical(typedVertical);

  return (
    <main className="page-shell">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Category Lane</p>
            <h2>{getVerticalLabel(typedVertical)}</h2>
          </div>
          <Link href={`/app?vertical=${typedVertical}`}>Open in app</Link>
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
