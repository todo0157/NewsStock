'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockReports } from '@/lib/mock-data';

const sentimentConfig = {
  BULLISH: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', label: '상승' },
  BEARISH: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', label: '하락' },
  NEUTRAL: { icon: Minus, color: 'text-neutral-400', bg: 'bg-neutral-500/10', label: '중립' },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function ReportsPage() {
  const [filter, setFilter] = useState('all');

  const reports = filter === 'all'
    ? mockReports
    : mockReports.filter((r) => r.sentiment === filter);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">분석 리포트</h1>
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="w-32 border-neutral-700 bg-neutral-900">
            <SelectValue placeholder="필터" />
          </SelectTrigger>
          <SelectContent className="border-neutral-700 bg-neutral-900">
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="BULLISH">상승</SelectItem>
            <SelectItem value="BEARISH">하락</SelectItem>
            <SelectItem value="NEUTRAL">중립</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 py-20 text-neutral-500">
          <FileText className="mb-3 h-10 w-10" />
          <p className="text-lg">분석 리포트가 없습니다</p>
          <p className="mt-1 text-sm">뉴스를 분석하면 여기에 리포트가 저장됩니다</p>
          <Link href="/analyze">
            <Button className="mt-4" variant="outline">
              뉴스 분석하러 가기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, idx) => {
            const sentiment = sentimentConfig[report.sentiment];
            const Icon = sentiment.icon;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Link href={`/analyze?mock=${report.id}`}>
                  <Card className="group border-neutral-800 bg-neutral-900/50 transition-colors hover:border-neutral-700 hover:bg-neutral-900">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 rounded-lg p-2 ${sentiment.bg}`}>
                          <Icon className={`h-5 w-5 ${sentiment.color}`} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold leading-snug text-neutral-100 group-hover:text-white">
                            {report.newsTitle}
                          </h3>
                          <p className="text-sm text-neutral-400">{report.keyInsight}</p>
                          <div className="flex items-center gap-3 pt-1">
                            <Badge variant="outline" className="border-neutral-700 text-neutral-400 text-[10px]">
                              {report.source}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(new Date(report.createdAt))}
                            </span>
                            <Badge className={`${sentiment.bg} ${sentiment.color} text-[10px]`}>
                              {sentiment.label}
                            </Badge>
                            <span className="text-xs text-neutral-500">
                              신뢰도 {report.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
