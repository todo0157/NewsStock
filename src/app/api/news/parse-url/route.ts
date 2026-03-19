import { NextRequest } from 'next/server';
import { parseArticleFromUrl } from '@/lib/news/url-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    }

    const article = await parseArticleFromUrl(url);

    return Response.json({ article });
  } catch (error) {
    const message = error instanceof Error ? error.message : '기사 파싱에 실패했습니다.';
    return Response.json({ error: message }, { status: 422 });
  }
}
