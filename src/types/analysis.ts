import { z } from 'zod';

const SeveritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

const ImpactPeriodSchema = z.object({
  description: z.string(),
  severity: SeveritySchema,
});

const BenefitActionSchema = z.enum(['BUY', 'HOLD', 'WATCH']);
const HarmActionSchema = z.enum(['SELL', 'REDUCE', 'WATCH']);
const MarketSchema = z.enum(['KR', 'US']);
const SentimentSchema = z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']);

const BenefitStockSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  market: MarketSchema,
  probability: z.number().min(0).max(100),
  reason: z.string(),
  recommendation: z.object({
    action: BenefitActionSchema,
    timing: z.string(),
    targetPrice: z.string().optional(),
  }),
});

const HarmStockSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  market: MarketSchema,
  probability: z.number().min(0).max(100),
  reason: z.string(),
  recommendation: z.object({
    action: HarmActionSchema,
    timing: z.string(),
  }),
});

export const AnalysisResultSchema = z.object({
  hiddenIntent: z.object({
    summary: z.string(),
    details: z.string(),
  }),
  impact: z.object({
    shortTerm: ImpactPeriodSchema,
    midTerm: ImpactPeriodSchema,
    longTerm: ImpactPeriodSchema,
  }),
  benefitStocks: z.array(BenefitStockSchema),
  harmStocks: z.array(HarmStockSchema),
  overallSentiment: SentimentSchema,
  confidence: z.number().min(0).max(100),
  keyInsight: z.string(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const PortfolioRelevanceSchema = z.object({
  isRelevant: z.boolean(),
  relevanceScore: z.number().min(0).max(100),
  affectedStocks: z.array(
    z.object({
      symbol: z.string(),
      name: z.string(),
      impact: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']),
      reason: z.string(),
    })
  ),
});

export type PortfolioRelevance = z.infer<typeof PortfolioRelevanceSchema>;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}
