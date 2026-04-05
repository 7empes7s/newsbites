export const verticals = ["ai", "finance", "global-politics", "trends"] as const;

export type Vertical = (typeof verticals)[number];

const verticalLabels: Record<Vertical, string> = {
  ai: "AI",
  finance: "Finance",
  "global-politics": "Global Politics",
  trends: "Trends",
};

export function getVerticalLabel(vertical: Vertical) {
  return verticalLabels[vertical];
}
