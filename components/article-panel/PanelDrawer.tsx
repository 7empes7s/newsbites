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

export function PanelDrawer({ sections, article }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  if (sections.length === 0) return null;

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];

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
            title: "Panel",
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
