import type { Article } from "@/lib/articles";
import type { PanelConfig } from "./types";

// Vertical panel registrations — populated as phases ship
// Each array is appended to by its respective vertical module

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sportsPanels: PanelConfig<any>[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const financePanels: PanelConfig<any>[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const worldPanels: PanelConfig<any>[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const techPanels: PanelConfig<any>[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sciencePanels: PanelConfig<any>[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wellnessPanels: PanelConfig<any>[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const climatePanels: PanelConfig<any>[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const culturePanels: PanelConfig<any>[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPanelSections(article: Article): PanelConfig<any>[] {
  const configs: PanelConfig<any>[] = [];
  const { vertical, tags = [], panel_hints } = article;

  const hasTags = (...t: string[]) => t.some((tag) => tags.includes(tag));

  if (vertical === "sports" || hasTags("football", "basketball", "tennis", "formula-1"))
    configs.push(...sportsPanels);

  if (["finance", "economy", "crypto"].includes(vertical) || (panel_hints?.tickers?.length ?? 0) > 0)
    configs.push(...financePanels);

  if (["global-politics", "world"].includes(vertical) || (panel_hints?.country_codes?.length ?? 0) > 0)
    configs.push(...worldPanels);

  if (["ai", "trends", "cybersecurity", "tech"].includes(vertical) || (panel_hints?.github_repos?.length ?? 0) > 0)
    configs.push(...techPanels);

  if (["space", "science"].includes(vertical) || panel_hints?.nasa_mission || panel_hints?.launch_id)
    configs.push(...sciencePanels);

  if (["healthcare", "wellness", "tcm", "skincare"].includes(vertical))
    configs.push(...wellnessPanels);

  if (["climate", "energy"].includes(vertical))
    configs.push(...climatePanels);

  if (["anime", "gaming", "culture"].includes(vertical))
    configs.push(...culturePanels);

  return configs.sort((a, b) => a.priority - b.priority);
}

// Export panel arrays so vertical modules can push into them at import time
export {
  sportsPanels,
  financePanels,
  worldPanels,
  techPanels,
  sciencePanels,
  wellnessPanels,
  climatePanels,
  culturePanels,
};
