export interface TickerMapping {
  keywords: string[];
  symbol: string;
  name: string;
  exchange: string;
  category: 'ai' | 'crypto' | 'forex' | 'commodity' | 'index';
}

export const TICKER_MAP: TickerMapping[] = [
  { keywords: ['nvidia', 'blackwell', 'nvda', 'nvidia blackwell'], symbol: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['microsoft', 'copilot', 'msft', 'microsoft copilot'], symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['google', 'gemini', 'googl', 'alphabet', 'deepmind'], symbol: 'GOOGL', name: 'Alphabet', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['openai', 'chatgpt', 'sam altman'], symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['anthropic', 'claude', 'amazon anthropic'], symbol: 'AMZN', name: 'Amazon', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['amd', 'mi450', 'radeon'], symbol: 'AMD', name: 'AMD', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['meta', 'facebook', 'llama', 'zuckerberg'], symbol: 'META', name: 'Meta', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['apple', 'aapl', 'apple intelligence'], symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['amazon', 'aws', 'alexa'], symbol: 'AMZN', name: 'Amazon', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['tesla', 'tsla', 'elon musk'], symbol: 'TSLA', name: 'Tesla', exchange: 'NASDAQ', category: 'ai' },
  { keywords: ['bitcoin', 'btc', 'crypto'], symbol: 'BTC-USD', name: 'Bitcoin', exchange: 'Crypto', category: 'crypto' },
  { keywords: ['ethereum', 'eth'], symbol: 'ETH-USD', name: 'Ethereum', exchange: 'Crypto', category: 'crypto' },
  { keywords: ['gold', 'goldman', 'precious'], symbol: 'GC=F', name: 'Gold', exchange: 'COMEX', category: 'commodity' },
  { keywords: ['oil', 'crude', 'opec'], symbol: 'CL=F', name: 'Crude Oil', exchange: 'NYMEX', category: 'commodity' },
  { keywords: ['eurusd', 'euro', 'ecb'], symbol: 'EURUSD=X', name: 'EUR/USD', exchange: 'Forex', category: 'forex' },
  { keywords: ['spy', 's&p', 'sp500', 'index'], symbol: 'SPY', name: 'S&P 500', exchange: 'NYSE', category: 'index' },
  { keywords: ['nasdaq', 'tech index'], symbol: 'QQQ', name: 'Nasdaq-100', exchange: 'NYSE', category: 'index' },
];

export function detectTickerFromArticle(title: string, content: string): TickerMapping | null {
  const text = `${title} ${content}`.toLowerCase();
  
  for (const mapping of TICKER_MAP) {
    for (const keyword of mapping.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return mapping;
      }
    }
  }
  
  return null;
}

export function getTickerMappingBySymbol(symbol: string): TickerMapping | null {
  return TICKER_MAP.find((mapping) => mapping.symbol === symbol) ?? null;
}

export function getArticleTickers(
  title: string,
  content: string,
  panelTickers: string[] = [],
): TickerMapping[] {
  const seen = new Set<string>();
  const collected: TickerMapping[] = [];

  for (const symbol of panelTickers) {
    const mapping = getTickerMappingBySymbol(symbol);
    if (mapping && !seen.has(mapping.symbol)) {
      seen.add(mapping.symbol);
      collected.push(mapping);
    }
  }

  const detected = detectTickerFromArticle(title, content);
  if (detected && !seen.has(detected.symbol)) {
    seen.add(detected.symbol);
    collected.push(detected);
  }

  return collected;
}

export function getTickerSymbol(mapping: TickerMapping): string {
  if (mapping.category === 'crypto') {
    return mapping.symbol;
  }
  return mapping.symbol;
}
