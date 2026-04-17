"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PanelTabBar } from "./PanelTabBar";
import { getPanelPrefs, setPanelPrefs, setPinnedTab } from "@/lib/panel-prefs";
import { PanelSectionShell } from "./PanelSectionShell";
import { getPanelTitle } from "./panel-section-meta";

interface ResolvedSection {
  id: string;
  content: React.ReactNode;
  priority: number;
}

const COLLAPSED_HEIGHT = 56;
const EXPANDED_VH = 0.85;

interface Props {
  sections: ResolvedSection[];
  vertical?: string;
  hiddenSections?: { id: string; title: string }[];
  onHideSection?: (id: string) => void;
  onRestoreSection?: (id: string) => void;
}

export function PanelDrawer({
  sections,
  initialPanelId,
  vertical = "general",
  hiddenSections = [],
  onHideSection,
  onRestoreSection,
}: Props & { initialPanelId?: string }) {
  const searchParams = useSearchParams();
  const deepLinkPanel = initialPanelId || searchParams.get("panel") || "";

  const savedPrefs = typeof window !== "undefined" ? getPanelPrefs() : {};
  const pinnedTab = savedPrefs.pinnedTab?.[vertical];

  const defaultActive = deepLinkPanel && sections.some(s => s.id === deepLinkPanel)
    ? deepLinkPanel
    : (pinnedTab && sections.some(s => s.id === pinnedTab) ? pinnedTab : (sections[0]?.id ?? ""));

  const [open, setOpenState] = useState(!!deepLinkPanel || (pinnedTab === undefined && savedPrefs.defaultExpanded));
  const [activeId, setActiveId] = useState(defaultActive);
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [expandedHeight, setExpandedHeight] = useState(500);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef(vertical);

  useEffect(() => {
    setExpandedHeight(window.innerHeight * EXPANDED_VH);
  }, []);

  useEffect(() => {
    if (!sections.some((section) => section.id === activeId)) {
      setActiveId(sections[0]?.id ?? "");
    }
  }, [activeId, sections]);

  const setOpen = useCallback((nextOpen: boolean) => {
    setOpenState(nextOpen);
    setPanelPrefs({ defaultExpanded: nextOpen });
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
          onClick={() => !dragging && setOpen(!open)}
          aria-expanded={open}
          aria-controls="intel-drawer-body"
        >
          <span className="intel-drawer-handle-bar" />
          <span className="intel-drawer-handle-label">
            {sections.length === 1
              ? "Live Data"
              : `${sections.length} live data panels`}
          </span>
          {open && activeId && (
            <button
              className="intel-drawer-share"
              type="button"
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
            tabs={sections.map((s) => ({
              id: s.id,
              title: getPanelTitle(s.id),
            }))}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id);
              setPinnedTab(verticalRef.current, id);
            }}
          />
          {hiddenSections.length > 0 ? (
            <div className="panel-hidden-strip panel-hidden-strip-mobile">
              <span className="panel-hidden-strip-label">Hidden sections</span>
              <div className="panel-hidden-strip-actions">
                {hiddenSections.map((section) => (
                  <button
                    key={section.id}
                    className="panel-hidden-chip"
                    type="button"
                    onClick={() => onRestoreSection?.(section.id)}
                  >
                    Show {section.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="intel-drawer-content">
            {activeSection ? (
              <PanelSectionShell
                title={getPanelTitle(activeSection.id)}
                canHide={Boolean(onHideSection) && sections.length > 1}
                onHide={
                  onHideSection
                    ? () => onHideSection(activeSection.id)
                    : undefined
                }
              >
                {activeSection.content}
              </PanelSectionShell>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
