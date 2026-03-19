'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Crown, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function BillingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  const { data: usageData, isLoading } = useQuery({
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
  });

  const plan = usageData?.plan || 'FREE';

  async function handleManageSubscription() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">구독 관리</h1>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-green-400"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Premium 구독이 활성화되었습니다!</span>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* 현재 플랜 */}
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className={`h-5 w-5 ${plan === 'PREMIUM' ? 'text-blue-400' : 'text-neutral-500'}`} />
                현재 플랜
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{plan === 'PREMIUM' ? 'Premium' : 'Free'}</p>
                  <p className="text-sm text-neutral-400">
                    {plan === 'PREMIUM' ? '₩9,900/월' : '무료'}
                  </p>
                </div>
                <Badge className={plan === 'PREMIUM' ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-700 text-neutral-300'}>
                  {plan}
                </Badge>
              </div>

              {plan === 'FREE' && (
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">오늘 분석 사용량</span>
                    <span>{usageData?.used || 0} / {usageData?.limit || 3}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(((usageData?.used || 0) / (usageData?.limit || 3)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 액션 */}
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-neutral-400" />
                결제 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan === 'PREMIUM' ? (
                <Button variant="outline" className="w-full border-neutral-700" onClick={handleManageSubscription}>
                  Stripe에서 구독 관리
                </Button>
              ) : (
                <Link href="/pricing">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Premium 업그레이드
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
