import { NextRequest } from 'next/server';
import { collectAllFeeds } from '@/lib/news/rss-collector';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const category = searchParams.get('category');

  try {
    const { articles, errors } = await collectAllFeeds();

    const filtered = category
      ? articles.filter((a) => a.category?.toLowerCase() === category.toLowerCase())
      : articles;

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return Response.json({
      articles: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json(
      { error: '뉴스 피드를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
