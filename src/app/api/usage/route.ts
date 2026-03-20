import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { checkAnalysisLimit } from '@/lib/usage';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!user) {
    return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const usage = await checkAnalysisLimit(session.user.id, user.plan);

  return Response.json({
    plan: user.plan,
    ...usage,
  });
}
