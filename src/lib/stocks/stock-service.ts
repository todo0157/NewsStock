import { getKrStockPrice, getKrStockHistory, searchKrStocks } from './kis-api';
import { getUsStockPrice, getUsStockHistory, searchUsStocks } from './finnhub-api';
import type { StockPrice, StockSearchResult, StockHistory, HistoryPeriod } from '@/types/stock';

// --- In-Memory Cache (1분 TTL) ---

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// --- 날짜 헬퍼 ---

function formatKrDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function getPeriodStartDate(period: HistoryPeriod): Date {
  const now = new Date();
  switch (period) {
    case '1W':
      return new Date(now.getTime() - 7 * 86400000);
    case '1M':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3M':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6M':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1Y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }
}

// --- 통합 API ---

export async function getStockPrice(
  symbol: string,
  market: 'KR' | 'US'
): Promise<StockPrice> {
  const cacheKey = `price:${market}:${symbol}`;
  const cached = getCached<StockPrice>(cacheKey);
  if (cached) return cached;

  const price = market === 'KR' ? await getKrStockPrice(symbol) : await getUsStockPrice(symbol);

  setCache(cacheKey, price);
  return price;
}

export async function searchStock(query: string): Promise<StockSearchResult[]> {
  const cacheKey = `search:${query}`;
  const cached = getCached<StockSearchResult[]>(cacheKey);
  if (cached) return cached;

  const [krResults, usResults] = await Promise.allSettled([
    Promise.resolve(searchKrStocks(query)),
    searchUsStocks(query),
  ]);

  const results: StockSearchResult[] = [];

  if (krResults.status === 'fulfilled') results.push(...krResults.value);
  if (usResults.status === 'fulfilled') results.push(...usResults.value);

  setCache(cacheKey, results);
  return results;
}

export async function getStockHistory(
  symbol: string,
  market: 'KR' | 'US',
  period: HistoryPeriod = '1M'
): Promise<StockHistory> {
  const cacheKey = `history:${market}:${symbol}:${period}`;
  const cached = getCached<StockHistory>(cacheKey);
  if (cached) return cached;

  const startDate = getPeriodStartDate(period);
  const now = new Date();

  let candles;
  if (market === 'KR') {
    candles = await getKrStockHistory(symbol, formatKrDate(startDate), formatKrDate(now));
  } else {
    const from = Math.floor(startDate.getTime() / 1000);
    const to = Math.floor(now.getTime() / 1000);
    candles = await getUsStockHistory(symbol, from, to);
  }

  const history: StockHistory = { symbol, market, period, candles };
  setCache(cacheKey, history);
  return history;
}
