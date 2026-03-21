'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Stock {
  name: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  market: string;
}

export default function PortfolioPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [error, setError] = useState('');

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
      setStocks((prev) => [...prev, ...(data.stocks || [])]);
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
    setStocks((prev) => [
      ...prev,
      {
        name: manualName,
        symbol: manualSymbol || '-',
        quantity: Number(manualQuantity) || 0,
        avgPrice: Number(manualPrice) || 0,
        market: manualMarket,
      },
    ]);
    setManualName('');
    setManualSymbol('');
    setManualQuantity('');
    setManualPrice('');
    setError('');
  };

  // 종목 삭제
  const handleRemove = (index: number) => {
    setStocks((prev) => prev.filter((_, i) => i !== index));
  };

  const inputClass =
    'w-full rounded-lg border border-border bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">포트폴리오</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          스크린샷 분석 또는 직접 입력으로 포트폴리오를 관리하세요.
        </p>
      </motion.div>

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

      {/* ====== 포트폴리오 목록 ====== */}
      <AnimatePresence>
        {stocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              내 포트폴리오 ({stocks.length}종목)
            </h2>

            <div className="mt-4 space-y-2">
              <div className="hidden grid-cols-6 gap-2 px-3 text-xs font-medium text-gray-400 sm:grid">
                <span className="col-span-2">종목명</span>
                <span>코드</span>
                <span className="text-right">수량</span>
                <span className="text-right">평균가</span>
                <span className="text-right">시장</span>
              </div>

              {stocks.map((stock, i) => (
                <motion.div
                  key={`${stock.symbol}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group grid grid-cols-2 items-center gap-2 rounded-lg border border-border px-3 py-3 sm:grid-cols-6"
                >
                  <span className="col-span-2 font-medium text-gray-900 dark:text-white">{stock.name}</span>
                  <span className="text-sm text-gray-500">{stock.symbol}</span>
                  <span className="text-right text-sm text-gray-700 dark:text-gray-300">{stock.quantity > 0 ? `${stock.quantity}주` : '-'}</span>
                  <span className="text-right text-sm text-gray-700 dark:text-gray-300">{stock.avgPrice > 0 ? `${stock.avgPrice.toLocaleString()}원` : '-'}</span>
                  <div className="flex items-center justify-end gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${stock.market === 'KR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'}`}>
                      {stock.market}
                    </span>
                    <button
                      onClick={() => handleRemove(i)}
                      className="text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
