import type { NewsArticle } from '@/types/news';
import type { AnalysisResult } from '@/types/analysis';

export const mockNews: (NewsArticle & { id: string })[] = [
  {
    id: '1',
    title: '[특징주] 고유가·고환율·매파 파월…얼어붙은 투심에 증권주 급락',
    url: 'https://example.com/news/1',
    source: '연합뉴스',
    content: '이란 전쟁이 격화하는 가운데 3월 FOMC의 매파적 태도, 달러 환율 급등 등 악재가 겹쳤다.',
    summary: '이란 전쟁 격화와 FOMC 매파적 태도로 증권주 급락',
    category: '경제',
    publishedAt: new Date('2026-03-19T07:09:00Z'),
    isAnalyzed: true,
  },
  {
    id: '2',
    title: '삼성전자, 1분기 반도체 영업이익 전년비 340% 증가 전망',
    url: 'https://example.com/news/2',
    source: '한국경제',
    content: '삼성전자의 반도체 부문 영업이익이 AI 수요 확대로 크게 개선될 전망이다.',
    summary: '삼성전자 반도체 영업이익 340% 증가 전망, AI 수요 확대 영향',
    category: '경제',
    publishedAt: new Date('2026-03-19T06:30:00Z'),
    isAnalyzed: false,
  },
  {
    id: '3',
    title: '정부, 반도체 특별법 시행령 확정…세액공제 확대',
    url: 'https://example.com/news/3',
    source: '매일경제',
    content: '정부가 반도체 특별법 시행령을 확정했다. 대기업 세액공제 15%, 중소기업 25%로 확대.',
    summary: '반도체 특별법 시행령 확정, 세액공제 대기업 15% 중소기업 25%',
    category: '정책',
    publishedAt: new Date('2026-03-19T05:00:00Z'),
    isAnalyzed: true,
  },
  {
    id: '4',
    title: 'NVIDIA, 차세대 AI 칩 Rubin 발표…성능 3배 향상',
    url: 'https://example.com/news/4',
    source: 'Reuters',
    content: 'NVIDIA가 차세대 AI 칩 Rubin을 발표했다. Blackwell 대비 성능 3배, 전력효율 2배 향상.',
    summary: 'NVIDIA 차세대 AI 칩 Rubin 발표, Blackwell 대비 성능 3배',
    category: 'Business',
    publishedAt: new Date('2026-03-18T22:00:00Z'),
    isAnalyzed: false,
  },
  {
    id: '5',
    title: '한국은행, 기준금리 0.25%p 인하…연 2.75%',
    url: 'https://example.com/news/5',
    source: '연합뉴스',
    content: '한국은행이 경기 둔화 우려 속에 기준금리를 0.25%포인트 인하했다.',
    summary: '한국은행 기준금리 0.25%p 인하하여 연 2.75%',
    category: '경제',
    publishedAt: new Date('2026-03-18T09:00:00Z'),
    isAnalyzed: true,
  },
  {
    id: '6',
    title: '테슬라, 완전자율주행 중국 시장 진출 승인',
    url: 'https://example.com/news/6',
    source: 'Reuters',
    content: '테슬라가 중국에서 완전자율주행(FSD) 기능 운영 승인을 획득했다.',
    summary: '테슬라 FSD 중국 시장 진출 승인 획득',
    category: 'Business',
    publishedAt: new Date('2026-03-18T04:00:00Z'),
    isAnalyzed: false,
  },
];

export const mockAnalysis: AnalysisResult = {
  hiddenIntent: {
    summary: '파월의 매파적 발언은 인플레 재확산 경계 신호',
    details:
      '파월 의장의 금리 인상 가능성 시사는 단순 시장 경고가 아니라, 이란 전쟁에 따른 유가 급등이 인플레이션을 재촉발할 수 있다는 연준 내부의 심각한 우려를 반영합니다. 이는 하반기 금리 인하 기대를 완전히 뒤집는 시그널입니다.',
  },
  impact: {
    shortTerm: {
      description: '증시 변동성 급등, 원/달러 환율 1,500원대 진입, 외국인 매도세 가속',
      severity: 'HIGH',
    },
    midTerm: {
      description: '금리 인하 기대 후퇴로 성장주 조정, 방어주/배당주 선호 전환',
      severity: 'HIGH',
    },
    longTerm: {
      description: '이란 전쟁 장기화 시 스태그플레이션 우려, 글로벌 공급망 재편 가속',
      severity: 'MEDIUM',
    },
  },
  benefitStocks: [
    {
      symbol: '010950',
      name: 'S-Oil',
      market: 'KR',
      probability: 85,
      reason: '이란 전쟁으로 유가 상승 시 정유사 마진 확대',
      recommendation: { action: 'BUY', timing: '단기 조정 시 매수, 1-2주 내', targetPrice: '95,000원' },
    },
    {
      symbol: 'XOM',
      name: 'ExxonMobil',
      market: 'US',
      probability: 80,
      reason: '고유가 환경에서 에너지 메이저 수혜',
      recommendation: { action: 'BUY', timing: '현재가 부근 분할 매수' },
    },
    {
      symbol: '015760',
      name: '한국전력',
      market: 'KR',
      probability: 60,
      reason: '방어주 성격, 금리 인상 시 배당 매력 부각',
      recommendation: { action: 'WATCH', timing: '추가 하락 시 매수 검토' },
    },
  ],
  harmStocks: [
    {
      symbol: '035420',
      name: 'NAVER',
      market: 'KR',
      probability: 75,
      reason: '성장주로 금리 인상 시 밸류에이션 하락 압력',
      recommendation: { action: 'REDUCE', timing: '반등 시 비중 축소' },
    },
    {
      symbol: 'TSLA',
      name: 'Tesla',
      market: 'US',
      probability: 70,
      reason: '고금리 환경에서 성장주 디스카운트 심화',
      recommendation: { action: 'WATCH', timing: '단기 매도 압력 예상' },
    },
  ],
  overallSentiment: 'BEARISH',
  confidence: 78,
  keyInsight:
    '파월의 매파 시그널과 이란 전쟁 격화로 단기 리스크오프 불가피. 에너지/방어주 비중 확대, 성장주 비중 축소 권고.',
};

export const mockPortfolio = {
  id: '1',
  name: '내 포트폴리오',
  items: [
    { id: '1', stockSymbol: '005930', stockName: '삼성전자', market: 'KR' as const, weight: 30, avgPrice: 72000 },
    { id: '2', stockSymbol: '035420', stockName: 'NAVER', market: 'KR' as const, weight: 20, avgPrice: 195000 },
    { id: '3', stockSymbol: 'NVDA', stockName: 'NVIDIA', market: 'US' as const, weight: 25, avgPrice: 875 },
    { id: '4', stockSymbol: 'AAPL', stockName: 'Apple', market: 'US' as const, weight: 15, avgPrice: 192 },
    { id: '5', stockSymbol: '068270', stockName: '셀트리온', market: 'KR' as const, weight: 10, avgPrice: 185000 },
  ],
};

export const mockReports = [
  {
    id: '1',
    newsTitle: '[특징주] 고유가·고환율·매파 파월…증권주 급락',
    source: '연합뉴스',
    sentiment: 'BEARISH' as const,
    confidence: 78,
    createdAt: new Date('2026-03-19T08:00:00Z'),
    keyInsight: '파월의 매파 시그널과 이란 전쟁 격화로 단기 리스크오프 불가피',
  },
  {
    id: '2',
    newsTitle: '삼성전자, 1분기 반도체 영업이익 340% 증가 전망',
    source: '한국경제',
    sentiment: 'BULLISH' as const,
    confidence: 82,
    createdAt: new Date('2026-03-19T07:00:00Z'),
    keyInsight: 'AI 수요 확대로 메모리 반도체 슈퍼사이클 진입 가능성',
  },
  {
    id: '3',
    newsTitle: '정부, 반도체 특별법 시행령 확정',
    source: '매일경제',
    sentiment: 'BULLISH' as const,
    confidence: 85,
    createdAt: new Date('2026-03-19T06:00:00Z'),
    keyInsight: '세액공제 확대로 반도체 투자 가속, SK하이닉스·삼성전자 직접 수혜',
  },
  {
    id: '4',
    newsTitle: '한국은행, 기준금리 0.25%p 인하',
    source: '연합뉴스',
    sentiment: 'BULLISH' as const,
    confidence: 72,
    createdAt: new Date('2026-03-18T10:00:00Z'),
    keyInsight: '금리 인하로 부동산·건설주 반등 기대, 은행주 순이자마진 축소 주의',
  },
];
