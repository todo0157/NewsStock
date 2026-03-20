import type { StockPrice, StockSearchResult, StockCandle } from '@/types/stock';

const BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY ?? '';

// --- Rate Limiter (60 req/min) ---

const requestTimestamps: number[] = [];
const RATE_LIMIT = 60;
const WINDOW_MS = 60000;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= RATE_LIMIT) {
    const waitTime = requestTimestamps[0] + WINDOW_MS - now + 100;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  requestTimestamps.push(Date.now());
}

async function finnhubRequest<T>(path: string, params?: Record<string, string>): Promise<T> {
  await waitForRateLimit();

  const url = new URL(path, BASE_URL);
  url.searchParams.set('token', API_KEY);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Finnhub API 오류: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// --- 종목 검색 ---

interface FinnhubSearchResult {
  count: number;
  result: {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }[];
}

export async function searchUsStocks(query: string): Promise<StockSearchResult[]> {
  const data = await finnhubRequest<FinnhubSearchResult>('/search', { q: query });

  return (data.result || [])
    .filter((item) => item.type === 'Common Stock' && !item.symbol.includes('.'))
    .slice(0, 10)
    .map((item) => ({
      symbol: item.symbol,
      name: item.description,
      market: 'US' as const,
      type: item.type,
    }));
}

// --- 실시간 호가 ---

interface FinnhubQuote {
  c: number; // current
  d: number; // change
  dp: number; // change percent
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

export async function getUsStockPrice(symbol: string): Promise<StockPrice> {
  const [quote, profile] = await Promise.all([
    finnhubRequest<FinnhubQuote>('/quote', { symbol }),
    finnhubRequest<{ name?: string; ticker?: string }>('/stock/profile2', { symbol }).catch(
      () => null
    ),
  ]);

  if (!quote || quote.c === 0) {
    throw new Error(`종목 ${symbol}의 시세를 찾을 수 없습니다.`);
  }

  return {
    symbol,
    name: profile?.name || symbol,
    market: 'US',
    currentPrice: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    volume: 0,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
    timestamp: new Date(quote.t * 1000),
  };
}

// --- 캔들 차트 데이터 ---

interface FinnhubCandle {
  s: string;
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  v: number[];
  t: number[];
}

export async function getUsStockHistory(
  symbol: string,
  from: number,
  to: number,
  resolution: string = 'D'
): Promise<StockCandle[]> {
  const data = await finnhubRequest<FinnhubCandle>('/stock/candle', {
    symbol,
    resolution,
    from: String(from),
    to: String(to),
  });

  if (!data || data.s !== 'ok' || !data.t) {
    return [];
  }

  return data.t.map((timestamp, i) => ({
    date: new Date(timestamp * 1000).toISOString().split('T')[0],
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }));
}
