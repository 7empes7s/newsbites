"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HistoricalData {
  date: string;
  price: number;
  volume?: number;
}

type RangeKey = '1W' | '1M' | '3M' | 'YTD' | '1Y';

const RANGES: RangeKey[] = ['1W', '1M', '3M', 'YTD', '1Y'];

interface TickerChartProps {
  symbol: string;
  title: string;
  articles: { title: string; slug: string }[];
  signal?: 'buy' | 'hold' | 'sell' | 'neutral';
}

async function fetchHistory(symbol: string, range: RangeKey): Promise<HistoricalData[]> {
  const res = await fetch(`/api/finance/history?symbol=${encodeURIComponent(symbol)}&range=${range}`);
  if (!res.ok) return [];
  return res.json();
}

const SIGNAL_COLORS = {
  buy: 'bg-emerald-500 text-white',
  hold: 'bg-amber-500 text-white',
  sell: 'bg-rose-500 text-white',
  neutral: 'bg-slate-400 text-white',
};

// Native SVG chart — no external dependencies, React 19 compatible
function PriceChart({ data, positive }: { data: HistoricalData[]; positive: boolean }) {
  if (data.length < 2) return null;

  const W = 400;
  const CHART_H = 100;
  const VOL_H = 24;
  const PAD = 6;
  const TOTAL_H = CHART_H + VOL_H + 4;

  const prices = data.map(d => d.price);
  const vols = data.map(d => d.volume ?? 0);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const maxVol = Math.max(...vols) || 1;

  const toX = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const toY = (p: number) => PAD + (1 - (p - minP) / range) * (CHART_H - PAD * 2);

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.price) }));
  let linePath = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    linePath += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  const last = points[points.length - 1];
  const fillPath = linePath + ` L ${last.x},${CHART_H} L ${points[0].x},${CHART_H} Z`;

  const strokeColor = positive ? '#16a34a' : '#dc2626';
  const fillId = `sf-${symbol}-${positive ? 'up' : 'dn'}`;
  const barWidth = Math.max(1, (W - PAD * 2) / data.length - 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${TOTAL_H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: `${TOTAL_H * 0.65}px` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Price fill */}
      <path d={fillPath} fill={`url(#${fillId})`} />
      {/* Price line */}
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Terminal dot */}
      <circle cx={last.x} cy={last.y} r="2.5" fill={strokeColor} />
      {/* Volume bars */}
      {data.map((d, i) => {
        const bx = toX(i) - barWidth / 2;
        const bh = (d.volume ?? 0) / maxVol * (VOL_H - 2);
        const by = CHART_H + 4 + (VOL_H - 2 - bh);
        return (
          <rect
            key={i}
            x={bx}
            y={by}
            width={barWidth}
            height={bh}
            fill={strokeColor}
            opacity="0.35"
          />
        );
      })}
    </svg>
  );
}

// Need symbol in scope for fillId uniqueness — hoist it
let symbol = '';

export function TickerChart({ symbol: sym, title, articles, signal }: TickerChartProps) {
  symbol = sym;
  const [range, setRange] = useState<RangeKey>('1M');
  const [data, setData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchHistory(sym, range).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [sym, range]);

  const displayArticles = articles.slice(0, 3);
  const extraCount = articles.length - 3;

  const validData = data.filter(d => typeof d.price === 'number' && !isNaN(d.price) && d.price > 0);
  const hasData = validData.length >= 2;

  const latestVal = hasData ? validData[validData.length - 1].price : 0;
  const firstVal = hasData ? validData[0].price : latestVal;
  const changeVal = hasData && firstVal > 0 ? ((latestVal - firstVal) / firstVal * 100) : 0;
  const isPositive = changeVal >= 0;

  const formatPrice = (v: number) =>
    v >= 1000
      ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : v.toFixed(2);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{sym}</p>
            <p className="text-sm font-semibold text-[#1B2A4A]">{title}</p>
          </div>
          {signal && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${SIGNAL_COLORS[signal]}`}>
              {signal}
            </span>
          )}
        </div>

        {hasData && (
          <div className="text-right">
            <div className="font-semibold text-[#1B2A4A] text-sm">${formatPrice(latestVal)}</div>
            <div className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(changeVal).toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* Range selector */}
      <div className="flex gap-1 px-4 pt-3">
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              range === r
                ? 'bg-[#1B2A4A] text-white'
                : 'text-slate-400 hover:text-[#1B2A4A]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="px-4 pt-2 pb-2">
        {loading ? (
          <div className="h-28 flex items-center justify-center text-slate-400 text-sm">
            <span className="animate-pulse">Loading…</span>
          </div>
        ) : hasData ? (
          <PriceChart data={validData} positive={isPositive} />
        ) : (
          <div className="h-28 flex items-center justify-center text-slate-400 text-sm">
            No data available
          </div>
        )}
      </div>

      {/* Date range label */}
      {hasData && (
        <div className="px-4 pb-2 flex justify-between text-xs text-slate-400">
          <span>{validData[0].date}</span>
          <span>{validData[validData.length - 1].date}</span>
        </div>
      )}

      {/* Related articles */}
      {displayArticles.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500 mb-2">Related articles:</p>
          <ul className="space-y-1.5">
            {displayArticles.map((article, idx) => (
              <li key={article.slug}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="text-xs text-[#1B2A4A] hover:text-[#F5A623] hover:underline line-clamp-1 block"
                >
                  {idx + 1}. {article.title}
                </Link>
              </li>
            ))}
            {extraCount > 0 && (
              <li className="text-xs text-slate-400 italic">… and {extraCount} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
