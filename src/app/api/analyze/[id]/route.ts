import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const report = await prisma.analysisReport.findUnique({
      where: { id },
      include: {
        newsArticle: { select: { id: true, title: true, url: true, source: true, publishedAt: true } },
      },
    });

    if (!report) {
      return Response.json({ error: '분석 리포트를 찾을 수 없습니다.' }, { status: 404 });
    }

    return Response.json({
      report: {
        ...report,
        hiddenIntent: JSON.parse(report.hiddenIntent),
        impact: JSON.parse(report.impact),
      },
    });
  } catch (error) {
    return Response.json(
      { error: '분석 리포트를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
