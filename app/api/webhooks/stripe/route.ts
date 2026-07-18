import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import connectDB from '@/database/connection';
import { SubscriptionModel, PaymentModel } from '@/database/models';
import { upsertSubscriptionFromStripe } from '@/lib/subscription';

export const runtime = 'nodejs';

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

async function resolveUserIdFromInvoice(invoice: Stripe.Invoice): Promise<string | null> {
  const subscriptionId = subscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return null;
  const sub = await SubscriptionModel.findOne({ stripeSubscriptionId: subscriptionId })
    .select('userId')
    .lean();
  return sub ? sub.userId.toString() : null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await connectDB();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // For mode: 'subscription', this is always followed by customer.subscription.created,
        // which does the actual write — nothing to persist here.
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await upsertSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await SubscriptionModel.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          { $set: { status: 'canceled', cancelAtPeriodEnd: false } }
        );
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = await resolveUserIdFromInvoice(invoice);
        if (userId) {
          const paidAtSeconds = invoice.status_transitions?.paid_at ?? invoice.created;
          await PaymentModel.findOneAndUpdate(
            { stripeInvoiceId: invoice.id },
            {
              $set: {
                userId,
                stripeSubscriptionId: subscriptionIdFromInvoice(invoice) ?? undefined,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: 'paid',
                paidAt: new Date(paidAtSeconds * 1000),
              },
            },
            { upsert: true, new: true }
          );
        } else {
          console.error('invoice.paid: could not resolve userId for invoice', invoice.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = await resolveUserIdFromInvoice(invoice);
        if (userId) {
          await PaymentModel.findOneAndUpdate(
            { stripeInvoiceId: invoice.id },
            {
              $set: {
                userId,
                stripeSubscriptionId: subscriptionIdFromInvoice(invoice) ?? undefined,
                amount: invoice.amount_due,
                currency: invoice.currency,
                status: invoice.status === 'void' ? 'void' : 'uncollectible',
              },
            },
            { upsert: true, new: true }
          );
        } else {
          console.error('invoice.payment_failed: could not resolve userId for invoice', invoice.id);
        }
        // Subscription.status is left untouched here — Stripe's own
        // customer.subscription.updated event is the source of truth for status.
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
