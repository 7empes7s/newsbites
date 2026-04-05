import Link from "next/link";
import type { Article } from "@/lib/articles";
import { getVerticalLabel } from "@/lib/article-taxonomy";

export function ArticleCard({
  article,
  compact = false,
}: {
  article: Article;
  compact?: boolean;
}) {
  return (
    <Link
      className={compact ? "story-card story-card-compact" : "story-card"}
      href={`/articles/${article.slug}`}
    >
      <span className="story-card-bar" aria-hidden="true" />
      <p className="article-meta">
        {getVerticalLabel(article.vertical)} • {article.dateLabel} •{" "}
        {article.readingTime}
      </p>
      <h3>{article.title}</h3>
      <p>{article.previewText}</p>
    </Link>
  );
}
