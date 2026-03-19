import { extract } from '@extractus/article-extractor';
import type { ParsedArticle } from '@/types/news';

function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export async function parseArticleFromUrl(url: string): Promise<ParsedArticle> {
  if (!url || !URL.canParse(url)) {
    throw new Error('유효하지 않은 URL입니다.');
  }

  const article = await extract(url, {}, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!article) {
    throw new Error('기사 내용을 추출할 수 없습니다. URL을 확인해주세요.');
  }

  if (!article.content && !article.title) {
    throw new Error('기사 제목과 본문을 모두 추출할 수 없습니다.');
  }

  const content = article.content
    ? article.content.replace(/<[^>]*>/g, '').trim()
    : null;

  return {
    title: article.title || '(제목 없음)',
    url,
    source: article.source || extractDomain(url),
    content,
    publishedAt: article.published ? new Date(article.published) : null,
  };
}
