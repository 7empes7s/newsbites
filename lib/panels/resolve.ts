import type { ReactNode } from "react";
import type { Article } from "@/lib/articles";
import { getPanelSections } from "@/lib/panels/registry";

export interface ResolvedPanelSection {
  id: string;
  content: ReactNode;
  priority: number;
  cta?: { label: string; href: string };
}

const PANEL_SECTION_TIMEOUT_MS = 3000;

export async function resolveArticlePanelSections(
  article: Article,
  maxSections?: number,
): Promise<ResolvedPanelSection[]> {
  const configs = getPanelSections(article);
  const limitedConfigs =
    typeof maxSections === "number" ? configs.slice(0, maxSections) : configs;

  if (limitedConfigs.length === 0) {
    return [];
  }

  const sections = await Promise.allSettled(
    limitedConfigs.map(async (section) => {
      const content = await Promise.race<ReactNode | null>([
        section.component(article),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), PANEL_SECTION_TIMEOUT_MS);
        }),
      ]);

      return {
        id: section.id,
        content,
        priority: section.priority,
        cta: section.cta,
      };
    }),
  );

  const validSections: ResolvedPanelSection[] = [];

  for (const section of sections) {
    if (section.status === "fulfilled" && section.value.content !== null) {
      validSections.push(section.value);
    }
  }

  return validSections;
}
