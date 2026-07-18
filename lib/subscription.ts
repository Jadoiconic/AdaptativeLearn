import { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/database/connection';
import { SubscriptionModel } from '@/database/models';
import { planKeyFromPriceId } from '@/lib/plans';

const ACTIVE_STATUSES = ['active', 'trialing'];

export async function upsertSubscriptionFromStripe(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error('Subscription event missing userId metadata', sub.id);
    return;
  }

  await connectDB();

  const item = sub.items.data[0];
  const priceId = item?.price.id;
  const plan = planKeyFromPriceId(priceId);
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : undefined;

  await SubscriptionModel.findOneAndUpdate(
    { stripeSubscriptionId: sub.id },
    {
      $setOnInsert: { userId, stripeSubscriptionId: sub.id },
      $set: {
        stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        stripePriceId: priceId,
        ...(plan ? { plan } : {}),
        status: sub.status,
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    },
    { upsert: true, new: true }
  );
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  await connectDB();
  const sub = await SubscriptionModel.findOne({
    userId,
    status: { $in: ACTIVE_STATUSES },
  })
    .select('currentPeriodEnd')
    .lean();

  if (!sub) return false;
  return sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) > new Date() : true;
}

export async function requireSubscription(session: Session | null): Promise<NextResponse | null> {
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (session.user.role === 'admin' || session.user.role === 'instructor') {
    return null;
  }

  const active = await hasActiveSubscription(session.user.id);
  if (!active) {
    return NextResponse.json(
      {
        success: false,
        error: 'An active subscription is required.',
        code: 'SUBSCRIPTION_REQUIRED',
      },
      { status: 402 }
    );
  }

  return null;
}

export function canAccessModuleContent(
  isFreePreview: boolean,
  courseInstructorId: string | undefined,
  session: Session | null,
  isSubscribed: boolean
): boolean {
  if (isFreePreview) return true;
  if (!session) return false;
  if (session.user.role === 'admin') return true;
  if (session.user.role === 'instructor' && courseInstructorId === session.user.id) return true;
  return isSubscribed;
}
