import type { Article } from "@/lib/articles";
import { detectCountryCodes, fetchTradeData } from "@/lib/panels/fetchers/world";

interface TradeData {
  indicator: { id: string; value: number; date: string };
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatGDP(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

interface TradeCardProps {
  countryCode: string;
  data: unknown;
  countryName?: string;
}

function TradeCard({ countryCode, data }: TradeCardProps) {
  if (!data || !Array.isArray(data) || data.length < 2) return null;

  const recent = data[1];
  const tradeToGDP = recent?.value;

  if (tradeToGDP === null || tradeToGDP === undefined) return null;

  const isHigh = tradeToGDP > 50;
  const isMedium = tradeToGDP > 30;

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <div className="text-xs font-medium text-slate-600 mb-2">{countryCode}</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-[#1B2A4A]">{formatPercent(tradeToGDP)}</div>
          <div className="text-[10px] text-slate-500">Trade as % of GDP</div>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${isHigh ? "bg-emerald-100 text-emerald-700" : isMedium ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
          {isHigh ? "High Openness" : isMedium ? "Moderate" : "Closed"}
        </div>
      </div>
    </div>
  );
}

export async function TradeDataPanel({ article }: { article: Article }) {
  const { tags = [], panel_hints } = article;
  const countryCodes = detectCountryCodes(tags, panel_hints);

  if (countryCodes.length === 0) return null;

  const hasTradeTag = tags.some((t) => ["trade", "tariffs", "sanctions", "economy", "economy"].includes(t.toLowerCase()));
  if (!hasTradeTag) return null;

  const tradeData = await Promise.all(
    countryCodes.map(async (code) => {
      const data = await fetchTradeData(code);
      return { code, data };
    })
  );

  const validData = tradeData.filter((t) => t.data && Array.isArray(t.data) && t.data.length >= 2);

  if (validData.length === 0) return null;

  return (
    <div className="trade-data-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Trade Data</h3>
      <div className="space-y-2">
        {validData.map(({ code, data }) => (
          <TradeCard key={code} countryCode={code} data={data} />
        ))}
      </div>
    </div>
  );
}