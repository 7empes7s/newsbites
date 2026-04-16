"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PanelTabBar } from "./PanelTabBar";
import type { Article } from "@/lib/articles";

interface ResolvedSection {
  id: string;
  content: React.ReactNode;
  priority: number;
}

const COLLAPSED_HEIGHT = 56;
const EXPANDED_VH = 0.85;

const PANEL_NAMES: Record<string, string> = {
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
  "nba-standings": "NBA Standings",
  "f1-race": "F1 Race",
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
  "cross-vertical-ticker": "Market Ticker",
  "cross-vertical-github": "Repository",
  "tag-ticker": "Market Ticker",
  "tag-launch": "Space Launches",
};

function isEmptyFallback(content: React.ReactNode): boolean {
  if (!content) return true;
  if (typeof content === "object" && "type" in content) {
    const c = content as { type?: { name?: string } };
    return c.type?.name === "PanelEmptyFallback";
  }
  return false;
}

function PanelEmptyFallback({ panelId }: { panelId: string }) {
  const panelName = PANEL_NAMES[panelId] || panelId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return (
    <div className="p-4 text-center">
      <p className="text-sm text-slate-500">We could not find any data in {panelName}.</p>
      <p className="text-xs text-slate-400 mt-1">Check back later!</p>
    </div>
  );
}

interface Props {
  sections: ResolvedSection[];
  article: Article;
}

export function PanelDrawer({ sections, article: _article, initialPanelId }: Props & { initialPanelId?: string }) {
  const searchParams = useSearchParams();
  const deepLinkPanel = initialPanelId || searchParams.get("panel") || "";
  const [open, setOpen] = useState(!!deepLinkPanel);
  const [activeId, setActiveId] = useState(deepLinkPanel && sections.some(s => s.id === deepLinkPanel) ? deepLinkPanel : (sections[0]?.id ?? ""));
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [expandedHeight, setExpandedHeight] = useState(500);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpandedHeight(window.innerHeight * EXPANDED_VH);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientY - startYRef.current;
    setDragY(delta);
  }, [dragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    const delta = e.clientY - startYRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    const velocity = Math.abs(delta) / elapsed;

    if (velocity > 0.3) {
      setOpen(delta < 0);
    } else {
      const threshold = expandedHeight * 0.3;
      if (open) setOpen(Math.abs(delta) < threshold);
      else setOpen(delta < -threshold);
    }
    setDragY(0);
  }, [dragging, open, expandedHeight]);

  if (sections.length === 0) return null;

  const currentHeight = open
    ? expandedHeight - Math.max(0, dragY)
    : COLLAPSED_HEIGHT - Math.min(0, dragY);

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];
  const activeIsEmpty = activeSection && isEmptyFallback(activeSection.content);

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

  const validTabs = sections.filter((s) => !isEmptyFallback(s.content));
  const showAllTab = validTabs.length === 0;

  return (
    <>
      {open && (
        <div
          ref={overlayRef}
          className="intel-drawer-overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`intel-drawer${open ? " intel-drawer--open" : ""}`}
        aria-label="Article intelligence panel"
        style={{
          height: `${Math.max(COLLAPSED_HEIGHT, Math.min(expandedHeight, currentHeight))}px`,
          transition: dragging ? "none" : "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <button
          className="intel-drawer-handle"
          onClick={() => !dragging && setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="intel-drawer-body"
        >
          <span className="intel-drawer-handle-bar" />
          <span className="intel-drawer-handle-label">
            {showAllTab
              ? "No Data"
              : sections.length === 1
                ? "Live Data"
                : `${sections.length} live data panels`}
          </span>
          {open && activeId && (
            <button
              className="intel-drawer-share"
              onClick={(e) => {
                e.stopPropagation();
                const url = new URL(window.location.href);
                url.searchParams.set("panel", activeId);
                navigator.clipboard.writeText(url.toString()).catch(() => {});
              }}
              title="Share this analysis"
            >
              ⤳
            </button>
          )}
          <span className="intel-drawer-chevron" aria-hidden="true">
            {open ? "↓" : "↑"}
          </span>
        </button>

        <div id="intel-drawer-body" className="intel-drawer-body" hidden={!open}>
          <PanelTabBar
            tabs={showAllTab ? [{ id: "empty", title: "No Data" }] : sections.map((s) => ({
              id: s.id,
              title: getPanelTitle(s.id),
            }))}
            activeId={showAllTab ? "empty" : activeId}
            onSelect={showAllTab ? () => {} : setActiveId}
          />
          <div className="intel-drawer-content">
            {showAllTab ? (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-500">No live data available for this article.</p>
                <p className="text-xs text-slate-400 mt-1">Check back later!</p>
              </div>
            ) : activeIsEmpty ? (
              <PanelEmptyFallback panelId={activeSection.id} />
            ) : (
              activeSection?.content
            )}
          </div>
        </div>
      </div>
    </>
  );
}
