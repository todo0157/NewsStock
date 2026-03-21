'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const fadeVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

type View = 'login' | 'signup';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    // 관리자 즉시 로그인: "0" 입력
    if (email === '0') {
      setLoading(true);
      const res = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '0', password: '0', mode: 'login' }),
      });
      const data = await res.json();
      if (res.ok) {
        document.cookie = `user=${encodeURIComponent(JSON.stringify(data.user))};path=/;max-age=${60 * 60 * 24 * 30}`;
        router.push('/feed');
      } else {
        setError(data.error);
      }
      setLoading(false);
      return;
    }

    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요. (예: name@email.com)');
      return;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    if (view === 'signup') {
      if (!name) {
        setError('이름을 입력해주세요.');
        return;
      }
      if (password.length < 6) {
        setError('비밀번호는 6자 이상이어야 합니다.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, mode: view }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // 쿠키에 유저 정보 저장 후 홈으로 이동
      document.cookie = `user=${encodeURIComponent(JSON.stringify(data.user))};path=/;max-age=${60 * 60 * 24 * 30}`;
      router.push('/feed');
    } catch {
      setError('서버 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: 소셜 로그인 구현
    alert(`${provider} 로그인은 준비 중입니다.`);
  };

  const switchView = () => {
    setView(view === 'login' ? 'signup' : 'login');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setName('');
    setError('');
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-6 dark:bg-black">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              News<span className="text-primary">Stock</span>
            </h1>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            {/* 로고 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-10 text-center"
            >
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                News<span className="text-primary">Stock</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                뉴스로 읽는 주식 시장
              </p>
            </motion.div>

            {/* 폼 영역 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="mb-6 text-center text-lg font-semibold text-gray-900 dark:text-white">
                  {view === 'login' ? '로그인' : '회원가입'}
                </h2>

                <div className="space-y-3">
                  {view === 'signup' && (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      placeholder="이름"
                      className="w-full rounded-lg border border-border bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
                    />
                  )}

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="이메일"
                    className="w-full rounded-lg border border-border bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="비밀번호"
                    className="w-full rounded-lg border border-border bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
                  />

                  {view === 'signup' && (
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => { setPasswordConfirm(e.target.value); setError(''); }}
                      placeholder="비밀번호 확인"
                      className="w-full rounded-lg border border-border bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
                    />
                  )}

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading
                      ? '처리 중...'
                      : view === 'login'
                        ? '로그인'
                        : '회원가입'}
                  </button>
                </div>

                {/* 구분선 */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">또는</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* 소셜 로그인 */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleSocialLogin('Google')}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google로 계속하기
                  </button>

                  <button
                    onClick={() => handleSocialLogin('Kakao')}
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] py-3 text-sm font-medium text-[#191919] transition-opacity hover:opacity-90"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#191919">
                      <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.37 6.24l-1.12 4.16c-.1.36.31.65.63.44l4.85-3.2c.42.04.84.06 1.27.06 5.52 0 10-3.36 10-7.7S17.52 3 12 3z" />
                    </svg>
                    카카오로 계속하기
                  </button>
                </div>

                {/* 전환 링크 */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {view === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
                    <button
                      onClick={switchView}
                      className="font-semibold text-primary hover:underline"
                    >
                      {view === 'login' ? '회원가입' : '로그인'}
                    </button>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
