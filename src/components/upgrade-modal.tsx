'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  used: number;
  limit: number;
}

export function UpgradeModal({ open, onClose, used, limit }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('결제 페이지를 열 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="relative w-full max-w-md border-neutral-700 bg-neutral-900">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-neutral-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
            <Crown className="h-7 w-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold">분석 한도에 도달했습니다</h2>
          <p className="mt-2 text-neutral-400">
            오늘 {used}/{limit}회 분석을 모두 사용했습니다.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Premium으로 업그레이드하면 무제한 분석이 가능합니다.
          </p>

          <div className="mt-6 space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Premium 업그레이드 (₩9,900/월)
            </Button>
            <Link href="/pricing">
              <Button variant="ghost" className="w-full text-neutral-400">
                요금제 비교하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
