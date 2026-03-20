import { NextRequest } from 'next/server';
import { searchStock } from '@/lib/stocks/stock-service';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');

  if (!q || q.trim().length === 0) {
    return Response.json({ error: '검색어(q)가 필요합니다.' }, { status: 400 });
  }

  try {
    const results = await searchStock(q.trim());
    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : '종목 검색에 실패했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}
