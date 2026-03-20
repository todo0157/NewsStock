import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const addItemSchema = z.object({
  stockSymbol: z.string().min(1),
  stockName: z.string().min(1),
  market: z.enum(['KR', 'US']),
  weight: z.number().min(0).max(100),
  avgPrice: z.number().optional(),
});

// POST: 종목 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!portfolio) {
    return Response.json({ error: '포트폴리오를 찾을 수 없습니다.' }, { status: 404 });
  }

  const body = await request.json();
  const result = addItemSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 });
  }

  const item = await prisma.portfolioItem.create({
    data: { portfolioId: id, ...result.data },
  });

  return Response.json({ item }, { status: 201 });
}

// DELETE: 종목 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const { itemId } = await request.json();

  if (!itemId) {
    return Response.json({ error: 'itemId가 필요합니다.' }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!portfolio) {
    return Response.json({ error: '포트폴리오를 찾을 수 없습니다.' }, { status: 404 });
  }

  await prisma.portfolioItem.delete({ where: { id: itemId } });

  return Response.json({ success: true });
}
