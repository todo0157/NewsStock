import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const article = await prisma.newsArticle.findUnique({
      where: { id },
      include: {
        analysisReports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!article) {
      return Response.json({ error: '기사를 찾을 수 없습니다.' }, { status: 404 });
    }

    return Response.json({ article });
  } catch (error) {
    return Response.json(
      { error: '기사를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
