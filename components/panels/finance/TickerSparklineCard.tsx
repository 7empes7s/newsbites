import { fetchFinanceDataForTicker, type FinanceTickerData } from "@/lib/panels/fetchers/finance";
import type { Article } from "@/lib/articles";
import { detectTickerFromArticle } from "@/lib/finance/tickers";

interface SparklineProps {
  data: number[];
  positive: boolean;
}

function MiniSparkline({ data, positive }: SparklineProps) {
  if (data.length < 2) return null;
  const W = 80;
  const H = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * (W - 8)},${H - ((v - min) / range) * (H - 8) - 4}`)
    .join(" ");
  const color = positive ? "#16a34a" : "#dc2626";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SignalBadge({ change }: { change: number }) {
  if (change >= 3) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Buy</span>;
  if (change <= -3) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium">Sell</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Hold</span>;
}

interface TickerCardProps {
  data: FinanceTickerData;
  name: string;
}

function TickerCard({ data, name }: TickerCardProps) {
  const isPositive = (data.changePercent ?? 0) >= 0;
  const formatPrice = (price: number | undefined) => {
    if (!price) return "—";
    if (price >= 1000) {
      return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(2);
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#1B2A4A] text-white">{data.symbol}</span>
          <span className="text-xs text-slate-500 truncate">{name}</span>
          <SignalBadge change={data.changePercent ?? 0} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#1B2A4A]">${formatPrice(data.price)}</span>
          <span className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {isPositive ? "▲" : "▼"} {Math.abs(data.changePercent ?? 0).toFixed(2)}%
          </span>
        </div>
      </div>
      {data.sparkline && data.sparkline.length >= 2 && <MiniSparkline data={data.sparkline} positive={isPositive} />}
    </div>
  );
}

export async function TickerSparklinePanel({ article }: { article: Article }) {
  const ticker = detectTickerFromArticle(article.title, article.content || "");
  if (!ticker) return null;

  const data = await fetchFinanceDataForTicker(ticker.symbol);
  if (!data) return null;

  return (
    <div className="ticker-sparkline-panel">
      <TickerCard data={data} name={ticker.name} />
    </div>
  );
}