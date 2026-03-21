'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const mockReports = [
  { id: '1', title: '정부, 반도체 산업 세제 혜택 확대 발표', insight: '반도체 기업 수혜 예상, 특히 메모리 업체 실적 개선 기대', sentiment: '상승', confidence: 78, source: '한국경제', date: '2026.03.22' },
  { id: '2', title: '미 연준, 금리 동결 시사… "인플레이션 아직 높아"', insight: '성장주 부담, 은행·보험주 수혜 가능성', sentiment: '하락', confidence: 72, source: '연합뉴스', date: '2026.03.21' },
  { id: '3', title: '전기차 보조금 축소 확정', insight: '현대·기아 판매 전략 수정 불가피, 2차전지주 단기 약세', sentiment: '하락', confidence: 80, source: '서울경제', date: '2026.03.20' },
  { id: '4', title: '네이버, AI 검색 서비스 전면 개편', insight: 'AI 전환 가속화, 단기 비용 증가 vs 장기 성장 기대', sentiment: '중립', confidence: 65, source: '매일경제', date: '2026.03.19' },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">분석 리포트</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          AI가 분석한 뉴스 리포트 히스토리를 확인하세요.
        </p>
      </motion.div>

      {/* 필터 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        {['전체', '상승', '하락', '중립'].map((label, i) => (
          <button
            key={label}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              i === 0
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* 리포트 목록 */}
      <div className="space-y-3">
        {mockReports.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
          >
            <Link href="/analyze" className="block rounded-xl border border-border bg-white p-5 transition-colors hover:border-primary/30 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      report.sentiment === '상승' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : report.sentiment === '하락' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {report.sentiment === '상승' ? '📈' : report.sentiment === '하락' ? '📉' : '➡️'} {report.sentiment}
                    </span>
                    <span className="text-xs text-gray-400">신뢰도 {report.confidence}%</span>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{report.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{report.insight}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{report.source}</span>
                    <span>·</span>
                    <span>{report.date}</span>
                  </div>
                </div>
                <button className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                  PDF
                </button>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
