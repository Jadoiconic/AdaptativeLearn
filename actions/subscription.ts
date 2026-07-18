'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStripe, PLAN_CONFIG, PlanKey } from '@/lib/stripe';
import { upsertSubscriptionFromStripe } from '@/lib/subscription';
import connectDB from '@/database/connection';
import { UserModel, SubscriptionModel } from '@/database/models';

type ActionResult<T> = ({ success: true } & T) | { success: false; error: string };

async function getOrCreateStripeCustomerId(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  await connectDB();

  const existingSub = await SubscriptionModel.findOne({ userId })
    .select('stripeCustomerId')
    .lean();
  if (existingSub?.stripeCustomerId) return existingSub.stripeCustomerId;

  const user = await UserModel.findById(userId).select('stripeCustomerId');
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: { userId },
  });

  await UserModel.findByIdAndUpdate(userId, { stripeCustomerId: customer.id });
  return customer.id;
}

export async function createCheckoutSession(
  planKey: PlanKey
): Promise<ActionResult<{ url: string }>> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Not authenticated.' };

  const plan = PLAN_CONFIG[planKey];
  if (!plan || !plan.priceId) {
    return { success: false, error: 'Invalid plan.' };
  }

  const appUrl = process.env.NEXTAUTH_URL ?? '';
  const customerId = await getOrCreateStripeCustomerId(
    session.user.id,
    session.user.email ?? '',
    session.user.name ?? ''
  );

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}/dashboard/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
    metadata: { userId: session.user.id },
  });

  if (!checkoutSession.url) {
    return { success: false, error: 'Failed to create checkout session.' };
  }

  return { success: true, url: checkoutSession.url };
}

export async function syncCheckoutSession(sessionId: string): Promise<ActionResult<{}>> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Not authenticated.' };

  const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  if (checkoutSession.metadata?.userId !== session.user.id) {
    return { success: false, error: 'This checkout session does not belong to you.' };
  }

  const subscription = checkoutSession.subscription;
  if (!subscription || typeof subscription === 'string') {
    return { success: false, error: 'Subscription not ready yet.' };
  }

  await connectDB();
  await upsertSubscriptionFromStripe(subscription);

  return { success: true };
}

export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Not authenticated.' };

  await connectDB();
  const sub = await SubscriptionModel.findOne({ userId: session.user.id }).select(
    'stripeCustomerId'
  );
  if (!sub?.stripeCustomerId) {
    return { success: false, error: 'No billing account found.' };
  }

  const appUrl = process.env.NEXTAUTH_URL ?? '';
  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });

  return { success: true, url: portalSession.url };
}

export async function cancelSubscription(): Promise<ActionResult<{}>> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Not authenticated.' };

  await connectDB();
  const sub = await SubscriptionModel.findOne({ userId: session.user.id });
  if (!sub) return { success: false, error: 'No subscription found.' };

  await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  sub.cancelAtPeriodEnd = true;
  await sub.save();

  return { success: true };
}

export async function resumeSubscription(): Promise<ActionResult<{}>> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Not authenticated.' };

  await connectDB();
  const sub = await SubscriptionModel.findOne({ userId: session.user.id });
  if (!sub) return { success: false, error: 'No subscription found.' };

  await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  sub.cancelAtPeriodEnd = false;
  await sub.save();

  return { success: true };
}
