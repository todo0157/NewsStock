export interface StockPrice {
  symbol: string;
  name: string;
  market: 'KR' | 'US';
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  market: 'KR' | 'US';
  type?: string;
}

export interface StockCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistory {
  symbol: string;
  market: 'KR' | 'US';
  period: string;
  candles: StockCandle[];
}

export type HistoryPeriod = '1W' | '1M' | '3M' | '6M' | '1Y';
