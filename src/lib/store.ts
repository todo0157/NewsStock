// 로컬스토리지 기반 공유 스토어 (포트폴리오 + 분석 히스토리)

export interface PortfolioStock {
  name: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  market: string;
}

export interface SavedReport {
  id: string;
  url: string;
  title: string;
  keyInsight: string;
  sentiment: string;
  confidence: number;
  hiddenIntent: string;
  hiddenIntentDetail: string;
  impact: { label: string; severity: string; description: string }[];
  benefitStocks: StockResult[];
  harmStocks: StockResult[];
  date: string; // ISO string
  // 포트폴리오 연동 정보
  affectedPortfolioStocks: AffectedPortfolioStock[];
}

export interface StockResult {
  name: string;
  symbol: string;
  market: string;
  impact: 'positive' | 'negative';
  probability: number;
  reason: string;
  action: string;
  timing: string;
}

export interface AffectedPortfolioStock {
  name: string;
  symbol: string;
  impact: 'positive' | 'negative';
  action: string;
  reason: string;
  probability: number;
}

// ===== 포트폴리오 =====
const PORTFOLIO_KEY = 'newsstock_portfolio';

export function getPortfolio(): PortfolioStock[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PORTFOLIO_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePortfolio(stocks: PortfolioStock[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(stocks));
  window.dispatchEvent(new Event('portfolio-updated'));
}

// ===== 분석 리포트 =====
const REPORTS_KEY = 'newsstock_reports';

export function getReports(): SavedReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveReport(report: SavedReport) {
  const reports = getReports();
  reports.unshift(report); // 최신순
  if (reports.length > 100) reports.pop(); // 최대 100개
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event('reports-updated'));
}

export function deleteReport(id: string) {
  const reports = getReports().filter((r) => r.id !== id);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event('reports-updated'));
}

// ===== 포트폴리오 ↔ 분석 매칭 =====
export function matchPortfolioStocks(
  portfolio: PortfolioStock[],
  benefitStocks: StockResult[],
  harmStocks: StockResult[]
): AffectedPortfolioStock[] {
  const affected: AffectedPortfolioStock[] = [];
  const portfolioNames = portfolio.map((s) => s.name.toLowerCase());
  const portfolioSymbols = portfolio.map((s) => s.symbol.toLowerCase());

  for (const stock of benefitStocks) {
    const nameIdx = portfolioNames.indexOf(stock.name.toLowerCase());
    const symIdx = portfolioSymbols.indexOf(stock.symbol.toLowerCase());
    if (nameIdx !== -1 || symIdx !== -1) {
      affected.push({
        name: stock.name,
        symbol: stock.symbol,
        impact: 'positive',
        action: stock.action,
        reason: stock.reason,
        probability: stock.probability,
      });
    }
  }

  for (const stock of harmStocks) {
    const nameIdx = portfolioNames.indexOf(stock.name.toLowerCase());
    const symIdx = portfolioSymbols.indexOf(stock.symbol.toLowerCase());
    if (nameIdx !== -1 || symIdx !== -1) {
      affected.push({
        name: stock.name,
        symbol: stock.symbol,
        impact: 'negative',
        action: stock.action,
        reason: stock.reason,
        probability: stock.probability,
      });
    }
  }

  return affected;
}

// ===== 포트폴리오 위험도 계산 =====
export interface PortfolioRisk {
  overallScore: number; // 0~100 (높을수록 안전)
  stockRisks: StockRisk[];
}

export interface StockRisk {
  name: string;
  symbol: string;
  positiveCount: number;
  negativeCount: number;
  avgSentiment: number; // -100 ~ +100
  recentReports: { id: string; title: string; sentiment: string; date: string }[];
}

export function calculatePortfolioRisk(
  portfolio: PortfolioStock[],
  reports: SavedReport[]
): PortfolioRisk {
  if (portfolio.length === 0) {
    return { overallScore: 50, stockRisks: [] };
  }

  const stockRisks: StockRisk[] = portfolio.map((stock) => {
    const relatedReports = reports.filter((r) =>
      r.affectedPortfolioStocks.some(
        (a) =>
          a.name.toLowerCase() === stock.name.toLowerCase() ||
          a.symbol.toLowerCase() === stock.symbol.toLowerCase()
      )
    );

    let positiveCount = 0;
    let negativeCount = 0;
    for (const r of relatedReports) {
      const match = r.affectedPortfolioStocks.find(
        (a) =>
          a.name.toLowerCase() === stock.name.toLowerCase() ||
          a.symbol.toLowerCase() === stock.symbol.toLowerCase()
      );
      if (match?.impact === 'positive') positiveCount++;
      else negativeCount++;
    }

    const total = positiveCount + negativeCount;
    const avgSentiment = total > 0 ? ((positiveCount - negativeCount) / total) * 100 : 0;

    return {
      name: stock.name,
      symbol: stock.symbol,
      positiveCount,
      negativeCount,
      avgSentiment,
      recentReports: relatedReports.slice(0, 5).map((r) => ({
        id: r.id,
        title: r.title,
        sentiment: r.sentiment,
        date: r.date,
      })),
    };
  });

  // 전체 안전도: 관련 리포트가 없으면 50, 긍정 많으면 높고 부정 많으면 낮음
  const totalPositive = stockRisks.reduce((s, r) => s + r.positiveCount, 0);
  const totalNegative = stockRisks.reduce((s, r) => s + r.negativeCount, 0);
  const total = totalPositive + totalNegative;
  const overallScore = total > 0
    ? Math.round(50 + ((totalPositive - totalNegative) / total) * 50)
    : 50;

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    stockRisks,
  };
}

// ===== 종목별 타임라인 =====
export interface StockTimeline {
  stockName: string;
  stockSymbol: string;
  entries: TimelineEntry[];
}

export interface TimelineEntry {
  reportId: string;
  title: string;
  date: string;
  sentiment: string;
  impact: 'positive' | 'negative';
  action: string;
  reason: string;
  probability: number;
}

export function getStockTimeline(
  stockName: string,
  stockSymbol: string,
  reports: SavedReport[]
): StockTimeline {
  const entries: TimelineEntry[] = [];

  for (const report of reports) {
    const match = report.affectedPortfolioStocks.find(
      (a) =>
        a.name.toLowerCase() === stockName.toLowerCase() ||
        a.symbol.toLowerCase() === stockSymbol.toLowerCase()
    );
    if (!match) {
      // 수혜/손해 목록에서도 찾기
      const benefit = report.benefitStocks.find(
        (s) =>
          s.name.toLowerCase() === stockName.toLowerCase() ||
          s.symbol.toLowerCase() === stockSymbol.toLowerCase()
      );
      const harm = report.harmStocks.find(
        (s) =>
          s.name.toLowerCase() === stockName.toLowerCase() ||
          s.symbol.toLowerCase() === stockSymbol.toLowerCase()
      );
      const found = benefit || harm;
      if (found) {
        entries.push({
          reportId: report.id,
          title: report.title,
          date: report.date,
          sentiment: report.sentiment,
          impact: benefit ? 'positive' : 'negative',
          action: found.action,
          reason: found.reason,
          probability: found.probability,
        });
      }
    } else {
      entries.push({
        reportId: report.id,
        title: report.title,
        date: report.date,
        sentiment: report.sentiment,
        impact: match.impact,
        action: match.action,
        reason: match.reason,
        probability: match.probability,
      });
    }
  }

  return {
    stockName,
    stockSymbol,
    entries: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}
