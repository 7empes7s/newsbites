import { NextRequest, NextResponse } from 'next/server';

const RANGE_CONFIG: Record<string, { interval: string; range: string }> = {
  '1W': { interval: '1h', range: '5d' },
  '1M': { interval: '1d', range: '1mo' },
  '3M': { interval: '1d', range: '3mo' },
  YTD: { interval: '1d', range: 'ytd' },
  '1Y': { interval: '1wk', range: '1y' },
};

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  const rangeKey = request.nextUrl.searchParams.get('range') ?? '1M';

  if (!symbol) {
    return NextResponse.json([]);
  }

  const cfg = RANGE_CONFIG[rangeKey] ?? RANGE_CONFIG['1M'];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${cfg.interval}&range=${cfg.range}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return NextResponse.json([]);
    }

    const timestamps = result.timestamp as number[];
    const quote = result.indicators.quote[0];
    const closes: (number | null)[] = quote.close ?? [];
    const volumes: (number | null)[] = quote.volume ?? [];

    const historical: { date: string; price: number; volume?: number }[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close !== null && close !== undefined && !isNaN(close)) {
        historical.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          price: close,
          volume: volumes[i] ?? undefined,
        });
      }
    }

    return NextResponse.json(historical);
  } catch {
    return NextResponse.json([]);
  }
}
