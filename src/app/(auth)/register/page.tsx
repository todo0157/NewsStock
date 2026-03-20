'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { registerSchema, type RegisterInput } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || '회원가입에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 가입 성공 후 자동 로그인
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      // 가입은 됐지만 로그인 실패 시 로그인 페이지로
      router.push('/login');
      return;
    }

    router.push('/feed');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md border-neutral-800 bg-neutral-900">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">회원가입</CardTitle>
          <CardDescription className="text-neutral-400">
            NewsStock AI에 가입하고 뉴스 기반 투자 인사이트를 받으세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">이름</label>
              <Input
                type="text"
                placeholder="홍길동"
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">이메일</label>
              <Input
                type="email"
                placeholder="email@example.com"
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">비밀번호</label>
              <Input
                type="password"
                placeholder="영문+숫자 8자 이상"
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">비밀번호 확인</label>
              <Input
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
