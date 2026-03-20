export interface NewsArticle {
  id?: string;
  title: string;
  url: string;
  source: string | null;
  content: string | null;
  summary: string | null;
  category: string | null;
  publishedAt: Date | null;
  createdAt?: Date;
  isAnalyzed?: boolean;
}

export interface RssFeedSource {
  name: string;
  url: string;
  category: string;
  language: 'ko' | 'en';
}

export interface RssCollectResult {
  articles: NewsArticle[];
  errors: { source: string; error: string }[];
}

export interface ParsedArticle {
  title: string;
  url: string;
  source: string | null;
  content: string | null;
  publishedAt: Date | null;
}
