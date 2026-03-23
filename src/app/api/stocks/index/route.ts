import { NextRequest } from 'next/server';
import { getIndexPrice, getIndexHistory } from '@/lib/stocks/kis-api';

// GET /api/stocks/index?type=KOSPI&period=1M
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'KOSPI';
  const period = searchParams.get('period') || '1M';

  if (type !== 'KOSPI' && type !== 'KOSDAQ') {
    return Response.json({ error: '유효하지 않은 지수입니다. (KOSPI, KOSDAQ)' }, { status: 400 });
  }

  try {
    const now = new Date();
    const startDate = getPeriodStart(now, period);
    const endStr = formatDate(now);
    const startStr = formatDate(startDate);

    const [index, candles] = await Promise.all([
      getIndexPrice(type),
      getIndexHistory(type, startStr, endStr),
    ]);

    // 날짜 오름차순 정렬
    candles.sort((a, b) => a.date.localeCompare(b.date));

    return Response.json({ index, candles });
  } catch (error) {
    const message = error instanceof Error ? error.message : '지수 조회에 실패했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function getPeriodStart(now: Date, period: string): Date {
  switch (period) {
    case '1W': return new Date(now.getTime() - 7 * 86400000);
    case '1M': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3M': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6M': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1Y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default: return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
}
