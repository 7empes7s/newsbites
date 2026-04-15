import { fetchMarketData, fetchHistoricalData } from "@/lib/finance/market";
import { detectTickerFromArticle, type TickerMapping } from "@/lib/finance/tickers";

export async function fetchFinanceDataForTicker(ticker: string) {
  try {
    const [marketData, historicalData] = await Promise.all([
      fetchMarketData([ticker]),
      fetchHistoricalData(ticker, "1W"),
    ]);
    
    if (!marketData || marketData.length === 0) return null;
    
    const market = marketData[0];
    const sparkline = historicalData.slice(-7).map(d => d.price);
    
    return {
      symbol: market.symbol,
      price: market.price,
      changePercent: market.changePercent,
      volume: market.volume,
      sparkline,
      lastUpdated: market.lastUpdated,
    };
  } catch (error) {
    console.error(`Error fetching finance data for ${ticker}:`, error);
    return null;
  }
}

export interface FinanceTickerData {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  sparkline: number[];
  lastUpdated: string;
}

export async function fetchMultipleTickers(tickers: string[]) {
  const results = await Promise.all(
    tickers.map(async (symbol) => {
      const data = await fetchFinanceDataForTicker(symbol);
      return { symbol, data };
    })
  );
  
  return results
    .filter((r): r is { symbol: string; data: NonNullable<typeof r.data> } => r.data !== null)
    .reduce((acc, r) => {
      acc[r.symbol] = r.data;
      return acc;
    }, {} as Record<string, FinanceTickerData>);
}