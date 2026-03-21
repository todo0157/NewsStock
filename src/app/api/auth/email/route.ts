import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'admin@newsstock.com';

export async function POST(req: NextRequest) {
  const { email, password, name, mode } = await req.json();

  // 관리자 즉시 로그인: "0" 입력
  if (email === '0' && password === '0') {
    const { data: admin } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (admin) {
      return NextResponse.json({ user: admin, message: '관리자 로그인 되었습니다!' });
    }

    // 관리자 계정이 없으면 자동 생성
    const { data: newAdmin, error } = await supabase
      .from('users')
      .insert({ email: ADMIN_EMAIL, password: '0', name: '관리자', role: 'admin' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '관리자 계정 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ user: newAdmin, message: '관리자 로그인 되었습니다!' });
  }

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
  }

  if (mode === 'signup') {
    if (!name) {
      return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다. 로그인해주세요.' }, { status: 409 });
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password, // TODO: 배포 시 bcrypt 해싱 적용
        name,
        role: 'user',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ user: newUser, message: '회원가입이 완료되었습니다!' });
  }

  if (mode === 'login') {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: '가입되지 않은 이메일입니다.' }, { status: 404 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    return NextResponse.json({ user, message: '로그인 되었습니다!' });
  }

  return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
}
