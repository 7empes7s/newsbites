import React from 'react';
import { MarketData } from '@/lib/finance/types';

interface PortfolioRowProps {
  symbol: string;
  quantity: string;
  marketValue: string;
  dailyPL: string;
}

function PortfolioRow({ symbol, quantity, marketValue, dailyPL }: PortfolioRowProps) {
  const isPositive = dailyPL.startsWith('+');
  return (
    <tr className="border-b border-slate-100">
      <td className="px-6 py-4 font-medium text-[#1B2A4A]">{symbol}</td>
      <td className="px-6 py-4 text-slate-600">{quantity}</td>
      <td className="px-6 py-4 text-slate-600">{marketValue}</td>
      <td className={`px-6 py-4 font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPositive ? '↑' : '↓'} {dailyPL}
      </td>
    </tr>
  );
}

export default function PortfolioPage() {
  const demoPortfolio: PortfolioRowProps[] = [
    { symbol: 'S&P 500 (SPY)', quantity: '10k shares', marketValue: '$52,341.80', dailyPL: '+1.2%' },
    { symbol: 'EUR/USD', quantity: '5k EUR', marketValue: '$5,412.50', dailyPL: '-0.4%' },
    { symbol: 'Gold (GC=F)', quantity: '2k oz', marketValue: '$4,862,000', dailyPL: '+0.8%' },
    { symbol: 'Bitcoin (BTC-USD)', quantity: '0.8 BTC', marketValue: '$51,200.00', dailyPL: '+2.5%' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-playfair text-[#1B2A4A]">Demo Portfolio</h1>
        <p className="text-slate-600">A static snapshot of a high-value diversified asset allocation.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Asset</th>
              <th className="px-6 py-4 font-semibold">Quantity</th>
              <th className="px-6 py-4 font-semibold">Market Value</th>
              <th className="px-6 py-4 font-semibold">Daily P&L</th>
            </tr>
          </thead>
          <tbody>
            {demoPortfolio.map((row) => (
              <PortfolioRow key={row.symbol} {...row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
        <h3 className="text-amber-800 font-bold mb-2">Note</h3>
        <p className="text-amber-700 text-sm">
          This is a static demonstration portfolio. Real-time valuation and integration with the live data layer are scheduled for the next development phase.
        </p>
      </div>
    </div>
  );
}
