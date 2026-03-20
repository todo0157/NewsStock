import { NextRequest } from 'next/server';
import { getStockHistory } from '@/lib/stocks/stock-service';
import type { HistoryPeriod } from '@/types/stock';

const VALID_PERIODS: HistoryPeriod[] = ['1W', '1M', '3M', '6M', '1Y'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const searchParams = request.nextUrl.searchParams;
  const market = searchParams.get('market') as 'KR' | 'US' | null;
  const period = (searchParams.get('period') || '1M') as HistoryPeriod;

  if (!market || (market !== 'KR' && market !== 'US')) {
    return Response.json({ error: 'market 파라미터가 필요합니다 (KR 또는 US).' }, { status: 400 });
  }

  if (!VALID_PERIODS.includes(period)) {
    return Response.json(
      { error: `유효하지 않은 period입니다. (${VALID_PERIODS.join(', ')})` },
      { status: 400 }
    );
  }

  try {
    const history = await getStockHistory(symbol, market, period);
    return Response.json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : '시세 히스토리 조회에 실패했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}
