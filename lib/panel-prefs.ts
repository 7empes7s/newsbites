export type PanelPrefs = {
  defaultExpanded?: boolean;
  hiddenSections?: string[];
  pinnedTab?: Record<string, string>;
};

const STORAGE_KEY = "newsbites-panel-prefs";

export function getPanelPrefs(): PanelPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function setPanelPrefs(prefs: Partial<PanelPrefs>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getPanelPrefs();
    const merged = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

export function isSectionHidden(sectionId: string): boolean {
  const prefs = getPanelPrefs();
  return (prefs.hiddenSections ?? []).includes(sectionId);
}

export function toggleSectionHidden(sectionId: string): void {
  const prefs = getPanelPrefs();
  const hidden = prefs.hiddenSections ?? [];
  if (hidden.includes(sectionId)) {
    setPanelPrefs({ hiddenSections: hidden.filter(id => id !== sectionId) });
  } else {
    setPanelPrefs({ hiddenSections: [...hidden, sectionId] });
  }
}

export function getPinnedTab(vertical: string): string | undefined {
  const prefs = getPanelPrefs();
  return prefs.pinnedTab?.[vertical];
}

export function setPinnedTab(vertical: string, tabId: string): void {
  const prefs = getPanelPrefs();
  setPanelPrefs({ pinnedTab: { ...(prefs.pinnedTab ?? {}), [vertical]: tabId } });
}