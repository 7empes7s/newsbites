import type { Article } from "@/lib/articles";
import { fetchFinanceDataForTicker } from "@/lib/panels/fetchers/finance";

interface FearGreedData {
  value: number;
  classification: string;
}

async function fetchFearGreed(): Promise<FearGreedData | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/", { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;
    const latest = data.data[0];
    return {
      value: parseInt(latest.value, 10),
      classification: latest.value_classification,
    };
  } catch {
    return null;
  }
}

async function fetchCryptoDominance(): Promise<{ btc: number; eth: number } | null> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const { btc_dominance, eth_dominance } = data.data || {};
    return { btc: btc_dominance, eth: eth_dominance };
  } catch {
    return null;
  }
}

function FearGreedGauge({ data }: { data: FearGreedData }) {
  const { value, classification } = data;
  const getColor = (v: number) => {
    if (v <= 25) return "bg-red-500";
    if (v <= 45) return "bg-orange-500";
    if (v <= 55) return "bg-yellow-500";
    if (v <= 75) return "bg-lime-500";
    return "bg-green-500";
  };
  return (
    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
      <div className="text-xs text-slate-500 mb-2">Fear & Greed Index</div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${getColor(value)}`} style={{ width: `${value}%` }} />
        </div>
        <div className="text-sm font-bold text-[#1B2A4A]">{value}</div>
      </div>
      <div className="text-xs text-slate-600 mt-1">{classification}</div>
    </div>
  );
}

interface CryptoPriceProps {
  symbol: string;
  name: string;
  data: Awaited<ReturnType<typeof fetchFinanceDataForTicker>>;
}

function CryptoPrice({ symbol, name, data }: CryptoPriceProps) {
  if (!data || !data.price) return null;
  const isPositive = (data.changePercent ?? 0) >= 0;
  return (
    <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100">
      <div>
        <span className="text-xs font-bold text-[#1B2A4A]">{symbol}</span>
        <span className="text-xs text-slate-500 ml-1">({name})</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-[#1B2A4A]">
          ${data.price >= 1000 ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : data.price.toFixed(2)}
        </div>
        <div className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
          {isPositive ? "▲" : "▼"} {Math.abs(data.changePercent ?? 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function DominanceRow({ data }: { data: { btc?: number; eth?: number } | null }) {
  if (!data || !data.btc) return null;
  return (
    <div className="flex items-center justify-between text-xs p-2 rounded-lg border border-slate-100 bg-slate-50">
      <span className="text-slate-500">BTC dominance</span>
      <span className="font-medium text-[#1B2A4A]">{data.btc.toFixed(1)}%</span>
    </div>
  );
}

export async function CryptoPanel({ article: _article }: { article: Article }) {
  const [btcData, ethData, fearGreed, dominance] = await Promise.all([
    fetchFinanceDataForTicker("BTC-USD"),
    fetchFinanceDataForTicker("ETH-USD"),
    fetchFearGreed(),
    fetchCryptoDominance(),
  ]);

  if (!btcData && !ethData && !fearGreed && !dominance) return null;

  return (
    <div className="crypto-panel">
      <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">Crypto Markets</h3>
      <div className="space-y-2">
        <CryptoPrice symbol="BTC" name="Bitcoin" data={btcData} />
        <CryptoPrice symbol="ETH" name="Ethereum" data={ethData} />
        {fearGreed && <FearGreedGauge data={fearGreed} />}
        {dominance && <DominanceRow data={dominance} />}
      </div>
    </div>
  );
}