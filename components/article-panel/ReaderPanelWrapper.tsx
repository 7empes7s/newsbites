import type { Article } from "@/lib/articles";
import { getPanelSections } from "@/lib/panels/registry";
import { PanelRenderer } from "./PanelRenderer";

interface Props {
  article: Article;
  maxSections?: number;
}

export async function ReaderPanelWrapper({ article, maxSections = 3 }: Props) {
  const configs = getPanelSections(article);
  
  if (configs.length === 0) {
    return <PanelRenderer sections={[]} loading={false} />;
  }

  const sections: { id: string; content: React.ReactNode }[] = [];
  
  for (const config of configs.slice(0, maxSections)) {
    try {
      const content = await config.component(article);
      if (content) {
        sections.push({ id: config.id, content });
      }
    } catch (error) {
      console.error(`Error loading panel ${config.id}:`, error);
    }
  }

  return <PanelRenderer sections={sections} loading={false} />;
}
