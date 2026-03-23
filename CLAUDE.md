@AGENTS.md

# currentDate
Today's date is 2026-03-22.

# Project: NewsStock AI
뉴스와 정책을 AI로 분석하여 수혜/손해 종목을 도출하는 서비스

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui, Framer Motion, Noto Sans KR
- **Backend**: Next.js 16 (App Router), Anthropic SDK (Claude), Supabase JS Client
- **Database**: PostgreSQL (Supabase 호스팅, anon key 연동)
- **Auth**: 이메일/비밀번호 인증 (쿠키 기반 세션), 관리자 계정 하드코딩 ("0" 입력 즉시 로그인)
- **차트**: Recharts (AreaChart, BarChart)
- **주식 API**: 한국투자증권 OpenAPI (실전투자, KOSPI/KOSDAQ 지수 + 개별종목 시세)
- **향후 추가 예정**: 소셜 로그인(Google/Kakao), Stripe 결제, RSS Parser, NXT 대체거래소 지원

## Project Structure
- `src/app/page.tsx` - 랜딩 페이지 (스플래시 → 이메일 로그인/회원가입 + 소셜 로그인 UI)
- `src/app/(dashboard)/` - 대시보드 (피드, AI분석, 포트폴리오, 차트, 리포트, 설정)
- `src/app/(dashboard)/chart/` - 차트 페이지 (KOSPI/KOSDAQ 지수 + 포트폴리오 종목 차트)
- `src/app/api/auth/email/` - 이메일 인증 API (Supabase users 테이블 연동)
- `src/app/api/stocks/screenshot/` - 스크린샷 AI 분석 API (포트폴리오 종목 추출)
- `src/app/api/stocks/kis/` - 한국투자증권 API 연동 (보유종목 조회)
- `src/app/api/stocks/index/` - KOSPI/KOSDAQ 지수 현재가 + 일별 시세 API
- `src/app/api/stocks/prices/` - 여러 종목 현재가 일괄 조회 API
- `src/lib/supabase.ts` - Supabase 클라이언트
- `prisma/` - DB 스키마 (참고용, 실제 DB는 Supabase 직접 관리)
- `reports/` - 작업 리포트

## Current State (2026-03-23)
- 랜딩 페이지: 스플래시(1.2초) → 이메일 로그인/회원가입 + Google/Kakao 소셜 로그인 UI
- 다크/라이트 모드: 시스템 설정 자동 감지
- 색상 테마: 흰색+진한 초록(라이트) / 검정+진한 초록(다크)
- 인증: Supabase users 테이블 연동, 관리자 "0" 즉시 로그인
- 대시보드 6개 탭: 뉴스피드, AI분석, 포트폴리오, 차트, 리포트, 설정
- 포트폴리오: 스크린샷 AI 분석 + 직접 입력 + 실시간 현재가 조회 (KIS API)
- AI 분석: URL 입력 → 4단계 분석 애니메이션 → 목 결과 표시
- 차트: KOSPI/KOSDAQ 지수 차트 + 포트폴리오 종목 개별 차트 (Recharts)
- 주식 시세: 한국투자증권 OpenAPI 실전투자 연동 완료 (.env.local에 KIS_APP_KEY, KIS_APP_SECRET)

## Notes
- Claude API 실제 연동은 미완 (목 데이터 사용 중)
- 소셜 로그인(Google/Kakao)은 UI만 있음, 실제 연동 필요
- 뉴스 피드는 나중에 포트폴리오 종목 관련 뉴스 자동 필터링 구현 예정
- next-auth, prisma, stripe 등 미설치 → providers.tsx, middleware.ts 임시 비활성화
- NXT(넥스트레이드) 대체거래소: KIS OpenAPI에서 REST API 지수 조회 미지원 → 보류
- KIS API 토큰: 서버 내 단일 캐시로 관리 (kis-api.ts), .env.local 변경 시 dev 서버 재시작 필요
