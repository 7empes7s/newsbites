import Link from "next/link";
import type { Article } from "@/lib/articles";
import { getVerticalLabel } from "@/lib/articles";

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
      <p className="article-meta">
        {getVerticalLabel(article.vertical)} • {article.dateLabel} •{" "}
        {article.readingTime}
      </p>
      <h3>{article.title}</h3>
      <p>{article.lead}</p>
    </Link>
  );
}
