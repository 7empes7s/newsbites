import type { LucideIcon } from "lucide-react";
import type { Article } from "@/lib/articles";

export interface PanelSectionProps<T = unknown> {
  article: Article;
  data: T;
}

export interface PanelConfig<T = unknown> {
  id: string;
  title: string;
  icon: LucideIcon;
  Component: React.ComponentType<PanelSectionProps<T>>;
  fetchData: (article: Article) => Promise<T>;
  revalidate: number; // ISR seconds
  priority: number;   // lower = shown first
}

export interface ResolvedSection<T = unknown> {
  section: PanelConfig<T>;
  data: T;
}

// panel_hints as written into article frontmatter by the Writer agent
export interface PanelHints {
  competition?: string;            // football-data.org competition code, e.g. "CL"
  teams?: string[];                // team names mentioned
  tickers?: string[];              // stock tickers, e.g. ["AAPL", "NVDA"]
  country_codes?: string[];        // ISO 3166-1 alpha-2 codes, e.g. ["US", "CN"]
  github_repos?: string[];         // e.g. ["openai/openai-python"]
  nasa_mission?: string;           // e.g. "Artemis II"
  arxiv_id?: string;               // arXiv paper ID, e.g. "2401.12345"
  launch_id?: string;              // Launch Library 2 launch ID
}
