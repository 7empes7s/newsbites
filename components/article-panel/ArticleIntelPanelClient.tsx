"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ResolvedPanelSection } from "@/lib/panels/resolve";
import { getPanelPrefs, toggleSectionHidden } from "@/lib/panel-prefs";
import { PanelDrawer } from "./PanelDrawer";
import { PanelSectionShell } from "./PanelSectionShell";
import { getPanelTitle } from "./panel-section-meta";

interface Props {
  sections: ResolvedPanelSection[];
  vertical: string;
}

function readInitialHiddenSections() {
  if (typeof window === "undefined") return [];
  return getPanelPrefs().hiddenSections ?? [];
}

export function ArticleIntelPanelClient({ sections, vertical }: Props) {
  const [hiddenIds, setHiddenIds] = useState<string[]>(readInitialHiddenSections);

  const visibleSections = useMemo(
    () => sections.filter((section) => !hiddenIds.includes(section.id)),
    [hiddenIds, sections],
  );

  const hiddenSections = useMemo(
    () =>
      sections
        .filter((section) => hiddenIds.includes(section.id))
        .map((section) => ({ id: section.id, title: getPanelTitle(section.id) })),
    [hiddenIds, sections],
  );

  const syncHiddenState = (sectionId: string) => {
    toggleSectionHidden(sectionId);
    setHiddenIds(getPanelPrefs().hiddenSections ?? []);
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <>
      <div className="intel-panel-desktop">
        {hiddenSections.length > 0 ? (
          <div className="panel-hidden-strip">
            <span className="panel-hidden-strip-label">Hidden sections</span>
            <div className="panel-hidden-strip-actions">
              {hiddenSections.map((section) => (
                <button
                  key={section.id}
                  className="panel-hidden-chip"
                  type="button"
                  onClick={() => syncHiddenState(section.id)}
                >
                  Show {section.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {visibleSections.map(({ id, content, cta }) => (
          <div key={id} className="intel-panel-section">
            <PanelSectionShell
              title={getPanelTitle(id)}
              canHide={visibleSections.length > 1}
              onHide={() => syncHiddenState(id)}
            >
              {content}
            </PanelSectionShell>
            {cta ? (
              <div className="panel-cta">
                <Link href={cta.href} className="panel-cta-link">
                  {cta.label}
                </Link>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <PanelDrawer
        hiddenSections={hiddenSections}
        onHideSection={visibleSections.length > 1 ? syncHiddenState : undefined}
        onRestoreSection={syncHiddenState}
        sections={visibleSections}
        vertical={vertical}
      />
    </>
  );
}
