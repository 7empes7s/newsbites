import type { Article } from "@/lib/articles";
import { resolveArticlePanelSections } from "@/lib/panels/resolve";
import { ArticleIntelPanelClient } from "./ArticleIntelPanelClient";

interface Props {
  article: Article;
}

export async function ArticleIntelPanel({ article }: Props) {
  const validSections = await resolveArticlePanelSections(article);

  if (validSections.length === 0) return null;

  return <ArticleIntelPanelClient sections={validSections} vertical={article.vertical} />;
}
