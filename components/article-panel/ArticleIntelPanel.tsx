import type { Article } from "@/lib/articles";
import { getPanelSections } from "@/lib/panels/registry";
import { PanelDrawer } from "./PanelDrawer";

interface Props {
  article: Article;
}

export async function ArticleIntelPanel({ article }: Props) {
  const configs = getPanelSections(article);

  if (configs.length === 0) return null;

  const sections = await Promise.all(
    configs.map(async (section) => {
      const content = await section.component(article);
      return { id: section.id, content, priority: section.priority };
    })
  );

  const validSections = sections.filter((s) => s.content !== null);

  if (validSections.length === 0) return null;

  return (
    <>
      <div className="intel-panel-desktop">
        {validSections.map(({ id, content }) => (
          <div key={id} className="intel-panel-section">
            {content}
          </div>
        ))}
      </div>

      <PanelDrawer sections={validSections} article={article} />
    </>
  );
}
