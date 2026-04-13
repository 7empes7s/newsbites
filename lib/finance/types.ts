export type MarketData = {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
};

export type HistoricalData = {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
