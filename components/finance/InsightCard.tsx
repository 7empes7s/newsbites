import React from 'react';
import Link from 'next/link';

export interface InsightProps {
  title: string;
  summary: string;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
  timestamp: string;
  // Enhanced signal fields (optional — gracefully degrade if absent)
  ticker?: string;
  signal?: 'buy' | 'hold' | 'sell' | 'neutral';
  timeframe?: 'short' | 'medium' | 'long';
  expectedGain?: string;
  expectedLoss?: string;
  keyRisk?: string;
  rationale?: string;
  disclaimer?: string;
}

const CONFIDENCE_COLORS = {
  high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-rose-100 text-rose-700 border-rose-200',
};

const SIGNAL_COLORS = {
  buy: 'bg-emerald-500 text-white',
  hold: 'bg-amber-500 text-white',
  sell: 'bg-rose-500 text-white',
  neutral: 'bg-slate-400 text-white',
};

const SIGNAL_LABELS = {
  buy: 'BUY',
  hold: 'HOLD',
  sell: 'SELL',
  neutral: 'NEUTRAL',
};

const TIMEFRAME_LABELS = {
  short: 'Short-term',
  medium: 'Mid-term',
  long: 'Long-term',
};

export function InsightCard({ insight }: { insight: InsightProps }) {
  const hasSignal = !!insight.signal;

  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#F5A623]/50 transition-all shadow-sm flex flex-col gap-4">
      {/* Header row */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${CONFIDENCE_COLORS[insight.confidence]}`}>
            {insight.confidence} conf
          </span>
          {hasSignal && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${SIGNAL_COLORS[insight.signal!]}`}>
              {SIGNAL_LABELS[insight.signal!]}
            </span>
          )}
          {insight.ticker && (
            <span className="px-2 py-1 rounded-md text-xs font-mono font-bold bg-[#1B2A4A] text-white">
              {insight.ticker}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          {new Date(insight.timestamp).toLocaleDateString()}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-[#1B2A4A] font-playfair leading-snug">
        {insight.title}
      </h3>

      {/* Summary */}
      <p className="text-slate-600 text-sm leading-relaxed">
        {insight.summary}
      </p>

      {/* Signal details */}
      {hasSignal && (insight.expectedGain || insight.expectedLoss || insight.timeframe) && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {insight.timeframe && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
              <p className="text-xs text-slate-400 mb-0.5">Timeframe</p>
              <p className="text-xs font-semibold text-[#1B2A4A]">{TIMEFRAME_LABELS[insight.timeframe]}</p>
            </div>
          )}
          {insight.expectedGain && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2">
              <p className="text-xs text-slate-400 mb-0.5">Upside</p>
              <p className="text-xs font-semibold text-emerald-700">{insight.expectedGain}</p>
            </div>
          )}
          {insight.expectedLoss && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-2">
              <p className="text-xs text-slate-400 mb-0.5">Downside</p>
              <p className="text-xs font-semibold text-rose-700">{insight.expectedLoss}</p>
            </div>
          )}
        </div>
      )}

      {/* Key risk */}
      {insight.keyRisk && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <span className="text-amber-500 mt-0.5 text-xs">⚠</span>
          <p className="text-xs text-amber-800 leading-relaxed">{insight.keyRisk}</p>
        </div>
      )}

      {/* Source articles */}
      {insight.sources.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2">Based on</p>
          <div className="flex flex-wrap gap-2">
            {insight.sources.map((slug) => (
              <Link
                key={slug}
                href={`/articles/${slug}`}
                className="text-xs font-medium text-[#1B2A4A] hover:text-[#F5A623] transition-colors"
              >
                #{slug}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 italic mt-auto">
        {insight.disclaimer ?? 'AI-generated analysis. Not financial advice.'}
      </p>
    </div>
  );
}
