import { NextRequest } from 'next/server';
import { getStockPrice } from '@/lib/stocks/stock-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const market = request.nextUrl.searchParams.get('market') as 'KR' | 'US' | null;

  if (!market || (market !== 'KR' && market !== 'US')) {
    return Response.json({ error: 'market 파라미터가 필요합니다 (KR 또는 US).' }, { status: 400 });
  }

  try {
    const price = await getStockPrice(symbol, market);
    return Response.json({ price });
  } catch (error) {
    const message = error instanceof Error ? error.message : '시세 조회에 실패했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}
