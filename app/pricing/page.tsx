'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscribeButton } from '@/components/pricing/subscribe-button';
import { PLAN_CONFIG, PlanKey } from '@/lib/plans';

function formatPrice(amountCents: number, interval: 'month' | 'year') {
  const amount = (amountCents / 100).toFixed(0);
  return `$${amount}/${interval === 'month' ? 'mo' : 'yr'}`;
}

const savingsPercent = Math.round(
  (1 - PLAN_CONFIG.pro_annual.amountCents / (PLAN_CONFIG.pro.amountCents * 12)) * 100
);

const PLAN_ORDER: PlanKey[] = ['starter', 'pro', 'pro_annual'];

export default function PricingPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <header className="sticky top-0 z-50 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">AL</span>
            </div>
            <span className="font-bold text-gray-900">AdaptiveLearn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/pricing" className="text-gray-900 font-medium">Pricing</Link>
            {status === 'authenticated' && (
              <Link href="/dashboard/billing" className="hover:text-gray-900 transition-colors">Billing</Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : session ? (
              <Link href="/dashboard" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/signin" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Choose Your Plan</h1>
          <p className="text-slate-600">
            Unlock every course, HD video, and internship-ready training on AdaptiveLearn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLAN_ORDER.map((key) => {
            const plan = PLAN_CONFIG[key];
            return (
              <Card
                key={key}
                className={
                  plan.highlight
                    ? 'border-blue-300 shadow-lg relative'
                    : 'border-slate-200/60'
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full bg-blue-600 text-white">
                    Most Popular
                  </span>
                )}
                <CardHeader>
                  <CardTitle className="text-slate-900">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-slate-900">
                      {formatPrice(plan.amountCents, plan.interval)}
                    </span>
                    {key === 'pro_annual' && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Save {savingsPercent}%
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <SubscribeButton planKey={key} label="Subscribe" highlight={plan.highlight} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
