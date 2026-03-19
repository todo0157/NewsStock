import { NextRequest } from 'next/server';
import { analyzeNews } from '@/lib/ai/analysis-service';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { checkAnalysisLimit, incrementUsage } from '@/lib/usage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, title, content, source, publishedAt, portfolioContext } = body;

    // 인증된 사용자인 경우 사용량 체크
    const session = await auth();
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true },
      });

      if (user) {
        const { allowed, used, limit } = await checkAnalysisLimit(session.user.id, user.plan);
        if (!allowed) {
          return Response.json(
            { error: '일일 분석 한도를 초과했습니다.', used, limit, upgrade: true },
            { status: 429 }
          );
        }
      }
    }

    let article: { title: string; source: string | null; publishedAt: Date | null; content: string | null };

    if (articleId) {
      const dbArticle = await prisma.newsArticle.findUnique({ where: { id: articleId } });
      if (!dbArticle) {
        return Response.json({ error: '기사를 찾을 수 없습니다.' }, { status: 404 });
      }
      article = dbArticle;
    } else if (title && content) {
      article = {
        title,
        content,
        source: source ?? null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      };
    } else {
      return Response.json(
        { error: 'articleId 또는 title+content가 필요합니다.' },
        { status: 400 }
      );
    }

    const { analysis, usage } = await analyzeNews(article, portfolioContext);

    // 사용량 증가
    if (session?.user?.id) {
      await incrementUsage(session.user.id);
    }

    // DB에 기사가 있으면 분석 결과 저장
    let reportId: string | null = null;
    if (articleId) {
      const report = await prisma.analysisReport.create({
        data: {
          newsArticleId: articleId,
          userId: session?.user?.id,
          hiddenIntent: JSON.stringify(analysis.hiddenIntent),
          impact: JSON.stringify(analysis.impact),
          affectedStocks: [...analysis.benefitStocks, ...analysis.harmStocks],
          portfolioRecommendation: analysis.benefitStocks.map((s) => s.recommendation),
          confidence: analysis.confidence,
        },
      });
      reportId = report.id;

      await prisma.newsArticle.update({
        where: { id: articleId },
        data: { isAnalyzed: true },
      });
    }

    return Response.json({ reportId, analysis, usage });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 분석에 실패했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}
