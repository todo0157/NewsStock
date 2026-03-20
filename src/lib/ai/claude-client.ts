import Anthropic from '@anthropic-ai/sdk';
import type { TokenUsage } from '@/types/analysis';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

let totalUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<{ text: string; usage: TokenUsage }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Claude 응답에 텍스트가 없습니다.');
      }

      const usage: TokenUsage = {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };

      totalUsage.inputTokens += usage.inputTokens;
      totalUsage.outputTokens += usage.outputTokens;

      return { text: textBlock.text, usage };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof Anthropic.RateLimitError && attempt < MAX_RETRIES - 1) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      if (error instanceof Anthropic.APIError && error.status && error.status >= 500 && attempt < MAX_RETRIES - 1) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error('Claude API 호출에 실패했습니다.');
}

export function getTotalUsage(): TokenUsage {
  return { ...totalUsage };
}
