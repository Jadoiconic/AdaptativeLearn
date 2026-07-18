export type PlanKey = 'starter' | 'pro' | 'pro_annual';

interface PlanConfig {
  priceId: string;
  name: string;
  interval: 'month' | 'year';
  amountCents: number;
  features: string[];
  highlight?: boolean;
}

export const PLAN_CONFIG: Record<PlanKey, PlanConfig> = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    name: 'Starter',
    interval: 'month',
    amountCents: 1900,
    features: ['Access to all courses', 'HD videos'],
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    name: 'Pro',
    interval: 'month',
    amountCents: 3900,
    features: [
      'Everything in Starter',
      'Certificates',
      'Downloadable resources',
      'Priority support',
    ],
    highlight: true,
  },
  pro_annual: {
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL ?? '',
    name: 'Annual Pro',
    interval: 'year',
    amountCents: 39000,
    features: ['Everything in Pro', 'Discounted yearly billing'],
  },
};

export function planKeyFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  const entry = (Object.entries(PLAN_CONFIG) as [PlanKey, PlanConfig][]).find(
    ([, cfg]) => cfg.priceId === priceId
  );
  return entry ? entry[0] : null;
}
