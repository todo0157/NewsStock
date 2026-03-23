'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getPortfolio, savePortfolio, type PortfolioStock } from '@/lib/store';

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

export default function PortfolioPage() {
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [error, setError] = useState('');
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');

  // 스크린샷 상태
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // 직접 입력 상태
  const [manualName, setManualName] = useState('');
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualMarket, setManualMarket] = useState('KR');

  // 로컬스토리지에서 포트폴리오 로드
  useEffect(() => {
    setStocks(getPortfolio());
  }, []);

  // 현재가 조회
  const fetchPrices = useCallback(async (stockList: PortfolioStock[]) => {
    const validStocks = stockList.filter((s) => s.symbol && s.symbol !== '-');
    if (validStocks.length === 0) return;

    setPriceLoading(true);
    setPriceError('');
    try {
      const res = await fetch('/api/stocks/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: validStocks.map((s) => ({ symbol: s.symbol, market: s.market })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPriceError(data.error || '시세 조회 실패');
      } else {
        setPrices(data.prices || {});
      }
    } catch {
      setPriceError('시세 서버에 연결할 수 없습니다. API 키를 확인해주세요.');
    }
    setPriceLoading(false);
  }, []);

  // 종목이 있으면 현재가 자동 조회
  useEffect(() => {
    if (stocks.length > 0) {
      fetchPrices(stocks);
    }
  }, [stocks, fetchPrices]);

  // stocks 변경 시 로컬스토리지에 저장
  const updateStocks = (newStocks: PortfolioStock[]) => {
    setStocks(newStocks);
    savePortfolio(newStocks);
  };

  // 스크린샷 선택
  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  // 스크린샷 AI 분석
  const handleScreenshotAnalyze = async () => {
    if (!screenshotFile) return;
    setAnalyzing(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshotFile);
      const res = await fetch('/api/stocks/screenshot', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '분석에 실패했습니다.');
        setAnalyzing(false);
        return;
      }
      const newStocks = [...stocks, ...(data.stocks || [])];
      updateStocks(newStocks);
      setScreenshotFile(null);
      setScreenshotPreview('');
    } catch {
      setError('서버 오류가 발생했습니다.');
    }
    setAnalyzing(false);
  };

  // 직접 입력
  const handleManualAdd = () => {
    if (!manualName) {
      setError('종목명을 입력해주세요.');
      return;
    }
    const newStocks = [
      ...stocks,
      {
        name: manualName,
        symbol: manualSymbol || '-',
        quantity: Number(manualQuantity) || 0,
        avgPrice: Number(manualPrice) || 0,
        market: manualMarket,
      },
    ];
    updateStocks(newStocks);
    setManualName('');
    setManualSymbol('');
    setManualQuantity('');
    setManualPrice('');
    setError('');
  };

  // 종목 삭제
  const handleRemove = (index: number) => {
    updateStocks(stocks.filter((_, i) => i !== index));
  };

  // 수익률 계산
  const getReturn = (avgPrice: number, currentPrice: number) => {
    if (!avgPrice || !currentPrice) return null;
    const diff = currentPrice - avgPrice;
    const percent = (diff / avgPrice) * 100;
    return { diff, percent };
  };

  // 포맷팅
  const formatPrice = (price: number, market: string) => {
    if (market === 'US') return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${price.toLocaleString()}원`;
  };

  const inputClass =
    'w-full rounded-lg border border-border bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500';

  // 전체 포트폴리오 요약
  const portfolioSummary = stocks.reduce(
    (acc, stock) => {
      const price = prices[stock.symbol];
      if (price && stock.avgPrice > 0 && stock.quantity > 0) {
        const invested = stock.avgPrice * stock.quantity;
        const current = price.currentPrice * stock.quantity;
        acc.totalInvested += invested;
        acc.totalCurrent += current;
        acc.hasData = true;
      }
      return acc;
    },
    { totalInvested: 0, totalCurrent: 0, hasData: false }
  );

  const totalReturn = portfolioSummary.hasData
    ? {
        diff: portfolioSummary.totalCurrent - portfolioSummary.totalInvested,
        percent: ((portfolioSummary.totalCurrent - portfolioSummary.totalInvested) / portfolioSummary.totalInvested) * 100,
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">포트폴리오</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          스크린샷 분석 또는 직접 입력으로 포트폴리오를 관리하세요.
        </p>
      </motion.div>

      {/* ====== 포트폴리오 요약 (종목이 있을 때만) ====== */}
      <AnimatePresence>
        {stocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* 전체 수익률 카드 */}
            {totalReturn && (
              <div className={`rounded-xl border p-5 ${
                totalReturn.diff >= 0
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">총 평가 수익률</p>
                    <p className={`text-2xl font-bold ${totalReturn.diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {totalReturn.diff >= 0 ? '+' : ''}{totalReturn.percent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">투자 금액</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{portfolioSummary.totalInvested.toLocaleString()}원</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">평가 금액</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{portfolioSummary.totalCurrent.toLocaleString()}원</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <p className={`text-sm font-medium ${totalReturn.diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {totalReturn.diff >= 0 ? '+' : ''}{totalReturn.diff.toLocaleString()}원
                  </p>
                  <button
                    onClick={() => fetchPrices(stocks)}
                    disabled={priceLoading}
                    className="ml-auto rounded-lg px-3 py-1 text-xs text-gray-500 transition-colors hover:bg-white/50 dark:hover:bg-black/30"
                  >
                    {priceLoading ? '새로고침 중...' : '시세 새로고침'}
                  </button>
                </div>
              </div>
            )}

            {/* 시세 로딩/에러 */}
            {priceLoading && !totalReturn && (
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-950">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-gray-500">현재가 조회 중...</span>
                </div>
              </div>
            )}
            {priceError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-sm text-amber-700 dark:text-amber-300">{priceError}</p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  .env.local에 KIS_APP_KEY, KIS_APP_SECRET (한국) 또는 FINNHUB_API_KEY (미국)를 설정하세요.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 포트폴리오 종목 목록 (현재가 + 수익률) ====== */}
      <AnimatePresence>
        {stocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                내 포트폴리오 ({stocks.length}종목)
              </h2>
              {!priceLoading && Object.keys(prices).length === 0 && stocks.some((s) => s.symbol !== '-') && (
                <button
                  onClick={() => fetchPrices(stocks)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
                >
                  현재가 조회
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {stocks.map((stock, i) => {
                const price = prices[stock.symbol];
                const returnData = price && stock.avgPrice > 0 ? getReturn(stock.avgPrice, price.currentPrice) : null;

                return (
                  <motion.div
                    key={`${stock.symbol}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group rounded-lg border border-border p-4 transition-colors hover:border-primary/20"
                  >
                    {/* 상단: 종목명 + 시장 + 삭제 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{stock.name}</span>
                        {stock.symbol !== '-' && (
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{stock.symbol}</span>
                        )}
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${stock.market === 'KR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'}`}>
                          {stock.market === 'KR' ? '한국' : '미국'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemove(i)}
                        className="text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 가격 정보 */}
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {/* 매입가 */}
                      <div>
                        <p className="text-xs text-gray-400">매입가</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stock.avgPrice > 0 ? formatPrice(stock.avgPrice, stock.market) : '-'}
                        </p>
                      </div>

                      {/* 현재가 */}
                      <div>
                        <p className="text-xs text-gray-400">현재가</p>
                        {priceLoading ? (
                          <div className="mt-0.5 h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                        ) : price ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(price.currentPrice, stock.market)}
                            </p>
                            <p className={`text-xs ${price.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              전일대비 {price.change >= 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">-</p>
                        )}
                      </div>

                      {/* 보유수량 */}
                      <div>
                        <p className="text-xs text-gray-400">보유</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stock.quantity > 0 ? `${stock.quantity}주` : '-'}
                        </p>
                      </div>

                      {/* 수익률 */}
                      <div>
                        <p className="text-xs text-gray-400">수익률</p>
                        {returnData ? (
                          <div>
                            <p className={`text-sm font-bold ${returnData.percent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {returnData.percent >= 0 ? '+' : ''}{returnData.percent.toFixed(2)}%
                            </p>
                            {stock.quantity > 0 && (
                              <p className={`text-xs ${returnData.diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {returnData.diff >= 0 ? '+' : ''}{(returnData.diff * stock.quantity).toLocaleString()}원
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">-</p>
                        )}
                      </div>
                    </div>

                    {/* 수익률 바 */}
                    {returnData && (
                      <div className="mt-3">
                        <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                          {returnData.percent >= 0 ? (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(returnData.percent, 100)}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="absolute left-0 top-0 h-full rounded-full bg-green-500"
                            />
                          ) : (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(Math.abs(returnData.percent), 100)}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="absolute right-0 top-0 h-full rounded-full bg-red-500"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 1. 스크린샷 분석 ====== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">1</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">스크린샷으로 연동하기</h2>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          증권 앱의 보유종목 화면을 캡처해서 올려주세요. AI가 자동으로 분석합니다.
        </p>

        <div className="mt-4 space-y-4">
          {screenshotPreview ? (
            <div className="relative">
              <img src={screenshotPreview} alt="스크린샷 미리보기" className="max-h-80 w-full rounded-lg border border-border object-contain" />
              <button
                onClick={() => { setScreenshotFile(null); setScreenshotPreview(''); }}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 transition-colors hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-900">
              <p className="text-3xl">📸</p>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">클릭하여 스크린샷 업로드</p>
              <p className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP 지원</p>
              <input type="file" accept="image/*" onChange={handleScreenshotSelect} className="hidden" />
            </label>
          )}

          {screenshotFile && (
            <button
              onClick={handleScreenshotAnalyze}
              disabled={analyzing}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {analyzing ? 'AI 분석 중...' : 'AI로 분석하기'}
            </button>
          )}
        </div>
      </motion.div>

      {/* ====== 구분선 ====== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 px-2"
      >
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">스크린샷이 없다면?</span>
        <div className="h-px flex-1 bg-border" />
      </motion.div>

      {/* ====== 2. 직접 입력 ====== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">2</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">직접 입력하기</h2>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="종목명 (예: 삼성전자)" className={inputClass} />
            <input type="text" value={manualSymbol} onChange={(e) => setManualSymbol(e.target.value)} placeholder="종목코드 (예: 005930)" className={inputClass} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="number" value={manualQuantity} onChange={(e) => setManualQuantity(e.target.value)} placeholder="수량" className={inputClass} />
            <input type="number" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder="평균 매입가" className={inputClass} />
            <div className="flex gap-2">
              {['KR', 'US'].map((m) => (
                <button
                  key={m}
                  onClick={() => setManualMarket(m)}
                  className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
                    manualMarket === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
                  }`}
                >
                  {m === 'KR' ? '한국' : '미국'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleManualAdd}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            종목 추가
          </button>
        </div>
      </motion.div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
