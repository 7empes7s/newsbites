"use client";

import { useState } from "react";
import { PanelTabBar } from "./PanelTabBar";
import type { ResolvedSection } from "@/lib/panels/types";
import type { Article } from "@/lib/articles";

interface Props {
  sections: ResolvedSection[];
  article: Article;
}

export function PanelDrawer({ sections, article }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(sections[0]?.section.id ?? "");

  if (sections.length === 0) return null;

  const activeSection = sections.find((s) => s.section.id === activeId) ?? sections[0];
  const ActiveComponent = activeSection.section.Component;

  return (
    <div
      className={`intel-drawer${open ? " intel-drawer--open" : ""}`}
      aria-label="Article intelligence panel"
    >
      {/* Handle bar */}
      <button
        className="intel-drawer-handle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="intel-drawer-body"
      >
        <span className="intel-drawer-handle-bar" />
        <span className="intel-drawer-handle-label">
          {sections.length === 1
            ? sections[0].section.title
            : `${sections.length} live data panels`}
        </span>
        <span className="intel-drawer-chevron" aria-hidden="true">
          {open ? "↓" : "↑"}
        </span>
      </button>

      {/* Body — visible when open */}
      <div id="intel-drawer-body" className="intel-drawer-body" hidden={!open}>
        <PanelTabBar
          tabs={sections.map((s) => ({
            id: s.section.id,
            title: s.section.title,
            icon: s.section.icon,
          }))}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <div className="intel-drawer-content">
          <ActiveComponent article={article} data={activeSection.data} />
        </div>
      </div>
    </div>
  );
}
