import Link from "next/link";
import { getArticleTickers, type TickerMapping } from "@/lib/finance/tickers";
import { fetchFinanceDataForTicker, type FinanceTickerData } from "@/lib/panels/fetchers/finance";
import type { Article } from "@/lib/articles";
import { SubscribedTickerStrip } from "./SubscribedTickerStrip";

function SparklineMini({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const W = 80;
  const H = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * (W - 10)},${H - ((v - min) / range) * (H - 8) - 4}`)
    .join(" ");
  const color = positive ? "#16a34a" : "#dc2626";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TickerCard({ data, label }: { data: FinanceTickerData; label: string }) {
  const isPositive = (data.changePercent ?? 0) >= 0;
  const formatPrice = (price: number | undefined) => {
    if (!price) return "—";
    if (price >= 1000) {
      return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(2);
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold text-[#1B2A4A]">{data.symbol}</span>
          <span className="text-xs text-slate-500 truncate">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#1B2A4A]">${formatPrice(data.price)}</span>
          <span className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {isPositive ? "▲" : "▼"} {Math.abs(data.changePercent ?? 0).toFixed(2)}%
          </span>
        </div>
      </div>
      {data.sparkline && data.sparkline.length >= 2 && <SparklineMini data={data.sparkline} positive={isPositive} />}
    </div>
  );
}

function formatVolume(vol: number | undefined) {
  if (!vol || vol === 0) return "0";
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return vol.toString();
}

const SYMBOL_LABELS: Record<string, string> = {
  SPY: "S&P 500",
  "EURUSD=X": "EUR/USD",
  "GC=F": "Gold",
  "BTC-USD": "Bitcoin",
  "ETH-USD": "Ethereum",
  NVDA: "NVIDIA",
  MSFT: "Microsoft",
  GOOGL: "Alphabet",
  AMZN: "Amazon",
  TSLA: "Tesla",
  META: "Meta",
  AAPL: "Apple",
  AMD: "AMD",
};

function MarketOverview() {
  const indices = ["SPY", "EURUSD=X", "GC=F"];
  return (
    <div className="space-y-2">
      {indices.map((symbol) => (
        <IndexCard key={symbol} symbol={symbol} />
      ))}
    </div>
  );
}

async function IndexCard({ symbol }: { symbol: string }) {
  const data = await fetchFinanceDataForTicker(symbol);
  if (!data || !data.price) return null;
  const isPositive = (data.changePercent ?? 0) >= 0;
  return (
    <div className="flex items-center justify-between p-2 rounded border border-slate-100">
      <div>
        <span className="text-xs font-medium text-slate-600">{SYMBOL_LABELS[symbol] || symbol}</span>
        <div className="text-sm font-semibold text-[#1B2A4A]">
          ${data.price >= 1000 ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : data.price.toFixed(2)}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
          {isPositive ? "▲" : "▼"} {Math.abs(data.changePercent ?? 0).toFixed(2)}%
        </div>
        <div className="text-xs text-slate-400">Vol: {formatVolume(data.volume)}</div>
      </div>
    </div>
  );
}

export async function FinancePanel({ article }: { article: Article }) {
  const tickers = getArticleTickers(
    article.title,
    article.content || "",
    article.panel_hints?.tickers || [],
  );
  const primaryTicker = tickers[0] ?? null;

  return (
    <div className="finance-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Market Overview</h3>

      <SubscribedTickerStrip />

      {primaryTicker ? <TickerCardWithData ticker={primaryTicker} /> : null}

      <MarketOverview />

      {primaryTicker ? (
        <Link
          href={`/finance/charts?ticker=${primaryTicker.symbol}`}
          className="block mt-3 text-xs text-center text-[#F5A623] hover:underline"
        >
          View full {primaryTicker.name} analysis →
        </Link>
      ) : null}
    </div>
  );
}

async function TickerCardWithData({ ticker }: { ticker: TickerMapping | null }) {
  if (!ticker) return null;
  const data = await fetchFinanceDataForTicker(ticker.symbol);
  if (!data) return null;
  return <TickerCard data={data} label={ticker.name} />;
}
