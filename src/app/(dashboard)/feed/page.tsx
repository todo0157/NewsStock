'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Newspaper, Clock, ExternalLink, AlertTriangle, RefreshCw, Inbox } from 'lucide-react';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

interface FeedArticle {
  title: string;
  url: string;
  source: string | null;
  summary: string | null;
  category: string | null;
  publishedAt: string | null;
  isAnalyzed?: boolean;
}

interface FeedResponse {
  articles: FeedArticle[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  errors?: { source: string; error: string }[];
}

export default function FeedPage() {
  const [tab, setTab] = useState<'all' | 'portfolio'>('all');
  const [page, setPage] = useState(1);
  const [allArticles, setAllArticles] = useState<FeedArticle[]>([]);

  const { data, isLoading, isError, refetch } = useQuery<FeedResponse>({
    queryKey: ['feed', page],
    queryFn: async () => {
      const res = await fetch(`/api/news/feed?page=${page}&limit=20`);
      if (!res.ok) throw new Error('피드 로딩 실패');
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.articles) {
      setAllArticles((prev) => {
        if (page === 1) return data.articles;
        const urls = new Set(prev.map((a) => a.url));
        const newOnes = data.articles.filter((a) => !urls.has(a.url));
        return [...prev, ...newOnes];
      });
    }
  }, [data, page]);

  const hasMore = data?.pagination ? page < data.pagination.totalPages : false;

  const lastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !hasMore || isLoading) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setPage((p) => p + 1);
        },
        { threshold: 0.5 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [hasMore, isLoading]
  );

  const articles = tab === 'portfolio'
    ? allArticles.filter((_, i) => i % 3 === 0)
    : allArticles;

  // 에러 상태
  if (isError && allArticles.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 py-20 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-red-400" />
          <p className="text-lg font-medium">뉴스 피드를 불러올 수 없습니다</p>
          <p className="mt-1 text-sm text-neutral-500">네트워크 연결을 확인하고 다시 시도해주세요</p>
          <Button variant="outline" className="mt-4 border-neutral-700" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">뉴스 피드</h1>
          {data?.pagination && (
            <span className="text-sm text-neutral-500">{data.pagination.total}개 기사</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white"
            onClick={() => { setPage(1); setAllArticles([]); refetch(); }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'portfolio')}>
            <TabsList className="bg-neutral-900">
              <TabsTrigger value="all" className="data-[state=active]:bg-neutral-700">전체</TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-neutral-700">포트폴리오</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* RSS 소스 에러 표시 */}
      {data?.errors && data.errors.length > 0 && (
        <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3 text-xs text-yellow-400">
          일부 뉴스 소스 연결 실패: {data.errors.map((e) => e.source).join(', ')}
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {isLoading && page === 1 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-900" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        /* 빈 상태 */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 py-20">
          <Inbox className="mb-3 h-10 w-10 text-neutral-600" />
          <p className="text-neutral-400">
            {tab === 'portfolio' ? '포트폴리오 관련 뉴스가 없습니다' : '뉴스가 없습니다'}
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {articles.map((article, idx) => (
              <motion.div
                key={article.url}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.2) }}
              >
                <Link href={`/analyze?url=${encodeURIComponent(article.url)}`}>
                  <Card className="group border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-900">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {tab === 'portfolio' && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="mr-1 h-3 w-3" />관련
                            </Badge>
                          )}
                          {article.category && (
                            <Badge variant="outline" className="border-neutral-700 text-neutral-400 text-[10px]">
                              {article.category}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold leading-snug text-neutral-100 group-hover:text-white">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="line-clamp-2 text-sm text-neutral-500">{article.summary}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          {article.source && (
                            <span className="flex items-center gap-1">
                              <Newspaper className="h-3 w-3" />{article.source}
                            </span>
                          )}
                          {article.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{timeAgo(new Date(article.publishedAt))}
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-neutral-600 group-hover:text-neutral-400" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
            {hasMore && <div ref={lastRef} className="h-10" />}
            {hasMore && (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
