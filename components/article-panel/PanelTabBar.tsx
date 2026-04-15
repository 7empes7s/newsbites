"use client";

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
  if (tabs.length <= 1) return null;

  return (
    <nav className="intel-panel-tabbar" aria-label="Panel sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`intel-panel-tab${activeId === tab.id ? " active" : ""}`}
          onClick={() => onSelect(tab.id)}
          aria-current={activeId === tab.id ? "true" : undefined}
          title={tab.title}
        >
          <span>{tab.title}</span>
        </button>
      ))}
    </nav>
  );
}
