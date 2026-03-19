import { callClaude } from './claude-client';
import {
  PORTFOLIO_RELEVANCE_SYSTEM_PROMPT,
  buildPortfolioRelevancePrompt,
} from './prompts';
import { PortfolioRelevanceSchema, type PortfolioRelevance } from '@/types/analysis';
import type { NewsArticle } from '@/types/news';

interface PortfolioStock {
  symbol: string;
  name: string;
  market: string;
}

interface ScoredNews {
  article: NewsArticle;
  relevance: PortfolioRelevance;
}

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  return text.trim();
}

export async function checkPortfolioRelevance(
  article: Pick<NewsArticle, 'title' | 'summary'>,
  stocks: PortfolioStock[]
): Promise<PortfolioRelevance> {
  if (stocks.length === 0) {
    return { isRelevant: false, relevanceScore: 0, affectedStocks: [] };
  }

  const userPrompt = buildPortfolioRelevancePrompt(
    article.title,
    article.summary || article.title,
    stocks
  );

  const { text } = await callClaude(PORTFOLIO_RELEVANCE_SYSTEM_PROMPT, userPrompt, 1024);

  const jsonStr = extractJson(text);
  const parsed = JSON.parse(jsonStr);
  const result = PortfolioRelevanceSchema.safeParse(parsed);

  if (!result.success) {
    return { isRelevant: false, relevanceScore: 0, affectedStocks: [] };
  }

  return result.data;
}

export async function rankNewsByPortfolioRelevance(
  articles: NewsArticle[],
  stocks: PortfolioStock[]
): Promise<ScoredNews[]> {
  if (stocks.length === 0 || articles.length === 0) return [];

  const results = await Promise.allSettled(
    articles.map(async (article) => {
      const relevance = await checkPortfolioRelevance(article, stocks);
      return { article, relevance };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ScoredNews> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((r) => r.relevance.isRelevant)
    .sort((a, b) => b.relevance.relevanceScore - a.relevance.relevanceScore);
}
