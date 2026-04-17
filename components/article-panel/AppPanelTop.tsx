"use client";

import { useEffect, useState } from "react";
import { PanelTabBar } from "./PanelTabBar";

type PanelSection = { id: string; html: string };

const PANEL_TITLES: Record<string, string> = {
  "fda-alerts": "FDA Alerts",
  "who-bulletin": "WHO News",
  "clinical-trials": "Clinical Trials",
  "co2-widget": "CO₂",
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

function getPanelTitle(id: string): string {
  return (
    PANEL_TITLES[id] ||
    id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
}

export function AppPanelTop({ slug }: { slug: string }) {
  const [sections, setSections] = useState<PanelSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSections([]);
    setOpen(false);

    fetch(`/panel-fragment/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.text() : ""))
      .then((html) => {
        if (!html || controller.signal.aborted) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        const next = Array.from(
          doc.querySelectorAll<HTMLElement>("[data-app-panel-id]"),
        )
          .map((node) => ({
            id: node.dataset.appPanelId ?? "",
            html: node.innerHTML,
          }))
          .filter((s) => s.id && s.html.trim());
        setSections(next);
        if (next[0]) setActiveId(next[0].id);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  if (!loading && sections.length === 0) return null;

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <div className={`nb-panel-top${open ? " nb-panel-top--open" : ""}`}>
      <button
        className="nb-panel-top-handle"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Collapse live data" : "Expand live data"}
      >
        {loading ? (
          <span className="nb-panel-top-label">Live data…</span>
        ) : (
          <>
            <span className="nb-panel-top-dots" aria-hidden="true">
              {sections.slice(0, 5).map((s) => (
                <span key={s.id} className="nb-panel-top-dot" />
              ))}
            </span>
            <span className="nb-panel-top-label">
              {sections.length === 1 ? "Live data" : `${sections.length} live panels`}
            </span>
          </>
        )}
        <span className="nb-panel-top-chevron" aria-hidden="true">
          {open ? "↑" : "↓"}
        </span>
      </button>

      {open && sections.length > 0 && (
        <div className="nb-panel-top-body">
          {sections.length > 1 && (
            <PanelTabBar
              tabs={sections.map((s) => ({ id: s.id, title: getPanelTitle(s.id) }))}
              activeId={activeId}
              onSelect={setActiveId}
            />
          )}
          {activeSection && (
            <div
              className="nb-panel-top-content"
              dangerouslySetInnerHTML={{ __html: activeSection.html }}
            />
          )}
        </div>
      )}
    </div>
  );
}
