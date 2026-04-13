import React from 'react';
import Link from 'next/link';
import { getAllArticles, type Article } from '@/lib/articles';
import { detectTickerFromArticle, type TickerMapping } from '@/lib/finance/tickers';
import { TickerChart } from '@/components/finance/TickerChart';

function getGroupedTickers(): { ticker: TickerMapping; articles: { title: string; slug: string }[] }[] {
  const articles = getAllArticles()
    .filter(a => a.status === 'published' || a.status === 'approved')
    .slice(0, 20);

  const tickerMap = new Map<string, { ticker: TickerMapping; articles: { title: string; slug: string }[] }>();

  for (const article of articles) {
    const content = article.title + ' ' + (article.lead || '') + ' ' + (article.digest || '');
    const detected = detectTickerFromArticle(article.title, content);
    
    if (!detected) continue;

    const key = detected.symbol;
    const existing = tickerMap.get(key);
    
    if (existing) {
      existing.articles.push({ title: article.title, slug: article.slug });
    } else {
      tickerMap.set(key, {
        ticker: detected,
        articles: [{ title: article.title, slug: article.slug }]
      });
    }
  }

  return Array.from(tickerMap.values());
}

export default function NewsChartsPage() {
  const grouped = getGroupedTickers();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-playfair text-[#1B2A4A]">News-Driven Charts</h1>
        <p className="text-slate-600 mt-2">
          Live market data for tickers in recent articles. One chart per ticker, articles grouped below.
        </p>
      </header>

      {grouped.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          No articles with detectable market tickers found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {grouped.map((group) => (
            <TickerChart
              key={group.ticker.symbol}
              symbol={group.ticker.symbol}
              title={group.ticker.name}
              articles={group.articles}
            />
          ))}
        </div>
      )}
    </div>
  );
}