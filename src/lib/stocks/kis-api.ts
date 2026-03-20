import type { StockPrice, StockSearchResult, StockCandle } from '@/types/stock';

const BASE_URL = 'https://openapivts.koreainvestment.com:29443'; // 모의투자
const APP_KEY = process.env.KIS_APP_KEY ?? '';
const APP_SECRET = process.env.KIS_APP_SECRET ?? '';

// --- 토큰 관리 ---

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: APP_KEY,
      appsecret: APP_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error(`KIS 토큰 발급 실패: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 86400) * 1000 - 60000,
  };

  return cachedToken.token;
}

async function kisRequest(path: string, trId: string, params?: Record<string, string>) {
  const token = await getAccessToken();

  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: APP_KEY,
      appsecret: APP_SECRET,
      tr_id: trId,
    },
  });

  if (!res.ok) {
    throw new Error(`KIS API 오류 (${trId}): ${res.status}`);
  }

  return res.json();
}

// --- 현재가 조회 ---

export async function getKrStockPrice(symbol: string): Promise<StockPrice> {
  const data = await kisRequest(
    '/uapi/domestic-stock/v1/quotations/inquire-price',
    'FHKST01010100',
    { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: symbol }
  );

  const o = data.output;
  const currentPrice = Number(o.stck_prpr);
  const previousClose = Number(o.stck_sdpr);
  const change = currentPrice - previousClose;

  return {
    symbol,
    name: o.rprs_mrkt_kor_name || symbol,
    market: 'KR',
    currentPrice,
    change,
    changePercent: previousClose !== 0 ? (change / previousClose) * 100 : 0,
    volume: Number(o.acml_vol),
    high: Number(o.stck_hgpr),
    low: Number(o.stck_lwpr),
    open: Number(o.stck_oprc),
    previousClose,
    timestamp: new Date(),
  };
}

// --- 일별 시세 조회 ---

export async function getKrStockHistory(
  symbol: string,
  startDate: string,
  endDate: string
): Promise<StockCandle[]> {
  const data = await kisRequest(
    '/uapi/domestic-stock/v1/quotations/inquire-daily-price',
    'FHKST01010400',
    {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: symbol,
      FID_INPUT_DATE_1: startDate,
      FID_INPUT_DATE_2: endDate,
      FID_PERIOD_DIV_CODE: 'D',
      FID_ORG_ADJ_PRC: '0',
    }
  );

  return (data.output || []).map(
    (item: Record<string, string>): StockCandle => ({
      date: item.stck_bsop_date,
      open: Number(item.stck_oprc),
      high: Number(item.stck_hgpr),
      low: Number(item.stck_lwpr),
      close: Number(item.stck_clpr),
      volume: Number(item.acml_vol),
    })
  );
}

// --- 종목 검색 (한국) ---
// KIS API에는 직접적인 검색 API가 없으므로, 주요 종목 리스트를 활용하거나
// 코드로 직접 조회하는 방식을 사용합니다.

const POPULAR_KR_STOCKS: StockSearchResult[] = [
  { symbol: '005930', name: '삼성전자', market: 'KR' },
  { symbol: '000660', name: 'SK하이닉스', market: 'KR' },
  { symbol: '373220', name: 'LG에너지솔루션', market: 'KR' },
  { symbol: '005380', name: '현대자동차', market: 'KR' },
  { symbol: '000270', name: '기아', market: 'KR' },
  { symbol: '068270', name: '셀트리온', market: 'KR' },
  { symbol: '035420', name: 'NAVER', market: 'KR' },
  { symbol: '035720', name: '카카오', market: 'KR' },
  { symbol: '051910', name: 'LG화학', market: 'KR' },
  { symbol: '006400', name: '삼성SDI', market: 'KR' },
  { symbol: '003670', name: '포스코퓨처엠', market: 'KR' },
  { symbol: '105560', name: 'KB금융', market: 'KR' },
  { symbol: '055550', name: '신한지주', market: 'KR' },
  { symbol: '012330', name: '현대모비스', market: 'KR' },
  { symbol: '066570', name: 'LG전자', market: 'KR' },
  { symbol: '028260', name: '삼성물산', market: 'KR' },
  { symbol: '003550', name: 'LG', market: 'KR' },
  { symbol: '096770', name: 'SK이노베이션', market: 'KR' },
  { symbol: '034730', name: 'SK', market: 'KR' },
  { symbol: '030200', name: 'KT', market: 'KR' },
  { symbol: '032830', name: '삼성생명', market: 'KR' },
  { symbol: '015760', name: '한국전력', market: 'KR' },
  { symbol: '009150', name: '삼성전기', market: 'KR' },
  { symbol: '017670', name: 'SK텔레콤', market: 'KR' },
  { symbol: '086790', name: '하나금융지주', market: 'KR' },
];

export function searchKrStocks(query: string): StockSearchResult[] {
  const q = query.toLowerCase();
  return POPULAR_KR_STOCKS.filter(
    (s) => s.name.toLowerCase().includes(q) || s.symbol.includes(q)
  );
}
