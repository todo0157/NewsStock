'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Trash2, Pencil, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockPortfolio } from '@/lib/mock-data';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

interface PortfolioItem {
  id: string;
  stockSymbol: string;
  stockName: string;
  market: 'KR' | 'US';
  weight: number;
  avgPrice: number | null;
}

interface Portfolio {
  id: string;
  name: string;
  items: PortfolioItem[];
}

export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStock, setNewStock] = useState<{ symbol: string; name: string; market: 'KR' | 'US'; weight: number }>({
    symbol: '', name: '', market: 'KR', weight: 10,
  });

  // 포트폴리오 조회 (DB 없을 때 목 데이터 폴백)
  const { data: portfolioData } = useQuery<{ portfolios: Portfolio[] }>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.portfolios?.length > 0) return data;
        throw new Error('empty');
      } catch {
        return { portfolios: [mockPortfolio as Portfolio] };
      }
    },
  });

  const portfolio = portfolioData?.portfolios?.[0];
  const items = portfolio?.items ?? [];

  // 종목 추가
  const addMutation = useMutation({
    mutationFn: async (stock: typeof newStock) => {
      if (!portfolio?.id) return;
      const res = await fetch(`/api/portfolio/${portfolio.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockSymbol: stock.symbol,
          stockName: stock.name,
          market: stock.market,
          weight: stock.weight,
        }),
      });
      if (!res.ok) throw new Error('종목 추가 실패');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  // 종목 삭제
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!portfolio?.id) return;
      const res = await fetch(`/api/portfolio/${portfolio.id}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error('종목 삭제 실패');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  // 종목 검색
  const { data: searchResults } = useQuery({
    queryKey: ['stockSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 1) return { results: [] };
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) return { results: [] };
      return res.json();
    },
    enabled: searchQuery.length >= 1,
  });

  const chartData = items.map((item) => ({ name: item.stockName, value: item.weight }));
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  function handleAdd() {
    if (!newStock.name) return;
    addMutation.mutate(newStock);
    setNewStock({ symbol: '', name: '', market: 'KR', weight: 10 });
    setSearchQuery('');
    setDialogOpen(false);
  }

  function selectSearchResult(result: { symbol: string; name: string; market: 'KR' | 'US' }) {
    setNewStock((prev) => ({ ...prev, symbol: result.symbol, name: result.name, market: result.market }));
    setSearchQuery(result.name);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">포트폴리오</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />종목 추가
          </DialogTrigger>
          <DialogContent className="border-neutral-700 bg-neutral-900">
            <DialogHeader>
              <DialogTitle>종목 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">종목 검색</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="삼성전자 또는 NVDA"
                    className="border-neutral-700 bg-neutral-800 pl-9"
                  />
                </div>
                {/* 검색 결과 */}
                {searchResults?.results?.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-800">
                    {searchResults.results.slice(0, 8).map((r: { symbol: string; name: string; market: 'KR' | 'US' }) => (
                      <button
                        key={`${r.market}-${r.symbol}`}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-700"
                        onClick={() => selectSearchResult(r)}
                      >
                        <span>{r.name}</span>
                        <span className="text-xs text-neutral-500">{r.symbol} · {r.market}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {newStock.name && (
                <div className="rounded-lg bg-neutral-800 p-3 text-sm">
                  선택: <span className="font-medium">{newStock.name}</span> ({newStock.symbol}, {newStock.market})
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm text-neutral-400">시장</label>
                  <div className="mt-1 flex gap-2">
                    {(['KR', 'US'] as const).map((m) => (
                      <Button
                        key={m}
                        variant={newStock.market === m ? 'default' : 'outline'}
                        size="sm"
                        className={newStock.market !== m ? 'border-neutral-700 bg-neutral-800' : ''}
                        onClick={() => setNewStock((prev) => ({ ...prev, market: m }))}
                      >
                        {m === 'KR' ? '한국' : '미국'}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="w-24">
                  <label className="text-sm text-neutral-400">비중 (%)</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newStock.weight}
                    onChange={(e) => setNewStock((prev) => ({ ...prev, weight: Number(e.target.value) }))}
                    className="mt-1 border-neutral-700 bg-neutral-800"
                  />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newStock.name || addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-neutral-800 bg-neutral-900/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">포트폴리오 구성</CardTitle></CardHeader>
          <CardContent>
            {items.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`${value}%`, '비중']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-60 items-center justify-center text-neutral-500">종목을 추가해주세요</div>
            )}
            {totalWeight !== 100 && items.length > 0 && (
              <p className="mt-2 text-center text-xs text-yellow-400">총 비중: {totalWeight}% (100%가 아닙니다)</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3 lg:col-span-3">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-neutral-800 bg-neutral-900/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.stockName}</span>
                          <Badge variant="outline" className="border-neutral-700 text-neutral-400 text-[10px]">{item.stockSymbol}</Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${item.market === 'KR' ? 'border-blue-800 text-blue-400' : 'border-green-800 text-green-400'}`}
                          >
                            {item.market}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500">비중 {item.weight}%</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-500 hover:text-red-400"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 py-16 text-neutral-500">
              <Pencil className="mb-2 h-8 w-8" />
              <p>포트폴리오가 비어있습니다</p>
              <p className="text-sm">종목을 추가하여 뉴스 연관 분석을 받으세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
