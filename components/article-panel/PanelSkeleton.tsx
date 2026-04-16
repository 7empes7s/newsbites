import type { ReactNode } from "react";

type SkeletonType = "standings" | "sparkline" | "pronostic" | "default";

function getSectionType(id: string): SkeletonType {
  if (id.includes("standings") || id.includes("nba") || id.includes("f1")) return "standings";
  if (id.includes("sparkline") || id.includes("ticker") || id.includes("finance") || id.includes("market") || id.includes("macro") || id.includes("crypto")) return "sparkline";
  if (id.includes("pronostic")) return "pronostic";
  return "default";
}

export function PanelSkeleton({ sectionId }: { sectionId?: string }) {
  const type = sectionId ? getSectionType(sectionId) : "default";

  if (type === "standings") {
    return (
      <div className="intel-panel-skeleton standings-skeleton" aria-hidden="true">
        <div className="intel-panel-skeleton-line short" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="intel-panel-skeleton-row">
            <div className="intel-panel-skeleton-line short" />
            <div className="intel-panel-skeleton-line medium" />
            <div className="intel-panel-skeleton-line short" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "sparkline") {
    return (
      <div className="intel-panel-skeleton sparkline-skeleton" aria-hidden="true">
        <div className="intel-panel-skeleton-line short" />
        <div className="intel-panel-skeleton-block" />
        <div className="intel-panel-skeleton-line medium" />
        <div className="intel-panel-skeleton-line" />
      </div>
    );
  }

  if (type === "pronostic") {
    return (
      <div className="intel-panel-skeleton pronostic-skeleton" aria-hidden="true">
        <div className="intel-panel-skeleton-line short" />
        {[1, 2, 3].map(i => (
          <div key={i} className="intel-panel-skeleton-bar">
            <div className="intel-panel-skeleton-label" />
            <div className="intel-panel-skeleton-track" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="intel-panel-skeleton" aria-hidden="true">
      <div className="intel-panel-skeleton-line short" />
      <div className="intel-panel-skeleton-line" />
      <div className="intel-panel-skeleton-line medium" />
    </div>
  );
}

export function PanelSectionSkeleton({ id }: { id: string }) {
  return <PanelSkeleton sectionId={id} />;
}