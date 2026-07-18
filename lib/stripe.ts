import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Please define the STRIPE_SECRET_KEY environment variable');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export { PLAN_CONFIG, planKeyFromPriceId } from './plans';
export type { PlanKey } from './plans';
