import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { ArrowRight, TrendingUp, Newspaper, Briefcase, Bell, BarChart2 } from 'lucide-react';
import { fetchMarketData } from '@/lib/finance/market';
import { MarketCard } from '@/components/finance/MarketCard';
import { InsightCard, type InsightProps } from '@/components/finance/InsightCard';
import { getAllArticles } from '@/lib/articles';
import { detectTickerFromArticle } from '@/lib/finance/tickers';

const NAV_ITEMS = [
  { href: '/finance/market', title: 'Market Overview', icon: TrendingUp, description: 'Real-time indices, commodities, and FX rates.' },
  { href: '/finance/charts', title: 'News Charts', icon: BarChart2, description: 'Live charts for tickers in latest articles.' },
  { href: '/finance/insights', title: 'Daily Insights', icon: Newspaper, description: 'AI-generated signals with buy/sell/hold ratings.' },
  { href: '/finance/alerts', title: 'Get Alerts', icon: Bell, description: 'Email alerts for your tracked stocks and topics.' },
];

interface InsightFile {
  id: string;
  title: string;
  summary: string;
  sourceArticleSlugs: string[];
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  status: string;
  ticker?: string;
  signal?: 'buy' | 'hold' | 'sell' | 'neutral';
  timeframe?: 'short' | 'medium' | 'long';
  expectedGain?: string;
  expectedLoss?: string;
  keyRisk?: string;
  disclaimer?: string;
}

function loadTopInsights(limit = 3): InsightProps[] {
  const dir = path.join(process.cwd(), 'content/finance-insights');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .flatMap(f => {
      try {
        const raw: InsightFile = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (raw.status !== 'published') return [];
        const confidence = (['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'medium') as 'high' | 'medium' | 'low';
        const signal = (raw.signal && ['buy', 'hold', 'sell', 'neutral'].includes(raw.signal) ? raw.signal : undefined) as 'buy' | 'hold' | 'sell' | 'neutral' | undefined;
        const timeframe = (raw.timeframe && ['short', 'medium', 'long'].includes(raw.timeframe) ? raw.timeframe : undefined) as 'short' | 'medium' | 'long' | undefined;
        const item: InsightProps = {
          title: raw.title,
          summary: raw.summary,
          confidence,
          sources: raw.sourceArticleSlugs ?? [],
          timestamp: raw.timestamp,
          ticker: raw.ticker,
          signal,
          timeframe,
          expectedGain: raw.expectedGain,
          expectedLoss: raw.expectedLoss,
          keyRisk: raw.keyRisk,
          disclaimer: raw.disclaimer,
        };
        return [item];
      } catch {
        return [];
      }
    })
    // flatMap already removes nulls
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export default async function FinanceDashboardPage() {
  // Parallel fetch — market data and articles
  const [marketData, allArticles, topInsights] = await Promise.allSettled([
    fetchMarketData(['SPY', 'EURUSD=X', 'GC=F', 'BTC-USD']),
    Promise.resolve(getAllArticles()),
    Promise.resolve(loadTopInsights(3)),
  ]);

  const market = marketData.status === 'fulfilled' ? marketData.value : [];
  const articles = allArticles.status === 'fulfilled' ? allArticles.value : [];
  const insights = topInsights.status === 'fulfilled' ? topInsights.value : [];

  // Find articles linked to finance tickers
  const tickerArticles = articles
    .filter(a => !!detectTickerFromArticle(a.title, a.content ?? ''))
    .slice(0, 6)
    .map(a => {
      const ticker = detectTickerFromArticle(a.title, a.content ?? '')!;
      return { article: a, ticker };
    });

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#1B2A4A] px-6 sm:px-10 py-12 sm:py-16 text-white">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-[#F5A623] font-semibold mb-3">AI-Powered Finance Intelligence</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair">
            Markets meet <span className="text-[#F5A623]">the newsroom.</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-lg">
            Every article we publish is cross-referenced with live market data. When the news moves a ticker, you see it — with AI analyst signals, charts, and alerts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/finance/insights" className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-5 py-2.5 text-sm font-semibold text-[#1B2A4A] hover:opacity-90 transition-opacity">
              View AI Signals <ArrowRight size={16} />
            </Link>
            <Link href="/finance/alerts" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              Get Alerts <Bell size={16} />
            </Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#F5A623]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </section>

      {/* Live market snapshot */}
      {market.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-playfair text-[#1B2A4A]">Live Markets</h2>
            <Link href="/finance/market" className="text-sm text-[#F5A623] hover:underline">Full view →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {market.map(d => <MarketCard key={d.symbol} data={d} />)}
          </div>
        </section>
      )}

      {/* AI Insights preview */}
      {insights.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-playfair text-[#1B2A4A]">Today&apos;s AI Analysis</h2>
            <Link href="/finance/insights" className="text-sm text-[#F5A623] hover:underline">All insights →</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
          </div>
        </section>
      )}

      {/* Finance & News articles */}
      {tickerArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-playfair text-[#1B2A4A]">Finance & News</h2>
            <Link href="/finance/charts" className="text-sm text-[#F5A623] hover:underline">Charts →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tickerArticles.map(({ article, ticker }) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#F5A623]/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#1B2A4A] text-white">
                    {ticker.symbol}
                  </span>
                  <span className="text-xs text-slate-400">{article.dateLabel}</span>
                </div>
                <h3 className="text-sm font-semibold text-[#1B2A4A] group-hover:text-[#F5A623] transition-colors line-clamp-2 font-playfair">
                  {article.title}
                </h3>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{article.lead}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick nav */}
      <section>
        <h2 className="text-xl font-bold font-playfair text-[#1B2A4A] mb-6">Explore</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-[#F5A623]/50 hover:shadow-md"
            >
              <div className="mb-3 inline-flex rounded-xl bg-slate-50 p-2.5 text-[#1B2A4A] group-hover:bg-[#F5A623]/10 group-hover:text-[#F5A623] transition-colors">
                <item.icon size={22} />
              </div>
              <h3 className="mb-1 text-base font-bold text-[#1B2A4A]">{item.title}</h3>
              <p className="text-xs text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-400 text-center pb-4">
        All AI signals are generated for informational purposes only and do not constitute financial advice.
      </p>
    </div>
  );
}
