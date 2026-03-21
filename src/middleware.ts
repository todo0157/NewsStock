// TODO: next-auth 설치 후 인증 미들웨어 복원
import { NextResponse } from 'next/server';

export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
