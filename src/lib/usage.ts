import { prisma } from '@/lib/db/prisma';
import { PLANS } from '@/lib/stripe';
import type { Plan } from '@/generated/prisma/client';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function checkAnalysisLimit(userId: string, plan: Plan): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const planConfig = PLANS[plan];
  const limit = planConfig.limits.dailyAnalysis;

  if (limit === Infinity) {
    return { allowed: true, used: 0, limit: -1 };
  }

  const date = todayStr();
  const usage = await prisma.dailyUsage.findUnique({
    where: { userId_date: { userId, date } },
  });

  const used = usage?.count ?? 0;
  return { allowed: used < limit, used, limit };
}

export async function incrementUsage(userId: string): Promise<void> {
  const date = todayStr();
  await prisma.dailyUsage.upsert({
    where: { userId_date: { userId, date } },
    update: { count: { increment: 1 } },
    create: { userId, date, count: 1 },
  });
}
