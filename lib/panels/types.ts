import type { Article } from "@/lib/articles";

export interface PanelConfig<T = unknown> {
  id: string;
  priority: number;
  component: (article: Article) => Promise<React.ReactNode>;
  cta?: {
    label: string;
    href: string;
  };
}

export interface ResolvedSection {
  id: string;
  Component: React.ComponentType | null;
  priority: number;
}

export interface PanelHints {
  competition?: string;
  teams?: string[];
  home_team?: string;
  away_team?: string;
  home_crest?: string;
  away_crest?: string;
  home_position?: number;
  away_position?: number;
  home_form?: ('W' | 'D' | 'L')[];
  away_form?: ('W' | 'D' | 'L')[];
  h2h_home?: number;
  h2h_draw?: number;
  h2h_away?: number;
  home_injuries?: { playerName: string; reason: 'injured' | 'suspended'; isKeyPlayer: boolean }[];
  away_injuries?: { playerName: string; reason: 'injured' | 'suspended'; isKeyPlayer: boolean }[];
  tickers?: string[];
  country_codes?: string[];
  github_repos?: string[];
  ai_models?: string[];
  nasa_mission?: string;
  arxiv_id?: string;
  launch_id?: string;
}
