import React from 'react';
import { fetchMarketData, type MarketData } from '@/lib/finance/market';
import { MarketCard } from '@/components/finance/MarketCard';

export default async function MarketOverviewPage() {
  let marketData: MarketData[] = [];
  try {
    marketData = await fetchMarketData(['SPY', 'EURUSD=X', 'GC=F', 'BTC-USD']);
  } catch (error) {
    console.error('Error loading market data:', error);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-playfair text-[#1B2A4A]">Market Overview</h1>
        <p className="text-slate-600">Real-time tracking of major indices, forex, and commodities.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {marketData.length > 0 ? (
          marketData.map((data) => (
            <MarketCard key={data.symbol} data={data} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed rounded-xl">
            Unable to load market data at this time.
          </div>
        )}
      </div>

      {/* Placeholder for detailed table/charts */}
      <section className="mt-12 p-8 rounded-2xl border border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-[#1B2A4A] mb-4">Market Depth</h2>
        <p className="text-slate-600">Detailed market depth and technical indicators coming soon in the next sprint.</p>
      </section>
    </div>
  );
}
