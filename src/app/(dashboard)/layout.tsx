'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/feed', label: '뉴스 피드', icon: '📰' },
  { href: '/analyze', label: 'AI 분석', icon: '🔍' },
  { href: '/portfolio', label: '포트폴리오', icon: '💼' },
  { href: '/chart', label: '차트', icon: '📈' },
  { href: '/reports', label: '리포트', icon: '📊' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function getUser(): User | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push('/');
      return;
    }
    setUser(u);
  }, [router]);

  const handleLogout = () => {
    document.cookie = 'user=;path=/;max-age=0';
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="flex h-dvh overflow-hidden bg-white dark:bg-black">
      {/* 사이드바 - 데스크톱 */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-white dark:bg-black lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            News<span className="text-primary">Stock</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {user.name?.slice(0, 1) || user.email?.slice(0, 1) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-900 dark:hover:text-red-400"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일 사이드바 */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-white dark:bg-black lg:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  News<span className="text-primary">Stock</span>
                </span>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-500">✕</button>
              </div>
              <nav className="space-y-1 p-3">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {user.name?.slice(0, 1) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:text-red-500"
                >
                  로그아웃
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 모바일 헤더 */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 dark:bg-black lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400">
            ☰
          </button>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            News<span className="text-primary">Stock</span>
          </span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-black md:p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
