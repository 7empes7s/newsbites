import type { Article } from "@/lib/articles";
import { getPanelSections } from "@/lib/panels/registry";
import type { ResolvedSection } from "@/lib/panels/types";
import { PanelDrawer } from "./PanelDrawer";

interface Props {
  article: Article;
}

export async function ArticleIntelPanel({ article }: Props) {
  const configs = getPanelSections(article);

  if (configs.length === 0) return null;

  // Fetch all sections in parallel; silently drop any that fail
  const settled = await Promise.allSettled(
    configs.map(async (section) => {
      const data = await section.fetchData(article);
      return { section, data } as ResolvedSection;
    }),
  );

  const sections: ResolvedSection[] = settled
    .filter((r): r is PromiseFulfilledResult<ResolvedSection> => r.status === "fulfilled")
    .map((r) => r.value);

  if (sections.length === 0) return null;

  return (
    <>
      {/* Desktop — inline in the article sidebar */}
      <div className="intel-panel-desktop">
        {sections.map(({ section, data }) => {
          const Component = section.Component;
          return (
            <div key={section.id} className="intel-panel-section">
              <div className="intel-panel-section-header">
                <section.icon size={14} aria-hidden="true" />
                <span>{section.title}</span>
              </div>
              <Component article={article} data={data} />
            </div>
          );
        })}
      </div>

      {/* Mobile — bottom drawer (client component, receives pre-fetched data) */}
      <PanelDrawer sections={sections} article={article} />
    </>
  );
}
