import Parser from 'rss-parser';
import type { NewsArticle, RssFeedSource, RssCollectResult } from '@/types/news';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'NewsStock-AI/1.0',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
});

export const RSS_SOURCES: RssFeedSource[] = [
  {
    name: '한국경제',
    url: 'https://www.hankyung.com/feed/economy',
    category: '경제',
    language: 'ko',
  },
  {
    name: '연합뉴스 경제',
    url: 'https://www.yna.co.kr/rss/economy.xml',
    category: '경제',
    language: 'ko',
  },
  {
    name: '매일경제',
    url: 'https://www.mk.co.kr/rss/30100041/',
    category: '경제',
    language: 'ko',
  },
  {
    name: '서울경제',
    url: 'https://www.sedaily.com/RSS/Economy',
    category: '경제',
    language: 'ko',
  },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

async function fetchFeed(source: RssFeedSource): Promise<NewsArticle[]> {
  const feed = await parser.parseURL(source.url);

  return (feed.items || [])
    .filter((item) => item.link)
    .map((item) => ({
      title: item.title ? stripHtml(item.title) : '(제목 없음)',
      url: item.link!,
      source: source.name,
      content: item.contentSnippet || (item.content ? stripHtml(item.content) : null),
      summary: item.contentSnippet?.slice(0, 200) || null,
      category: source.category,
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
    }));
}

export async function collectAllFeeds(
  sources: RssFeedSource[] = RSS_SOURCES
): Promise<RssCollectResult> {
  const results = await Promise.allSettled(sources.map((source) => fetchFeed(source)));

  const articles: NewsArticle[] = [];
  const errors: RssCollectResult['errors'] = [];
  const seenUrls = new Set<string>();

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          articles.push(article);
        }
      }
    } else {
      errors.push({
        source: sources[index].name,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  articles.sort((a, b) => {
    const dateA = a.publishedAt?.getTime() ?? 0;
    const dateB = b.publishedAt?.getTime() ?? 0;
    return dateB - dateA;
  });

  return { articles, errors };
}
