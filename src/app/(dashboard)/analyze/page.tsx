'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getPortfolio,
  saveReport,
  matchPortfolioStocks,
  type PortfolioStock,
  type StockResult,
  type AffectedPortfolioStock,
} from '@/lib/store';

interface AnalysisResult {
  keyInsight: string;
  sentiment: string;
  hiddenIntent: string;
  hiddenIntentDetail: string;
  impact: { label: string; severity: string; description: string }[];
  benefitStocks: StockResult[];
  harmStocks: StockResult[];
  confidence: number;
}

// 목 분석 결과
const mockResult: AnalysisResult = {
  keyInsight: '정부의 반도체 산업 지원 정책 강화로 국내 반도체 기업들의 수혜가 예상되며, 특히 메모리 반도체 업체들의 실적 개선이 기대됩니다.',
  sentiment: '상승',
  hiddenIntent: '반도체 산업 국가 전략화',
  hiddenIntentDetail: '미중 기술패권 경쟁 속에서 한국 반도체 산업의 글로벌 경쟁력을 강화하기 위한 정부 차원의 전략적 지원. 세제 혜택과 R&D 투자 확대를 통해 삼성전자·SK하이닉스의 차세대 반도체 개발을 가속화하려는 의도.',
  impact: [
    { label: '단기 (1~2주)', severity: '높음', description: '반도체 관련주 매수세 유입 예상' },
    { label: '중기 (1~3개월)', severity: '중간', description: 'R&D 투자 확대에 따른 실적 기대감' },
    { label: '장기 (6개월+)', severity: '높음', description: '글로벌 반도체 공급망 재편 수혜' },
  ],
  benefitStocks: [
    { name: '삼성전자', symbol: '005930', market: 'KR', impact: 'positive', probability: 85, reason: '정부 세제 혜택 직접 수혜, HBM 투자 확대', action: '매수', timing: '단기' },
    { name: 'SK하이닉스', symbol: '000660', market: 'KR', impact: 'positive', probability: 82, reason: 'AI 메모리 수요 증가 + 정책 지원 수혜', action: '매수', timing: '단기' },
    { name: 'NVIDIA', symbol: 'NVDA', market: 'US', impact: 'positive', probability: 68, reason: '한국 반도체 공급 안정화 → GPU 생산 확대', action: '관망', timing: '중기' },
  ],
  harmStocks: [
    { name: '중국 반도체 ETF', symbol: 'SOXC', market: 'US', impact: 'negative', probability: 60, reason: '한국 반도체 경쟁력 강화 → 중국 업체 점유율 하락', action: '매도', timing: '중기' },
  ],
  confidence: 78,
};

export default function AnalyzePage() {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [affectedStocks, setAffectedStocks] = useState<AffectedPortfolioStock[]>([]);

  const steps = ['기사 파싱 중...', 'AI 분석 중...', '포트폴리오 매칭 중...', '리포트 생성 중...'];

  // 포트폴리오 로드
  useEffect(() => {
    setPortfolio(getPortfolio());
    const handler = () => setPortfolio(getPortfolio());
    window.addEventListener('portfolio-updated', handler);
    return () => window.removeEventListener('portfolio-updated', handler);
  }, []);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setResult(null);
    setSaved(false);
    setAffectedStocks([]);
    setAnalyzing(true);

    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 800));
    }

    setAnalyzing(false);
    setResult(mockResult);

    // 포트폴리오 매칭
    const currentPortfolio = getPortfolio();
    const affected = matchPortfolioStocks(currentPortfolio, mockResult.benefitStocks, mockResult.harmStocks);
    setAffectedStocks(affected);

    // 자동 저장
    const title = url.includes('http') ? `뉴스 분석: ${url.split('/').pop()?.slice(0, 30) || url.slice(0, 40)}` : url.slice(0, 50);
    saveReport({
      id: Date.now().toString(),
      url,
      title,
      keyInsight: mockResult.keyInsight,
      sentiment: mockResult.sentiment,
      confidence: mockResult.confidence,
      hiddenIntent: mockResult.hiddenIntent,
      hiddenIntentDetail: mockResult.hiddenIntentDetail,
      impact: mockResult.impact,
      benefitStocks: mockResult.benefitStocks,
      harmStocks: mockResult.harmStocks,
      date: new Date().toISOString(),
      affectedPortfolioStocks: affected,
    });
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI 분석</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          뉴스 URL을 입력하면 AI가 수혜/손해 종목을 분석합니다.
        </p>
      </motion.div>

      {/* 포트폴리오 연동 상태 */}
      {portfolio.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5"
        >
          <span className="text-sm text-primary">💼</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            포트폴리오 연동 중 — <strong className="text-primary">{portfolio.length}종목</strong> 기반 맞춤 분석이 적용됩니다.
          </span>
        </motion.div>
      )}

      {/* URL 입력 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
      >
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="뉴스 URL을 붙여넣으세요"
            className="flex-1 rounded-lg border border-border bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !url.trim()}
            className="shrink-0 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {analyzing ? '분석 중...' : '분석하기'}
          </button>
        </div>
      </motion.div>

      {/* 분석 진행 */}
      {analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
        >
          <div className="space-y-4">
            {steps.map((label, i) => (
              <div key={label} className={`flex items-center gap-3 transition-opacity ${step >= i ? 'opacity-100' : 'opacity-30'}`}>
                {step > i ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-sm text-green-600 dark:bg-green-950 dark:text-green-400">✓</span>
                ) : step === i ? (
                  <span className="flex h-6 w-6 items-center justify-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </span>
                ) : (
                  <span className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-800" />
                )}
                <span className={`text-sm ${step >= i ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 분석 결과 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* 저장 완료 알림 */}
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 dark:bg-green-950/30"
              >
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-sm text-green-700 dark:text-green-300">리포트가 자동 저장되었습니다. 리포트 탭에서 확인할 수 있습니다.</span>
              </motion.div>
            )}

            {/* 내 포트폴리오 영향 알림 */}
            {affectedStocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 dark:border-amber-600 dark:bg-amber-950/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚠️</span>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                    내 포트폴리오 영향 감지 — {affectedStocks.length}종목
                  </p>
                </div>
                <div className="space-y-2">
                  {affectedStocks.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between rounded-lg bg-white/80 px-4 py-3 dark:bg-black/30">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                          stock.impact === 'positive'
                            ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                        }`}>
                          {stock.impact === 'positive' ? '↑' : '↓'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{stock.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{stock.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          stock.impact === 'positive'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}>{stock.action}</span>
                        <p className="mt-1 text-xs text-gray-400">{stock.probability}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 핵심 인사이트 */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">핵심 인사이트</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{result.keyInsight}</p>
                </div>
                <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                  {result.sentiment}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">신뢰도</span>
                <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${result.confidence}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{result.confidence}%</span>
              </div>
            </div>

            {/* 숨겨진 의도 */}
            <div className="rounded-xl border border-border bg-white p-5 dark:bg-gray-950">
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">🔮 숨겨진 의도</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">{result.hiddenIntent}</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{result.hiddenIntentDetail}</p>
            </div>

            {/* 파장 분석 */}
            <div className="rounded-xl border border-border bg-white p-5 dark:bg-gray-950">
              <p className="mb-3 text-sm font-semibold text-orange-600 dark:text-orange-400">🎯 파장 분석</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {result.impact.map((item) => (
                  <div key={item.label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        item.severity === '높음' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                      }`}>{item.severity}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 수혜 종목 */}
            <div className="rounded-xl border border-border bg-white p-5 dark:bg-gray-950">
              <p className="mb-3 text-sm font-semibold text-green-600 dark:text-green-400">📈 수혜 종목</p>
              <div className="space-y-3">
                {result.benefitStocks.map((stock) => {
                  const isInPortfolio = portfolio.some(
                    (p) => p.name.toLowerCase() === stock.name.toLowerCase() || p.symbol.toLowerCase() === stock.symbol.toLowerCase()
                  );
                  return (
                    <div key={stock.symbol} className={`rounded-lg p-4 ${isInPortfolio ? 'bg-primary/5 ring-1 ring-primary/30' : 'bg-gray-50 dark:bg-gray-900'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isInPortfolio && (
                            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold text-primary">내 종목</span>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">{stock.name}</span>
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{stock.symbol}</span>
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${stock.market === 'KR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'}`}>{stock.market}</span>
                        </div>
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">{stock.action}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{stock.reason}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-800">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${stock.probability}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{stock.probability}%</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">타이밍: {stock.timing}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 손해 종목 */}
            <div className="rounded-xl border border-border bg-white p-5 dark:bg-gray-950">
              <p className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">📉 손해 종목</p>
              <div className="space-y-3">
                {result.harmStocks.map((stock) => {
                  const isInPortfolio = portfolio.some(
                    (p) => p.name.toLowerCase() === stock.name.toLowerCase() || p.symbol.toLowerCase() === stock.symbol.toLowerCase()
                  );
                  return (
                    <div key={stock.symbol} className={`rounded-lg p-4 ${isInPortfolio ? 'bg-red-50 ring-1 ring-red-300 dark:bg-red-950/30 dark:ring-red-600' : 'bg-gray-50 dark:bg-gray-900'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isInPortfolio && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-400">내 종목</span>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">{stock.name}</span>
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{stock.symbol}</span>
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${stock.market === 'KR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'}`}>{stock.market}</span>
                        </div>
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">{stock.action}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{stock.reason}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-800">
                          <div className="h-full rounded-full bg-red-500" style={{ width: `${stock.probability}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{stock.probability}%</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">타이밍: {stock.timing}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 면책 */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4 dark:bg-gray-950">
              <p className="text-xs text-gray-400">본 분석은 AI 기반 참고 자료이며, 투자 결정의 최종 책임은 본인에게 있습니다.</p>
              <button className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900">
                PDF 내보내기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
