"use client";

import { useState } from "react";
import { PanelTabBar } from "./PanelTabBar";
import type { Article } from "@/lib/articles";

interface ResolvedSection {
  id: string;
  content: React.ReactNode;
  priority: number;
}

interface Props {
  sections: ResolvedSection[];
  article: Article;
}

export function PanelDrawer({ sections, article: _article }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  if (sections.length === 0) return null;

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];

  const getPanelTitle = (id: string): string => {
    const titles: Record<string, string> = {
      "fda-alerts": "FDA Alerts",
      "who-bulletin": "WHO News",
      "clinical-trials": "Clinical Trials",
      "co2-widget": "CO₂ Level",
      "temp-anomaly": "Temperature",
      "renewable-capacity": "Renewables",
      "sports-standings": "Standings",
      "sports-fixtures": "Fixtures",
      "sports-pronostic": "Prediction",
      "sports-home-team": "Home Team",
      "sports-away-team": "Away Team",
      "sports-route-to-final": "Knockout",
      "finance-overview": "Finance",
      "finance-sparkline": "Ticker",
      "macro-indicators": "Macro",
      "crypto-panel": "Crypto",
      "country-profile": "Country",
      "conflict-timeline": "Conflict",
      "election-calendar": "Elections",
      "trade-data": "Trade",
      "github-repo": "GitHub",
      "model-leaderboard": "Models",
      "paper-card": "Paper",
      "tech-signal": "Tech Signal",
      "launch-tracker": "Launches",
      "apod": "Astronomy",
      "iss-position": "ISS",
      "mission-status": "Mission",
    };
    return titles[id] || id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div
      className={`intel-drawer${open ? " intel-drawer--open" : ""}`}
      aria-label="Article intelligence panel"
    >
      <button
        className="intel-drawer-handle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="intel-drawer-body"
      >
        <span className="intel-drawer-handle-bar" />
        <span className="intel-drawer-handle-label">
          {sections.length === 1
            ? "Live Data"
            : `${sections.length} live data panels`}
        </span>
        <span className="intel-drawer-chevron" aria-hidden="true">
          {open ? "↓" : "↑"}
        </span>
      </button>

      <div id="intel-drawer-body" className="intel-drawer-body" hidden={!open}>
        <PanelTabBar
          tabs={sections.map((s) => ({
            id: s.id,
            title: getPanelTitle(s.id),
          }))}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <div className="intel-drawer-content">
          {activeSection?.content}
        </div>
      </div>
    </div>
  );
}
