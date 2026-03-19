import { NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import Stripe from 'stripe';

function nextPeriodEnd(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ''
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed';
    return Response.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );
        await prisma.user.update({
          where: { stripeCustomerId: session.customer as string },
          data: {
            plan: 'PREMIUM',
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: nextPeriodEnd(),
          },
        });
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as unknown as { subscription?: string; customer?: string };
      if (invoice.subscription) {
        await prisma.user.update({
          where: { stripeCustomerId: invoice.customer as string },
          data: {
            plan: 'PREMIUM',
            stripeCurrentPeriodEnd: nextPeriodEnd(),
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          plan: 'FREE',
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const isActive = ['active', 'trialing'].includes(subscription.status);
      await prisma.user.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          plan: isActive ? 'PREMIUM' : 'FREE',
          stripeCurrentPeriodEnd: isActive ? nextPeriodEnd() : null,
        },
      });
      break;
    }
  }

  return Response.json({ received: true });
}
