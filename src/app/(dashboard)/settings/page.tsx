'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan?: string;
}

function getUser(): User | null {
  const match = document.cookie.match(/(?:^|; )user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">설정</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          계정 및 서비스 설정을 관리하세요.
        </p>
      </motion.div>

      {/* 프로필 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">프로필</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {user?.name?.slice(0, 1) || '?'}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{user?.name || '사용자'}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-400">이름</label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-gray-900 dark:bg-black dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-400">이메일</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                disabled
                className="w-full rounded-lg border border-border bg-gray-50 px-4 py-3 text-gray-500 dark:bg-gray-900 dark:text-gray-400"
              />
            </div>
          </div>
          <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            저장
          </button>
        </div>
      </motion.div>

      {/* 요금제 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">요금제</h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {user?.plan === 'PREMIUM' ? 'Premium' : 'Free'} 플랜
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.plan === 'PREMIUM' ? '무제한 분석' : '하루 3회 분석 가능'}
            </p>
          </div>
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900">
            업그레이드
          </button>
        </div>
      </motion.div>

      {/* 알림 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl border border-border bg-white p-6 dark:bg-gray-950"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">알림 설정</h2>
        <div className="mt-4 space-y-3">
          {['뉴스 알림', '분석 완료 알림', '포트폴리오 변동 알림'].map((label) => (
            <div key={label} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              <div className="h-6 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
