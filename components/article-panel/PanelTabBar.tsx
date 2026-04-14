"use client";

import type { LucideIcon } from "lucide-react";

interface Tab {
  id: string;
  title: string;
  icon: LucideIcon;
}

interface Props {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function PanelTabBar({ tabs, activeId, onSelect }: Props) {
  if (tabs.length <= 1) return null;

  return (
    <nav className="intel-panel-tabbar" aria-label="Panel sections">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`intel-panel-tab${activeId === tab.id ? " active" : ""}`}
            onClick={() => onSelect(tab.id)}
            aria-current={activeId === tab.id ? "true" : undefined}
            title={tab.title}
          >
            <Icon size={14} />
            <span>{tab.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
