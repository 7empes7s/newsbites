export type Vertical = string;

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getVerticalLabel(vertical: Vertical) {
  return vertical ? titleCase(String(vertical)) : "Unknown";
}
