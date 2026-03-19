import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!priceId) {
    return Response.json({ error: 'Stripe 가격 ID가 설정되지 않았습니다.' }, { status: 500 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  // 기존 Stripe 고객이 있으면 재사용
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=true`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    metadata: { userId: user.id },
  });

  return Response.json({ url: checkoutSession.url });
}
