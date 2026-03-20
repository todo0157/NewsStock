@AGENTS.md

# currentDate
Today's date is 2026-03-20.

# Project: NewsStock AI
뉴스와 정책을 AI로 분석하여 수혜/손해 종목을 도출하는 서비스

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui, Lucide, Recharts, Framer Motion, React Query, react-hook-form
- **Backend**: Next.js 16 (App Router), NextAuth.js, Anthropic SDK (Claude), Stripe, RSS Parser, 한국투자증권 API, Finnhub API, Zod, bcryptjs
- **Database**: PostgreSQL + Prisma ORM (Supabase 호스팅)

## Project Structure
- `src/app/` - 페이지 및 API 라우트
- `src/app/(auth)/` - 로그인, 회원가입 페이지
- `src/app/(dashboard)/` - 대시보드 (피드, 분석, 포트폴리오, 리포트, 요금제, 설정)
- `src/app/api/` - 백엔드 API 엔드포인트
- `src/lib/` - 핵심 로직 (AI, 뉴스, 주식, 인증, 결제)
- `src/components/` - UI 컴포넌트
- `src/types/` - TypeScript 타입 정의
- `prisma/` - DB 스키마
- `reports/` - 작업 리포트

## Notes
- 랜딩 페이지(src/app/page.tsx)는 아직 Next.js 기본 템플릿 상태
- package.json에 일부 의존성 누락 (next-auth, prisma, @anthropic-ai/sdk, stripe 등)
- Supabase 무료 플랜 만료 → 로컬 PostgreSQL 또는 Neon 전환 고려 중

      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
