import { callClaude } from './claude-client';
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
} from './prompts';
import { AnalysisResultSchema, type AnalysisResult, type TokenUsage } from '@/types/analysis';
import type { NewsArticle } from '@/types/news';

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  return text.trim();
}

export interface AnalyzeNewsResult {
  analysis: AnalysisResult;
  usage: TokenUsage;
}

export async function analyzeNews(
  article: Pick<NewsArticle, 'title' | 'source' | 'publishedAt' | 'content'>,
  portfolioContext?: string
): Promise<AnalyzeNewsResult> {
  if (!article.content && !article.title) {
    throw new Error('분석할 기사 내용이 없습니다.');
  }

  const userPrompt = buildAnalysisUserPrompt(
    article.title,
    article.source,
    article.publishedAt?.toISOString() ?? null,
    article.content || article.title,
    portfolioContext
  );

  const { text, usage } = await callClaude(ANALYSIS_SYSTEM_PROMPT, userPrompt);

  const jsonStr = extractJson(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI 응답을 JSON으로 파싱할 수 없습니다.');
  }

  const result = AnalysisResultSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`AI 응답 형식이 올바르지 않습니다: ${issues}`);
  }

  return { analysis: result.data, usage };
}
