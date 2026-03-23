'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getPortfolio, type PortfolioStock } from '@/lib/store';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// ── Types ──

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

interface PriceData {
  currentPrice: number;
  change: number;
  changePercent: number;
  name: string;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
}

type HistoryPeriod = '1W' | '1M' | '3M' | '6M' | '1Y';
type ChartTarget = { type: 'index'; code: 'KOSPI' | 'KOSDAQ' } | { type: 'stock'; stock: PortfolioStock };

// ══════════════════════════════════════════
//  Chart Page
// ══════════════════════════════════════════

export default function ChartPage() {
  // 포트폴리오
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});

  // 선택 상태
  const [target, setTarget] = useState<ChartTarget>({ type: 'index', code: 'KOSPI' });
  const [period, setPeriod] = useState<HistoryPeriod>('1M');
  const [chartMode, setChartMode] = useState<'price' | 'volume'>('price');

  // 지수 데이터
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 포트폴리오 로드
  useEffect(() => {
    const stocks = getPortfolio().filter((s) => s.symbol && s.symbol !== '-');
    setPortfolioStocks(stocks);

    // 현재가 조회
    if (stocks.length > 0) {
      fetch('/api/stocks/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: stocks.map((s) => ({ symbol: s.symbol, market: s.market })) }),
      })
        .then((r) => r.json())
        .then((d) => setPrices(d.prices || {}))
        .catch(() => {});
    }
  }, []);

  // 차트 데이터 로드
  const fetchChartData = useCallback(async (t: ChartTarget, p: HistoryPeriod) => {
    setLoading(true);
    setError('');
    setChartData([]);
    setIndexData(null);

    try {
      if (t.type === 'index') {
        const res = await fetch(`/api/stocks/index?type=${t.code}&period=${p}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '지수 조회 실패');
        } else {
          setIndexData(data.index);
          setChartData(
            (data.candles || []).map((c: CandleData) => ({ ...c, date: fmtDate(c.date) }))
          );
        }
      } else {
        const res = await fetch(
          `/api/stocks/${t.stock.symbol}/history?market=${t.stock.market}&period=${p}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '시세 조회 실패');
        } else {
          const candles: CandleData[] = (data.history?.candles || [])
            .map((c: CandleData) => ({ ...c, date: fmtDate(c.date) }))
            .sort((a: CandleData, b: CandleData) => a.date.localeCompare(b.date));
          setChartData(candles);
        }
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChartData(target, period);
  }, [target, period, fetchChartData]);

  // 현재 선택 정보
  const currentLabel =
    target.type === 'index'
      ? target.code
      : target.stock.name;

  const currentPrice =
    target.type === 'index'
      ? indexData
        ? { value: indexData.value, change: indexData.change, changePercent: indexData.changePercent, high: indexData.high, low: indexData.low, volume: indexData.volume }
        : null
      : prices[target.stock.symbol]
        ? { value: prices[target.stock.symbol].currentPrice, change: prices[target.stock.symbol].change, changePercent: prices[target.stock.symbol].changePercent, high: prices[target.stock.symbol].high, low: prices[target.stock.symbol].low, volume: prices[target.stock.symbol].volume }
        : null;

  const isStock = target.type === 'stock';
  const market = isStock ? target.stock.market : 'KR';

  const fmtPrice = (v: number) => {
    if (isStock && market === 'US') return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (isStock) return `${v.toLocaleString()}원`;
    return v.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 차트 색상
  const isUp = chartData.length > 1 ? chartData[chartData.length - 1].close >= chartData[0].close : true;
  const lineColor = isUp ? '#22c55e' : '#ef4444';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 헤더 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">차트</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          KOSPI/KOSDAQ 지수와 포트폴리오 종목의 실시간 차트를 확인하세요.
        </p>
      </motion.div>

      {/* ====== 지수 카드 ====== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {(['KOSPI', 'KOSDAQ'] as const).map((code) => {
          const isActive = target.type === 'index' && target.code === code;
          return (
            <button
              key={code}
              onClick={() => setTarget({ type: 'index', code })}
              className={`rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-white hover:border-primary/30 dark:bg-gray-950 dark:hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{code}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  code === 'KOSPI'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                }`}>
                  지수
                </span>
              </div>
              {isActive && indexData && indexData.name === code ? (
                <div className="mt-2">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {indexData.value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs font-medium ${indexData.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {indexData.change >= 0 ? '+' : ''}{indexData.change.toFixed(2)} ({indexData.changePercent >= 0 ? '+' : ''}{indexData.changePercent.toFixed(2)}%)
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-400">클릭하여 조회</p>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ====== 포트폴리오 종목 선택 ====== */}
      {portfolioStocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-white p-4 dark:bg-gray-950"
        >
          <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">내 포트폴리오 종목</h3>
          <div className="flex flex-wrap gap-2">
            {portfolioStocks.map((stock, i) => {
              const isActive = target.type === 'stock' && target.stock.symbol === stock.symbol;
              const price = prices[stock.symbol];
              return (
                <button
                  key={`${stock.symbol}-${i}`}
                  onClick={() => setTarget({ type: 'stock', stock })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border text-gray-700 hover:border-primary/30 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900'
                  }`}
                >
                  <span>{stock.name}</span>
                  <span className="text-xs text-gray-400">{stock.symbol}</span>
                  {price && (
                    <span className={`text-xs font-bold ${price.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {price.change >= 0 ? '+' : ''}{price.changePercent.toFixed(1)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ====== 차트 영역 ====== */}
      <motion.div
        key={`${target.type}-${target.type === 'index' ? target.code : target.stock.symbol}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
      >
        {/* 차트 헤더 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {currentLabel}
              {isStock && (
                <span className="ml-2 text-sm font-normal text-gray-400">{target.stock.symbol}</span>
              )}
            </h2>
            {currentPrice && (
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {fmtPrice(currentPrice.value)}
                </span>
                <span className={`text-sm font-bold ${currentPrice.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {currentPrice.change >= 0 ? '+' : ''}
                  {isStock ? currentPrice.change.toLocaleString() : currentPrice.change.toFixed(2)}
                  ({currentPrice.changePercent >= 0 ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {/* 기간 선택 */}
          <div className="flex gap-1 rounded-lg border border-border bg-gray-100 p-1 dark:bg-gray-900">
            {(['1W', '1M', '3M', '6M', '1Y'] as HistoryPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 주가 / 거래량 토글 */}
        <div className="mt-4 flex gap-1">
          {[
            { key: 'price' as const, label: target.type === 'index' ? '지수' : '주가' },
            { key: 'volume' as const, label: '거래량' },
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setChartMode(mode.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                chartMode === mode.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* 차트 */}
        <div className="mt-4">
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-gray-500">차트 데이터 로딩 중...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-80 items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={() => fetchChartData(target, period)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-80 items-center justify-center">
              <p className="text-sm text-gray-400">데이터가 없습니다.</p>
            </div>
          ) : chartMode === 'price' ? (
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(val: number) =>
                    isStock && market === 'US'
                      ? `$${val.toLocaleString()}`
                      : val.toLocaleString()
                  }
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [fmtPrice(value), target.type === 'index' ? '지수' : '종가']}
                  labelFormatter={(label: string) => `날짜: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="url(#gradClose)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) =>
                    val >= 1000000000
                      ? `${(val / 1000000000).toFixed(1)}B`
                      : val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}K`
                      : val.toString()
                  }
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()}주`, '거래량']}
                  labelFormatter={(label: string) => `날짜: ${label}`}
                />
                <Bar dataKey="volume" fill="#6366f1" radius={[2, 2, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 시세 상세 */}
        {currentPrice && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '고가', value: fmtPrice(currentPrice.high) },
              { label: '저가', value: fmtPrice(currentPrice.low) },
              { label: '거래량', value: `${currentPrice.volume.toLocaleString()}주` },
              {
                label: '등락',
                value: `${currentPrice.change >= 0 ? '+' : ''}${currentPrice.changePercent.toFixed(2)}%`,
                color: currentPrice.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className={`mt-0.5 text-sm font-medium ${'color' in item && item.color ? item.color : 'text-gray-900 dark:text-white'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 기간 정보 */}
        {chartData.length > 0 && (
          <p className="mt-3 text-right text-xs text-gray-400">
            {chartData[0].date} ~ {chartData[chartData.length - 1].date} ({chartData.length}일)
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ── 유틸 ──

function fmtDate(raw: string): string {
  if (raw.length === 8) return `${raw.slice(4, 6)}/${raw.slice(6, 8)}`;
  if (raw.includes('-')) {
    const parts = raw.split('-');
    return `${parts[1]}/${parts[2]}`;
  }
  return raw;
}
