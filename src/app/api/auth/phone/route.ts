import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ADMIN_PHONE = '01028527928';

export async function POST(req: NextRequest) {
  const { phone, mode } = await req.json();

  const digits = phone.replace(/\D/g, '');

  if (!digits || digits.length < 10) {
    return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' }, { status: 400 });
  }

  // 관리자 계정은 인증 없이 통과, 일반 사용자는 아직 미지원
  if (digits !== ADMIN_PHONE) {
    // TODO: 이메일/소셜 로그인 구현 후 제거
    return NextResponse.json({ error: '현재 관리자 계정만 지원합니다.' }, { status: 400 });
  }

  // DB에서 사용자 조회
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('phone', digits)
    .single();

  if (mode === 'signup') {
    if (existingUser) {
      return NextResponse.json({ error: '이미 가입된 번호입니다. 로그인해주세요.' }, { status: 409 });
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ phone: digits, role: 'admin' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ user: newUser, message: '회원가입이 완료되었습니다!' });
  }

  if (mode === 'login') {
    if (!existingUser) {
      return NextResponse.json({ error: '가입되지 않은 번호입니다. 회원가입해주세요.' }, { status: 404 });
    }

    return NextResponse.json({ user: existingUser, message: '로그인 되었습니다!' });
  }

  return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
}
