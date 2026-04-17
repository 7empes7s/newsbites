"use client";

import { useEffect, useState } from "react";
import { getTickerMappingBySymbol } from "@/lib/finance/tickers";
import { getSubscriptions } from "@/lib/subscriptions";

type MarketEntry = {
  symbol: string;
  price?: number;
  changePercent?: number;
};

function formatPrice(price?: number) {
  if (price === undefined || price === null || Number.isNaN(price)) {
    return "—";
  }

  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return price.toFixed(2);
}

export function SubscribedTickerStrip() {
  const [entries, setEntries] = useState<MarketEntry[]>([]);

  useEffect(() => {
    const subscriptions = getSubscriptions().tickers.slice(0, 3);
    if (subscriptions.length === 0) {
      setEntries([]);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `/api/finance/market?symbols=${encodeURIComponent(subscriptions.join(","))}`,
          { cache: "no-store", signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Ticker market request failed: ${response.status}`);
        }

        const data = (await response.json()) as MarketEntry[];
        if (!controller.signal.aborted) {
          setEntries(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Subscribed ticker strip failed:", error);
          setEntries([]);
        }
      }
    }

    load();

    return () => controller.abort();
  }, []);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="finance-subscription-strip">
      <p className="finance-subscription-strip-label">Your tracked tickers</p>
      <div className="finance-subscription-strip-grid">
        {entries.map((entry) => {
          const isPositive = (entry.changePercent ?? 0) >= 0;
          const mapping = getTickerMappingBySymbol(entry.symbol);
          return (
            <div key={entry.symbol} className="finance-subscription-card">
              <div className="finance-subscription-card-row">
                <span className="finance-subscription-symbol">{entry.symbol}</span>
                <span
                  className={`finance-subscription-change ${
                    isPositive ? "is-positive" : "is-negative"
                  }`}
                >
                  {isPositive ? "▲" : "▼"} {Math.abs(entry.changePercent ?? 0).toFixed(2)}%
                </span>
              </div>
              <div className="finance-subscription-name">
                {mapping?.name ?? entry.symbol}
              </div>
              <div className="finance-subscription-price">${formatPrice(entry.price)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
