import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY 환경변수가 설정되지 않았습니다.');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  FREE: {
    name: 'Free',
    description: '기본 뉴스 분석',
    price: 0,
    features: [
      '하루 3회 AI 분석',
      'RSS 뉴스 피드',
      '포트폴리오 1개',
    ],
    limits: {
      dailyAnalysis: 3,
      maxPortfolios: 1,
    },
  },
  PREMIUM: {
    name: 'Premium',
    description: '프로 투자자를 위한 무제한 분석',
    price: 9900,
    priceLabel: '₩9,900/월',
    features: [
      '무제한 AI 분석',
      'RSS 뉴스 피드',
      '포트폴리오 연관 뉴스 알림',
      '포트폴리오 5개',
      '분석 히스토리 무제한',
    ],
    limits: {
      dailyAnalysis: Infinity,
      maxPortfolios: 5,
    },
  },
} as const;
