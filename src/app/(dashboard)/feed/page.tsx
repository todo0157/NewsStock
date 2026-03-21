'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function getUser(): User | null {
  const match = document.cookie.match(/(?:^|; )user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

const mockNews = [
  { id: '1', title: '정부, 반도체 산업 세제 혜택 확대 발표', source: '한국경제', category: '정책', time: '2시간 전', sentiment: '상승' },
  { id: '2', title: '삼성전자, HBM4 양산 시작… SK하이닉스와 격차 좁히기', source: '조선비즈', category: '기업', time: '3시간 전', sentiment: '상승' },
  { id: '3', title: '미 연준, 금리 동결 시사… "인플레이션 아직 높아"', source: '연합뉴스', category: '글로벌', time: '4시간 전', sentiment: '하락' },
  { id: '4', title: '네이버, AI 검색 서비스 전면 개편… 광고 수익 영향 주목', source: '매일경제', category: '기업', time: '5시간 전', sentiment: '중립' },
  { id: '5', title: '전기차 보조금 축소 확정… 현대·기아 판매 전략 수정 불가피', source: '서울경제', category: '정책', time: '6시간 전', sentiment: '하락' },
  { id: '6', title: '카카오뱅크, 해외 송금 수수료 무료화 선언', source: '디지털타임스', category: '기업', time: '7시간 전', sentiment: '상승' },
];

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 인사 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          안녕하세요, {user?.name || '사용자'}님 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          오늘의 뉴스와 시장 분석을 확인하세요.
        </p>
      </motion.div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: '오늘의 뉴스', value: '6건', sub: '최근 24시간' },
          { label: 'AI 분석', value: '3건', sub: '이번 주 분석' },
          { label: '포트폴리오', value: '5종목', sub: '등록된 종목' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="rounded-xl border border-border bg-white p-5 dark:bg-gray-950"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* 뉴스 피드 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl border border-border bg-white dark:bg-gray-950"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">최근 뉴스</h2>
          <div className="flex gap-2">
            {['전체', '정책', '기업', '글로벌'].map((tab, i) => (
              <button
                key={tab}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  i === 0
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {mockNews.map((news, i) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <Link href={`/analyze`} className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">{news.category}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      news.sentiment === '상승' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : news.sentiment === '하락' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>{news.sentiment}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{news.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{news.source}</span>
                    <span>·</span>
                    <span>{news.time}</span>
                  </div>
                </div>
                <span className="mt-2 shrink-0 text-gray-300 dark:text-gray-600">→</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
