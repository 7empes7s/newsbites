"use client";

import { useRef, useEffect } from "react";

interface Tab {
  id: string;
  title: string;
}

interface Props {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function PanelTabBar({ tabs, activeId, onSelect }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current?.querySelector(`[data-tab="${activeId}"]`) as HTMLElement;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  if (tabs.length <= 1) return null;

  return (
    <nav ref={barRef} className="intel-panel-tabbar" aria-label="Panel sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          className={`intel-panel-tab${activeId === tab.id ? " active" : ""}`}
          onClick={() => onSelect(tab.id)}
          aria-selected={activeId === tab.id ? "true" : undefined}
          title={tab.title}
        >
          <span>{tab.title}</span>
        </button>
      ))}
    </nav>
  );
}
