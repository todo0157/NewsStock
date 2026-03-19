import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// GET: 사용자 포트폴리오 목록 조회
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({ portfolios });
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

// POST: 포트폴리오 생성
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: '포트폴리오 이름이 필요합니다.' }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.create({
    data: { userId: session.user.id, name: result.data.name },
    include: { items: true },
  });

  return Response.json({ portfolio }, { status: 201 });
}
