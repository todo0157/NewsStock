'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Newspaper, Search, Briefcase, FileText, TrendingUp, Crown, CreditCard } from 'lucide-react';

const navItems = [
  { href: '/feed', label: '뉴스 피드', icon: Newspaper },
  { href: '/analyze', label: 'URL 분석', icon: Search },
  { href: '/portfolio', label: '포트폴리오', icon: Briefcase },
  { href: '/reports', label: '분석 리포트', icon: FileText },
];

const bottomNavItems = [
  { href: '/pricing', label: '요금제', icon: Crown },
  { href: '/settings/billing', label: '구독 관리', icon: CreditCard },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  const { data: usageData } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/usage');
        if (!res.ok) throw new Error();
        return res.json();
      } catch {
        return { plan: 'FREE', used: 0, limit: 3, allowed: true };
      }
    },
    staleTime: 30000,
  });

  const plan = usageData?.plan || 'FREE';
  const used = usageData?.used || 0;
  const limit = usageData?.limit || 3;
  const isPremium = plan === 'PREMIUM';

  return (
    <aside className={cn('flex flex-col border-r border-neutral-800 bg-neutral-950', className)}>
      <div className="flex h-14 items-center gap-2 border-b border-neutral-800 px-4">
        <TrendingUp className="h-6 w-6 text-blue-500" />
        <span className="text-lg font-bold">NewsStock AI</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-2 border-t border-neutral-800" />

        {bottomNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-800 p-3">
        <Link href={isPremium ? '/settings/billing' : '/pricing'}>
          <div className={cn(
            'rounded-lg p-3 transition-colors hover:opacity-90',
            isPremium ? 'bg-blue-500/10' : 'bg-neutral-900'
          )}>
            <p className={cn('text-xs font-medium', isPremium ? 'text-blue-400' : 'text-neutral-400')}>
              {isPremium ? 'Premium 플랜' : 'Free 플랜'}
            </p>
            {isPremium ? (
              <p className="mt-1 text-xs text-neutral-500">무제한 분석</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-neutral-500">오늘 {used}/{limit} 분석 사용</p>
                <div className="mt-2 h-1.5 rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}
