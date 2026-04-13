import { type MarketData, type HistoricalData } from './types';
export type { MarketData, HistoricalData };

const SYMBOLS = ['SPY', 'EURUSD=X', 'GC=F', 'BTC-USD'];
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function fetchMarketData(symbols: string[] = SYMBOLS): Promise<MarketData[]> {
  const results: MarketData[] = [];

  for (const symbol of symbols) {
    try {
      const url = `${YAHOO_CHART_URL}/${symbol}?interval=1d&range=5d`;
      const response = await fetch(url, {
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        console.warn(`Yahoo Finance error for ${symbol}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const meta = data?.chart?.result?.[0]?.meta;

      if (!meta) {
        console.warn(`No data for ${symbol}`);
        continue;
      }

      results.push({
        symbol: meta.symbol || symbol,
        price: meta.regularMarketPrice || 0,
        changePercent: meta.regularMarketChangePercent || 0,
        volume: meta.regularMarketVolume || 0,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    }
  }

  if (results.length === 0) {
    throw new Error('No market data could be retrieved');
  }

  return results;
}

export async function fetchHistoricalData(symbol: string, range = '1mo'): Promise<HistoricalData[]> {
  try {
    const url = `${YAHOO_CHART_URL}/${symbol}?interval=1d&range=${range}`;
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return [];
    }

    const timestamps = result.timestamp as number[];
    const quote = result.indicators.quote[0];
    const closes = quote.close ?? [];
    const opens = quote.open ?? [];
    const highs = quote.high ?? [];
    const lows = quote.low ?? [];
    const volumes = quote.volume ?? [];

    const historical: HistoricalData[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close !== null && close !== undefined) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          price: close,
          open: opens[i] ?? close,
          high: highs[i] ?? close,
          low: lows[i] ?? close,
          close: close,
          volume: volumes[i] ?? 0,
        });
      }
    }

    return historical;
  } catch (error) {
    console.error(`Error fetching historical ${symbol}:`, error);
    return [];
  }
}