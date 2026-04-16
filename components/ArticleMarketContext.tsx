import { fetchFinanceDataForTicker } from "@/lib/panels/fetchers/finance";
import { detectTickerFromArticle } from "@/lib/finance/tickers";
import type { Article } from "@/lib/articles";

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const W = 100;
  const H = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * (W - 8)},${H - ((v - min) / range) * (H - 8) - 4}`)
    .join(" ");
  const color = positive ? "#16a34a" : "#dc2626";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatPrice(price: number | undefined): string {
  if (!price) return "—";
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(2);
}

function TickerRow({ symbol, name, price, changePercent, sparkline }: {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  sparkline: number[];
}) {
  const isPositive = changePercent >= 0;
  return (
    <div className="market-context-ticker">
      <div className="market-context-ticker-info">
        <div className="market-context-ticker-label">
          <span className="market-context-ticker-symbol">{symbol}</span>
          <span className="market-context-ticker-name">{name}</span>
        </div>
        <div className="market-context-ticker-price-row">
          <span className="market-context-ticker-price">${formatPrice(price)}</span>
          <span className={`market-context-ticker-change ${isPositive ? "positive" : "negative"}`}>
            {isPositive ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
          </span>
        </div>
      </div>
      {sparkline.length >= 2 && <MiniSparkline data={sparkline} positive={isPositive} />}
    </div>
  );
}

export async function ArticleMarketContext({ article }: { article: Article }) {
  if (!["finance", "economy", "crypto"].includes(article.vertical)) return null;

  const detected = detectTickerFromArticle(article.title, article.content || "");
  if (!detected) return null;

  const tickers: string[] = [];
  const seen = new Set<string>();
  const hints = article.panel_hints?.tickers || [];
  for (const t of hints) {
    if (!seen.has(t)) { seen.add(t); tickers.push(t); }
  }
  if (!seen.has(detected.symbol)) { seen.add(detected.symbol); tickers.push(detected.symbol); }

  const results = await Promise.all(
    tickers.slice(0, 5).map(async (symbol) => {
      const data = await fetchFinanceDataForTicker(symbol);
      return data ? { symbol, data } : null;
    })
  );

  const tickerData = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (tickerData.length === 0) return null;

  const publishLabel = article.dateLabel;

  return (
    <section className="article-market-context">
      <h2 className="market-context-title">Market Context</h2>
      <p className="market-context-sub">
        {publishLabel ? `How markets moved since this article ran on ${publishLabel}` : "Market data related to this article"}
      </p>
      <div className="market-context-tickers">
        {tickerData.map(({ symbol, data }) => (
          <TickerRow
            key={symbol}
            symbol={data.symbol}
            name={symbol === detected.symbol ? detected.name : data.symbol}
            price={data.price}
            changePercent={data.changePercent}
            sparkline={data.sparkline}
          />
        ))}
      </div>
    </section>
  );
}