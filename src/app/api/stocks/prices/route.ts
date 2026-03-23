import { NextRequest } from 'next/server';
import { getStockPrice } from '@/lib/stocks/stock-service';

// 여러 종목 현재가를 한 번에 조회
// POST /api/stocks/prices  body: { stocks: [{ symbol, market }] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const stocks: { symbol: string; market: 'KR' | 'US' }[] = body.stocks;

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return Response.json({ error: '종목 목록이 필요합니다.' }, { status: 400 });
    }

    // 최대 20개 제한
    const limited = stocks.slice(0, 20);

    const results = await Promise.allSettled(
      limited.map(async ({ symbol, market }) => {
        const price = await getStockPrice(symbol, market as 'KR' | 'US');
        return { symbol, market, price };
      })
    );

    const prices: Record<string, {
      currentPrice: number;
      change: number;
      changePercent: number;
      name: string;
      high: number;
      low: number;
      volume: number;
      previousClose: number;
    }> = {};

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { symbol, price } = result.value;
        prices[symbol] = {
          currentPrice: price.currentPrice,
          change: price.change,
          changePercent: price.changePercent,
          name: price.name,
          high: price.high,
          low: price.low,
          volume: price.volume,
          previousClose: price.previousClose,
        };
      }
    }

    return Response.json({ prices });
  } catch (error) {
    const message = error instanceof Error ? error.message : '시세 조회에 실패했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}
