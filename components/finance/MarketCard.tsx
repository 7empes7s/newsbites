import React from 'react';

interface MarketCardProps {
  data: {
    symbol: string;
    price: number;
    changePercent: number;
    volume: number;
    lastUpdated: string;
  };
}

export function MarketCard({ data }: MarketCardProps) {
  const isPositive = data.changePercent >= 0;
  
  const symbolLabels: Record<string, string> = {
    'SPY': 'S&P 500',
    'EURUSD=X': 'EUR/USD',
    'GC=F': 'Gold',
    'BTC-USD': 'Bitcoin',
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000000) return `${(vol / 1000000000).toFixed(1)}B`;
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2 text-sm font-medium text-slate-500">
        {symbolLabels[data.symbol] || data.symbol}
      </div>
      <div className="mb-2 text-2xl font-bold text-[#1B2A4A]">
        ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(data.changePercent).toFixed(2)}%
      </div>
      <div className="mt-4 text-xs text-slate-400">
        Vol: {formatVolume(data.volume)}
      </div>
    </div>
  );
}