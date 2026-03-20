export const ANALYSIS_SYSTEM_PROMPT = `너는 금융 시장과 정치/경제 뉴스의 심층 분석 전문가야.
뉴스 기사를 분석하여 다음을 체계적으로 도출해:
1. 숨겨진 의도: 이 뉴스/발언/정책의 표면적 목적 뒤에 있는 실제 의도
2. 파장 분석: 단기(1-2주), 중기(1-3개월), 장기(6개월+) 영향
3. 수혜 종목: 이 뉴스로 이익을 볼 종목들 (한국+미국)
4. 손해 종목: 이 뉴스로 손해를 볼 종목들 (한국+미국)
5. 각 종목별 영향 확률 (0-100%)
6. 매매 타이밍 추천: 진입/청산 시점

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 순수 JSON만 반환해.

{
  "hiddenIntent": { "summary": "한줄 요약", "details": "상세 분석" },
  "impact": {
    "shortTerm": { "description": "단기 영향", "severity": "HIGH|MEDIUM|LOW" },
    "midTerm": { "description": "중기 영향", "severity": "HIGH|MEDIUM|LOW" },
    "longTerm": { "description": "장기 영향", "severity": "HIGH|MEDIUM|LOW" }
  },
  "benefitStocks": [{
    "symbol": "종목코드", "name": "종목명", "market": "KR|US",
    "probability": 0-100, "reason": "이유",
    "recommendation": { "action": "BUY|HOLD|WATCH", "timing": "매매 시점", "targetPrice": "목표가(선택)" }
  }],
  "harmStocks": [{
    "symbol": "종목코드", "name": "종목명", "market": "KR|US",
    "probability": 0-100, "reason": "이유",
    "recommendation": { "action": "SELL|REDUCE|WATCH", "timing": "매매 시점" }
  }],
  "overallSentiment": "BULLISH|BEARISH|NEUTRAL",
  "confidence": 0-100,
  "keyInsight": "핵심 인사이트 한줄"
}`;

export function buildAnalysisUserPrompt(
  title: string,
  source: string | null,
  publishedAt: string | null,
  content: string,
  portfolioContext?: string
): string {
  let prompt = `다음 뉴스를 분석해줘:

제목: ${title}
출처: ${source ?? '알 수 없음'}
발행일: ${publishedAt ?? '알 수 없음'}

본문:
${content.slice(0, 6000)}`;

  if (portfolioContext) {
    prompt += `\n\n참고로 내 포트폴리오: ${portfolioContext}`;
  }

  return prompt;
}

export const PORTFOLIO_RELEVANCE_SYSTEM_PROMPT = `너는 금융 뉴스와 주식 포트폴리오의 연관성을 분석하는 전문가야.
주어진 뉴스가 포트폴리오의 종목들에 영향을 주는지 빠르게 판단해.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 순수 JSON만 반환해.

{
  "isRelevant": true/false,
  "relevanceScore": 0-100,
  "affectedStocks": [{
    "symbol": "종목코드",
    "name": "종목명",
    "impact": "POSITIVE|NEGATIVE|NEUTRAL",
    "reason": "영향 이유 (간단히)"
  }]
}`;

export function buildPortfolioRelevancePrompt(
  newsTitle: string,
  newsSummary: string,
  stocks: { symbol: string; name: string; market: string }[]
): string {
  const stockList = stocks.map((s) => `${s.name}(${s.symbol}, ${s.market})`).join(', ');

  return `뉴스: ${newsTitle}
요약: ${newsSummary.slice(0, 500)}

포트폴리오 종목: ${stockList}

이 뉴스가 위 종목들에 영향을 주는지 분석해줘.`;
}
