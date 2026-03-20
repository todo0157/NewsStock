'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, TrendingUp, TrendingDown, Shield, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { AnalysisResult } from '@/types/analysis';
import { mockAnalysis } from '@/lib/mock-data';

const STEPS = ['기사 파싱 중...', 'AI 분석 중...', '종목 매칭 중...', '리포트 생성 중...'];

function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    HIGH: 'bg-red-500/10 text-red-400',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400',
    LOW: 'bg-green-500/10 text-green-400',
  };
  return <Badge className={colors[severity as keyof typeof colors] || ''}>{severity}</Badge>;
}

function ProbabilityBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-red-500' : value >= 40 ? 'bg-yellow-500' : 'bg-blue-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-neutral-800">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="w-10 text-right text-sm font-medium">{value}%</span>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <AnalyzeContent />
    </Suspense>
  );
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const parseMutation = useMutation({
    mutationFn: async (targetUrl: string) => {
      // 파싱 단계
      setStep(0);
      let article;
      try {
        const res = await fetch('/api/news/parse-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
        });
        if (!res.ok) throw new Error('파싱 실패');
        const data = await res.json();
        article = data.article;
      } catch {
        article = { title: '테스트 기사', content: '목 데이터로 분석합니다.', source: 'test' };
      }

      // AI 분석 단계
      setStep(1);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: article.title,
            content: article.content,
            source: article.source,
            publishedAt: article.publishedAt,
          }),
        });
        if (!res.ok) throw new Error('분석 실패');
        const data = await res.json();
        setStep(2);
        await new Promise((r) => setTimeout(r, 500));
        setStep(3);
        await new Promise((r) => setTimeout(r, 500));
        return data.analysis as AnalysisResult;
      } catch {
        // API 키 없을 때 목 데이터 사용
        setStep(2);
        await new Promise((r) => setTimeout(r, 800));
        setStep(3);
        await new Promise((r) => setTimeout(r, 800));
        return mockAnalysis;
      }
    },
    onSuccess: (data) => setAnalysis(data),
  });

  useEffect(() => {
    const paramUrl = searchParams.get('url');
    if (paramUrl && paramUrl !== url) {
      setUrl(paramUrl);
    }
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setAnalysis(null);
    parseMutation.mutate(url.trim());
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* URL 입력 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 text-center"
      >
        <h1 className="text-2xl font-bold">뉴스 AI 분석</h1>
        <p className="text-neutral-400">뉴스 URL을 입력하면 AI가 숨겨진 의도와 수혜/손해 종목을 분석합니다</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="뉴스 기사 URL을 붙여넣으세요..."
          className="h-12 border-neutral-700 bg-neutral-900 text-base"
        />
        <Button type="submit" className="h-12 px-6" disabled={parseMutation.isPending}>
          {parseMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* 로딩 */}
      {parseMutation.isPending && (
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="py-8">
            <div className="space-y-4">
              {STEPS.map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: step >= i ? 1 : 0.3 }}
                  className="flex items-center gap-3"
                >
                  {step > i ? (
                    <div className="h-6 w-6 rounded-full bg-green-500/20 p-1 text-green-400">✓</div>
                  ) : step === i ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-neutral-800" />
                  )}
                  <span className={step >= i ? 'text-white' : 'text-neutral-600'}>{label}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 결과 */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* 핵심 인사이트 */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="flex items-start gap-3 py-4">
                <Zap className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-300">핵심 인사이트</p>
                  <p className="mt-1 text-sm text-neutral-300">{analysis.keyInsight}</p>
                </div>
                <Badge
                  className={
                    analysis.overallSentiment === 'BULLISH'
                      ? 'bg-green-500/10 text-green-400'
                      : analysis.overallSentiment === 'BEARISH'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-neutral-500/10 text-neutral-400'
                  }
                >
                  {analysis.overallSentiment}
                </Badge>
              </CardContent>
            </Card>

            {/* 숨겨진 의도 */}
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-purple-400" />
                  숨겨진 의도
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-purple-300">{analysis.hiddenIntent.summary}</p>
                <p className="text-sm leading-relaxed text-neutral-400">{analysis.hiddenIntent.details}</p>
              </CardContent>
            </Card>

            {/* 파장 분석 */}
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-orange-400" />
                  파장 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: '단기 (1-2주)', data: analysis.impact.shortTerm },
                    { label: '중기 (1-3개월)', data: analysis.impact.midTerm },
                    { label: '장기 (6개월+)', data: analysis.impact.longTerm },
                  ].map((period) => (
                    <div key={period.label} className="rounded-lg bg-neutral-800/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-300">{period.label}</span>
                        <SeverityBadge severity={period.data.severity} />
                      </div>
                      <p className="mt-2 text-sm text-neutral-400">{period.data.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 수혜 종목 */}
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  수혜 종목
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.benefitStocks.map((stock) => (
                    <div key={stock.symbol} className="rounded-lg bg-neutral-800/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-300">{stock.name}</span>
                          <Badge variant="outline" className="border-neutral-600 text-neutral-400 text-[10px]">
                            {stock.symbol}
                          </Badge>
                          <Badge variant="outline" className="border-neutral-600 text-neutral-400 text-[10px]">
                            {stock.market}
                          </Badge>
                        </div>
                        <Badge
                          className={
                            stock.recommendation.action === 'BUY'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }
                        >
                          {stock.recommendation.action}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-neutral-400">{stock.reason}</p>
                      <div className="mt-3">
                        <ProbabilityBar value={stock.probability} />
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">
                        타이밍: {stock.recommendation.timing}
                        {stock.recommendation.targetPrice && ` | 목표가: ${stock.recommendation.targetPrice}`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 손해 종목 */}
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  손해 종목
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.harmStocks.map((stock) => (
                    <div key={stock.symbol} className="rounded-lg bg-neutral-800/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-300">{stock.name}</span>
                          <Badge variant="outline" className="border-neutral-600 text-neutral-400 text-[10px]">
                            {stock.symbol}
                          </Badge>
                          <Badge variant="outline" className="border-neutral-600 text-neutral-400 text-[10px]">
                            {stock.market}
                          </Badge>
                        </div>
                        <Badge
                          className={
                            stock.recommendation.action === 'SELL'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }
                        >
                          {stock.recommendation.action}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-neutral-400">{stock.reason}</p>
                      <div className="mt-3">
                        <ProbabilityBar value={stock.probability} />
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">타이밍: {stock.recommendation.timing}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Separator className="bg-neutral-800" />
            <p className="text-center text-xs text-neutral-600">
              본 분석은 AI 기반 참고 자료이며, 투자 결정의 최종 책임은 본인에게 있습니다.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
