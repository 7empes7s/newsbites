import { fetchAllMacroIndicators } from "@/lib/panels/fetchers/fred";
import type { Article } from "@/lib/articles";

function IndicatorChip({
  label,
  value,
  direction,
}: {
  label: string;
  value: string;
  direction: "up" | "down" | "flat";
}) {
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "→";
  const colorClass =
    direction === "up"
      ? "text-emerald-600"
      : direction === "down"
      ? "text-rose-600"
      : "text-slate-400";

  return (
    <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold text-[#1B2A4A]">{value}</span>
        <span className={`text-xs ${colorClass}`}>{arrow}</span>
      </div>
    </div>
  );
}

export async function MacroIndicatorPanel({ article: _article }: { article: Article }) {
  const indicators = await fetchAllMacroIndicators();
  const entries = Object.entries(indicators);

  if (entries.length === 0) return null;

  return (
    <div className="macro-indicator-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Macro Indicators</h3>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, { name, value, direction }]) => {
          let displayValue: string;
          if (key === "FEDFUNDS" || key === "UNRATE") {
            displayValue = `${value.toFixed(1)}%`;
          } else if (key === "CPIAUCSL") {
            displayValue = `${value.toFixed(1)}%`;
          } else {
            displayValue = value.toFixed(2);
          }
          return <IndicatorChip key={key} label={name} value={displayValue} direction={direction} />;
        })}
      </div>
    </div>
  );
}