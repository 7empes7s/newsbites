import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketData } from '@/lib/finance/market';

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get('symbols');
  const symbols = symbolsParam
    ? symbolsParam.split(',').map(s => s.trim()).filter(Boolean)
    : ['SPY', 'EURUSD=X', 'GC=F', 'BTC-USD'];

  try {
    const data = await fetchMarketData(symbols);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
