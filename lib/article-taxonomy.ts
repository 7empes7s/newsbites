export type Vertical = string;

export type Group =
  | "tech"
  | "finance"
  | "world"
  | "science"
  | "wellness"
  | "culture";

const VERTICAL_LABELS: Record<string, string> = {
  ai: "AI",
  tcm: "TCM",
  "global-politics": "Global Politics",
};

export const GROUP_ORDER: Group[] = [
  "tech",
  "finance",
  "world",
  "science",
  "wellness",
  "culture",
];

export const GROUP_LABELS: Record<Group, string> = {
  tech: "Tech",
  finance: "Finance",
  world: "World",
  science: "Science",
  wellness: "Wellness",
  culture: "Culture",
};

export const VERTICAL_TO_GROUP: Record<string, Group> = {
  ai: "tech",
  trends: "tech",
  cybersecurity: "tech",
  finance: "finance",
  economy: "finance",
  crypto: "finance",
  "global-politics": "world",
  space: "science",
  healthcare: "science",
  energy: "science",
  climate: "science",
  tcm: "wellness",
  skincare: "wellness",
  anime: "culture",
  gaming: "culture",
  sports: "culture",
};

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getVerticalLabel(vertical: Vertical) {
  const normalized = String(vertical || "").trim().toLowerCase();

  if (!normalized) {
    return "Unknown";
  }

  return VERTICAL_LABELS[normalized] ?? titleCase(normalized);
}

export function getGroupForVertical(vertical: Vertical): Group | undefined {
  const normalized = String(vertical || "").trim().toLowerCase();
  if (!normalized) return undefined;
  return VERTICAL_TO_GROUP[normalized];
}

export function getGroupLabel(group: Group): string {
  return GROUP_LABELS[group] ?? titleCase(group);
}

export function isGroup(value: string): value is Group {
  return (GROUP_ORDER as string[]).includes(value);
}
