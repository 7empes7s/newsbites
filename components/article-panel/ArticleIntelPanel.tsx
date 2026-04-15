import type { Article } from "@/lib/articles";
import type React from "react";
import { getPanelSections } from "@/lib/panels/registry";
import { PanelDrawer } from "./PanelDrawer";

interface ResolvedSection {
  id: string;
  content: React.ReactNode;
  priority: number;
}

function PanelEmptyFallback({ panelId }: { panelId: string }) {
  const messages: Record<string, string> = {
    "fda-alerts": "FDA Alerts",
    "who-bulletin": "WHO Bulletin",
    "clinical-trials": "Clinical Trials",
    "co2-widget": "CO₂ Level",
    "temp-anomaly": "Temperature Anomaly",
    "renewable-capacity": "Renewable Capacity",
    "sports-standings": "League Standings",
    "sports-fixtures": "Upcoming Fixtures",
    "sports-pronostic": "Match Prediction",
    "sports-home-team": "Home Team Stats",
    "sports-away-team": "Away Team Stats",
    "sports-route-to-final": "Knockout Bracket",
    "finance-overview": "Market Overview",
    "finance-sparkline": "Ticker Data",
    "macro-indicators": "Macro Indicators",
    "crypto-panel": "Crypto Prices",
    "country-profile": "Country Profile",
    "conflict-timeline": "Conflict Timeline",
    "election-calendar": "Election Calendar",
    "trade-data": "Trade Data",
    "github-repo": "GitHub Repository",
    "model-leaderboard": "AI Leaderboard",
    "paper-card": "Research Paper",
    "tech-signal": "Tech Trends",
    "launch-tracker": "Space Launches",
    "apod": "Astronomy Picture",
    "iss-position": "ISS Position",
    "mission-status": "Mission Status",
  };

  const panelName = messages[panelId] || panelId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="p-4 text-center">
      <p className="text-sm text-slate-500">We could not find any data in {panelName}.</p>
      <p className="text-xs text-slate-400 mt-1">Check back later!</p>
    </div>
  );
}

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

  const validSections: ResolvedSection[] = sections.map((s) => {
    if (s.content === null) {
      return { ...s, content: <PanelEmptyFallback panelId={s.id} /> };
    }
    return s;
  }).filter((s) => {
    if (s.content === null) return false;
    return true;
  });

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
