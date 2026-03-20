'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLANS } from '@/lib/stripe';

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

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
  });

  const currentPlan = usageData?.plan || 'FREE';

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('결제 페이지를 열 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">요금제</h1>
        <p className="mt-2 text-neutral-400">필요에 맞는 플랜을 선택하세요</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* FREE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`border-neutral-800 bg-neutral-900/50 ${currentPlan === 'FREE' ? 'ring-1 ring-neutral-600' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="h-5 w-5 text-neutral-400" />
                  {PLANS.FREE.name}
                </CardTitle>
                {currentPlan === 'FREE' && (
                  <Badge className="bg-neutral-700 text-neutral-300">현재 플랜</Badge>
                )}
              </div>
              <p className="text-sm text-neutral-400">{PLANS.FREE.description}</p>
              <p className="text-3xl font-bold">무료</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.FREE.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                    <Check className="h-4 w-4 text-neutral-500" />
                    {f}
                  </li>
                ))}
              </ul>
              {currentPlan === 'FREE' && (
                <div className="mt-6 rounded-lg bg-neutral-800 p-3 text-center text-sm text-neutral-400">
                  오늘 {usageData?.used || 0}/{usageData?.limit || 3} 분석 사용
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* PREMIUM */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={`border-blue-500/30 bg-blue-500/5 ${currentPlan === 'PREMIUM' ? 'ring-1 ring-blue-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Crown className="h-5 w-5 text-blue-400" />
                  {PLANS.PREMIUM.name}
                </CardTitle>
                {currentPlan === 'PREMIUM' ? (
                  <Badge className="bg-blue-500/20 text-blue-400">현재 플랜</Badge>
                ) : (
                  <Badge className="bg-blue-500/20 text-blue-400">추천</Badge>
                )}
              </div>
              <p className="text-sm text-neutral-400">{PLANS.PREMIUM.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">₩9,900</span>
                <span className="text-neutral-400">/월</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.PREMIUM.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-200">
                    <Check className="h-4 w-4 text-blue-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {currentPlan === 'PREMIUM' ? (
                  <Button
                    variant="outline"
                    className="w-full border-blue-500/30"
                    onClick={async () => {
                      const res = await fetch('/api/stripe/portal', { method: 'POST' });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    }}
                  >
                    구독 관리
                  </Button>
                ) : (
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleUpgrade} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Premium 업그레이드
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
