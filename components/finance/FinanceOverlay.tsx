"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MarketData {
  price: number;
  change: number;
  changePercent: number;
}

interface FinanceOverlayProps {
  ticker: string;
  tickerLabel: string;
}

function MiniSparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (prices.length < 2) return null;
  const W = 80;
  const H = 28;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const toX = (i: number) => (i / (prices.length - 1)) * W;
  const toY = (p: number) => H - (((p - min) / range) * H * 0.8 + H * 0.1);
  let d = `M ${toX(0)},${toY(prices[0])}`;
  for (let i = 1; i < prices.length; i++) {
    d += ` L ${toX(i)},${toY(prices[i])}`;
  }
  const color = positive ? '#16a34a' : '#dc2626';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-7" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FinanceOverlay({ ticker, tickerLabel }: FinanceOverlayProps) {
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [prices, setPrices] = useState<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [mktRes, histRes] = await Promise.all([
          fetch(`/api/finance/market?symbols=${ticker}`),
          fetch(`/api/finance/history?symbol=${ticker}&range=1W`),
        ]);

        if (mktRes.ok) {
          const mktData = await mktRes.json();
          const entry = Array.isArray(mktData) ? mktData[0] : mktData[ticker];
          if (entry) {
            setMarket({
              price: entry.price ?? entry.regularMarketPrice ?? 0,
              change: entry.change ?? entry.regularMarketChange ?? 0,
              changePercent: entry.changePercent ?? entry.regularMarketChangePercent ?? 0,
            });
          }
        }

        if (histRes.ok) {
          const hist = await histRes.json();
          setPrices((hist as { price: number }[]).map(d => d.price).filter(Boolean));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticker]);

  if (loading || !isMounted) {
    return (
      <div className="my-6 flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 animate-pulse">
        <div className="h-4 w-16 bg-slate-200 rounded" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
    );
  }

  if (!market) {
    return null;
  }

  const isPositive = market.changePercent >= 0;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(2);
  };

  return (
    <div className="my-6 flex items-center gap-4 flex-wrap p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      <span className="px-2 py-1 rounded-md text-xs font-mono font-bold bg-[#1B2A4A] text-white shrink-0">
        {ticker}
      </span>
      <span className="text-sm font-medium text-[#1B2A4A] shrink-0">{tickerLabel}</span>
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="font-semibold text-[#1B2A4A]">${formatPrice(market.price)}</span>
        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(market.changePercent).toFixed(2)}%
        </span>
      </div>
      {prices.length >= 2 && (
        <div className="shrink-0">
          <MiniSparkline prices={prices} positive={isPositive} />
        </div>
      )}
      <Link
        href={`/finance/charts?ticker=${ticker}`}
        className="ml-auto text-xs font-medium text-[#F5A623] hover:underline shrink-0"
      >
        Full analysis →
      </Link>
    </div>
  );
}