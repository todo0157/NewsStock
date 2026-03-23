'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import {
  getPortfolio,
  getReports,
  deleteReport,
  calculatePortfolioRisk,
  getStockTimeline,
  type PortfolioStock,
  type SavedReport,
  type PortfolioRisk,
  type StockTimeline,
} from '@/lib/store';

type SentimentFilter = '전체' | '상승' | '하락' | '중립';
type TabType = 'reports' | 'risk' | 'timeline';

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [filter, setFilter] = useState<SentimentFilter>('전체');
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    setReports(getReports());
    setPortfolio(getPortfolio());

    const handleReports = () => setReports(getReports());
    const handlePortfolio = () => setPortfolio(getPortfolio());
    window.addEventListener('reports-updated', handleReports);
    window.addEventListener('portfolio-updated', handlePortfolio);
    return () => {
      window.removeEventListener('reports-updated', handleReports);
      window.removeEventListener('portfolio-updated', handlePortfolio);
    };
  }, []);

  // 필터링된 리포트
  const filteredReports = useMemo(() => {
    if (filter === '전체') return reports;
    return reports.filter((r) => r.sentiment === filter);
  }, [reports, filter]);

  // 포트폴리오 위험도
  const risk: PortfolioRisk = useMemo(() => calculatePortfolioRisk(portfolio, reports), [portfolio, reports]);

  // 선택된 종목의 타임라인
  const timeline: StockTimeline | null = useMemo(() => {
    if (!selectedStock) return null;
    const stock = portfolio.find((s) => s.symbol === selectedStock);
    if (!stock) return null;
    return getStockTimeline(stock.name, stock.symbol, reports);
  }, [selectedStock, portfolio, reports]);

  const handleDelete = (id: string) => {
    deleteReport(id);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return iso;
    }
  };

  const riskColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', label: '안전' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', label: '보통' };
    return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: '주의' };
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'reports', label: '분석 히스토리', icon: '📋' },
    { key: 'risk', label: '위험도 대시보드', icon: '🛡️' },
    { key: 'timeline', label: '종목별 타임라인', icon: '📈' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 헤더 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">분석 리포트</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          AI 분석 히스토리, 포트폴리오 위험도, 종목별 타임라인을 확인하세요.
        </p>
      </motion.div>

      {/* 탭 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1 rounded-xl border border-border bg-gray-100 p-1 dark:bg-gray-900"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ===================== 탭 1: 분석 히스토리 ===================== */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* 필터 */}
          <div className="flex gap-2">
            {(['전체', '상승', '하락', '중립'] as SentimentFilter[]).map((label) => (
              <button
                key={label}
                onClick={() => setFilter(label)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === label
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 리포트 목록 */}
          {filteredReports.length === 0 ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center dark:bg-gray-950">
              <p className="text-3xl">📊</p>
              <p className="mt-3 font-medium text-gray-600 dark:text-gray-300">아직 분석 리포트가 없습니다</p>
              <p className="mt-1 text-sm text-gray-400">AI 분석 탭에서 뉴스를 분석하면 여기에 자동 저장됩니다.</p>
              <Link
                href="/analyze"
                className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                AI 분석하러 가기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="rounded-xl border border-border bg-white transition-colors hover:border-primary/30 dark:bg-gray-950">
                    {/* 리포트 헤더 */}
                    <button
                      onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                              report.sentiment === '상승' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                : report.sentiment === '하락' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {report.sentiment === '상승' ? '📈' : report.sentiment === '하락' ? '📉' : '➡️'} {report.sentiment}
                            </span>
                            <span className="text-xs text-gray-400">신뢰도 {report.confidence}%</span>
                            {report.affectedPortfolioStocks.length > 0 && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                💼 내 종목 {report.affectedPortfolioStocks.length}개 영향
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{report.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{report.keyInsight}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{formatDate(report.date)}</span>
                          </div>
                        </div>
                        <span className="shrink-0 text-gray-400 transition-transform" style={{ transform: expandedReport === report.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                          ▼
                        </span>
                      </div>
                    </button>

                    {/* 확장된 상세 */}
                    <AnimatePresence>
                      {expandedReport === report.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 border-t border-border px-5 pb-5 pt-4">
                            {/* 포트폴리오 영향 */}
                            {report.affectedPortfolioStocks.length > 0 && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">💼 내 포트폴리오 영향</p>
                                {report.affectedPortfolioStocks.map((s) => (
                                  <div key={s.symbol} className="flex items-center justify-between py-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className={s.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                                        {s.impact === 'positive' ? '↑' : '↓'}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                        s.impact === 'positive'
                                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                      }`}>{s.action}</span>
                                      <span className="text-xs text-gray-400">{s.probability}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 숨겨진 의도 */}
                            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">🔮 숨겨진 의도</p>
                              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{report.hiddenIntent}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{report.hiddenIntentDetail}</p>
                            </div>

                            {/* 파장 분석 */}
                            <div className="grid gap-2 sm:grid-cols-3">
                              {report.impact.map((item) => (
                                <div key={item.label} className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-900">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                                    <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${
                                      item.severity === '높음' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                                    }`}>{item.severity}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                                </div>
                              ))}
                            </div>

                            {/* 수혜/손해 종목 간략 */}
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
                                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5">📈 수혜 {report.benefitStocks.length}종목</p>
                                {report.benefitStocks.map((s) => (
                                  <div key={s.symbol} className="flex items-center justify-between py-0.5">
                                    <span className="text-xs text-gray-700 dark:text-gray-300">{s.name}</span>
                                    <span className="text-xs text-green-600 dark:text-green-400">{s.action} {s.probability}%</span>
                                  </div>
                                ))}
                              </div>
                              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
                                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">📉 손해 {report.harmStocks.length}종목</p>
                                {report.harmStocks.map((s) => (
                                  <div key={s.symbol} className="flex items-center justify-between py-0.5">
                                    <span className="text-xs text-gray-700 dark:text-gray-300">{s.name}</span>
                                    <span className="text-xs text-red-600 dark:text-red-400">{s.action} {s.probability}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 삭제 */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleDelete(report.id)}
                                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                              >
                                리포트 삭제
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ===================== 탭 2: 위험도 대시보드 ===================== */}
      {activeTab === 'risk' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {portfolio.length === 0 ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center dark:bg-gray-950">
              <p className="text-3xl">💼</p>
              <p className="mt-3 font-medium text-gray-600 dark:text-gray-300">포트폴리오를 먼저 등록해주세요</p>
              <p className="mt-1 text-sm text-gray-400">포트폴리오를 등록하면 뉴스 분석 기반 위험도를 확인할 수 있습니다.</p>
              <Link
                href="/portfolio"
                className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                포트폴리오 등록하기
              </Link>
            </div>
          ) : (
            <>
              {/* 전체 안전도 */}
              <div className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">포트폴리오 안전도</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">최근 뉴스 분석 결과 기반</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${riskColor(risk.overallScore).text}`}>
                      {risk.overallScore}점
                    </p>
                    <p className={`text-sm font-medium ${riskColor(risk.overallScore).text}`}>
                      {riskColor(risk.overallScore).label}
                    </p>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${risk.overallScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${riskColor(risk.overallScore).bg}`}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-400">
                  <span>위험</span>
                  <span>보통</span>
                  <span>안전</span>
                </div>
              </div>

              {/* 종목별 위험도 */}
              <div className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">종목별 뉴스 신호</h3>
                {risk.stockRisks.length === 0 || risk.stockRisks.every((s) => s.positiveCount === 0 && s.negativeCount === 0) ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    아직 분석된 뉴스가 없습니다. AI 분석을 진행하면 종목별 신호가 나타납니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {risk.stockRisks.map((stock, i) => {
                      const total = stock.positiveCount + stock.negativeCount;
                      if (total === 0) return null;
                      return (
                        <motion.div
                          key={stock.symbol}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{stock.name}</span>
                              <span className="text-xs text-gray-400">{stock.symbol}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {stock.positiveCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                                  긍정 {stock.positiveCount}건
                                </span>
                              )}
                              {stock.negativeCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                                  부정 {stock.negativeCount}건
                                </span>
                              )}
                            </div>
                          </div>
                          {/* 감성 바 */}
                          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                            {stock.positiveCount > 0 && (
                              <div
                                className="bg-green-500 transition-all"
                                style={{ width: `${(stock.positiveCount / total) * 100}%` }}
                              />
                            )}
                            {stock.negativeCount > 0 && (
                              <div
                                className="bg-red-500 transition-all"
                                style={{ width: `${(stock.negativeCount / total) * 100}%` }}
                              />
                            )}
                          </div>
                          {/* 최근 리포트 */}
                          {stock.recentReports.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {stock.recentReports.slice(0, 3).map((r) => (
                                <div key={r.id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500 dark:text-gray-400 truncate max-w-[70%]">{r.title}</span>
                                  <span className="text-gray-400 shrink-0">{formatDate(r.date)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 분석 통계 */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-white p-5 text-center dark:bg-gray-950">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
                  <p className="mt-1 text-xs text-gray-500">총 분석 횟수</p>
                </div>
                <div className="rounded-xl border border-border bg-white p-5 text-center dark:bg-gray-950">
                  <p className="text-2xl font-bold text-green-600">{reports.filter((r) => r.sentiment === '상승').length}</p>
                  <p className="mt-1 text-xs text-gray-500">상승 리포트</p>
                </div>
                <div className="rounded-xl border border-border bg-white p-5 text-center dark:bg-gray-950">
                  <p className="text-2xl font-bold text-red-600">{reports.filter((r) => r.sentiment === '하락').length}</p>
                  <p className="mt-1 text-xs text-gray-500">하락 리포트</p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ===================== 탭 3: 종목별 타임라인 ===================== */}
      {activeTab === 'timeline' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {portfolio.length === 0 ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center dark:bg-gray-950">
              <p className="text-3xl">📈</p>
              <p className="mt-3 font-medium text-gray-600 dark:text-gray-300">포트폴리오를 먼저 등록해주세요</p>
              <Link
                href="/portfolio"
                className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                포트폴리오 등록하기
              </Link>
            </div>
          ) : (
            <>
              {/* 종목 선택 */}
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-950">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">종목을 선택하세요</p>
                <div className="flex flex-wrap gap-2">
                  {portfolio.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock.symbol === selectedStock ? null : stock.symbol)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        selectedStock === stock.symbol
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'border border-border text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
                      }`}
                    >
                      {stock.name}
                      <span className="ml-1.5 text-xs opacity-60">{stock.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 타임라인 */}
              {selectedStock && timeline && (
                <div className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {timeline.stockName} 뉴스 타임라인
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">관련 분석 리포트 {timeline.entries.length}건</p>

                  {timeline.entries.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400">이 종목에 대한 분석 리포트가 아직 없습니다.</p>
                      <p className="text-xs text-gray-400 mt-1">AI 분석에서 관련 뉴스를 분석하면 여기에 나타납니다.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* 세로선 */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

                      <div className="space-y-4">
                        {timeline.entries.map((entry, i) => (
                          <motion.div
                            key={entry.reportId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative pl-10"
                          >
                            {/* 점 */}
                            <div className={`absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-white dark:border-gray-950 ${
                              entry.impact === 'positive' ? 'bg-green-500' : 'bg-red-500'
                            }`} />

                            <div className="rounded-lg border border-border p-4 hover:border-primary/30 transition-colors">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                    entry.impact === 'positive'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  }`}>
                                    {entry.impact === 'positive' ? '📈 수혜' : '📉 손해'}
                                  </span>
                                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                    entry.impact === 'positive'
                                      ? 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400'
                                      : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                                  }`}>{entry.action}</span>
                                </div>
                                <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.title}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{entry.reason}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-gray-800">
                                  <div
                                    className={`h-full rounded-full ${entry.impact === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${entry.probability}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">{entry.probability}%</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedStock && (
                <div className="rounded-xl border border-border bg-white p-12 text-center dark:bg-gray-950">
                  <p className="text-sm text-gray-400">위에서 종목을 선택하면 해당 종목의 뉴스 타임라인이 표시됩니다.</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
