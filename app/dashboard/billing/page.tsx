'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ManageBillingButton } from '@/components/billing/manage-billing-button';
import { CancelSubscriptionButton } from '@/components/billing/cancel-subscription-button';
import { ResumeSubscriptionButton } from '@/components/billing/resume-subscription-button';
import { syncCheckoutSession } from '@/actions/subscription';
import { PLAN_CONFIG, PlanKey } from '@/lib/plans';

interface Subscription {
  plan: PlanKey;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  trialing: 'bg-blue-100 text-blue-700 border-blue-200',
  past_due: 'bg-amber-100 text-amber-700 border-amber-200',
  canceled: 'bg-gray-100 text-gray-700 border-gray-200',
  unpaid: 'bg-red-100 text-red-700 border-red-200',
  incomplete: 'bg-gray-100 text-gray-700 border-gray-200',
  incomplete_expired: 'bg-gray-100 text-gray-700 border-gray-200',
  paused: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  void: 'bg-gray-100 text-gray-700 border-gray-200',
  uncollectible: 'bg-red-100 text-red-700 border-red-200',
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchBilling = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription');
      const data = await response.json();
      if (data.success) {
        setSubscription(data.subscription);
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching billing info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');
    if (checkout !== 'success' || !sessionId) return;

    (async () => {
      const result = await syncCheckoutSession(sessionId);
      if (result.success) {
        toast.success('Subscription activated!');
        fetchBilling();
      } else {
        toast.error(result.error);
      }
      router.replace('/dashboard/billing');
    })();
  }, [searchParams, router, fetchBilling]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="border-slate-200/60">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Billing</h1>
        <p className="text-slate-600">Manage your subscription and view payment history.</p>
      </div>

      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-slate-900">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold text-slate-900">
                  {PLAN_CONFIG[subscription.plan]?.name ?? subscription.plan}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${
                    STATUS_STYLE[subscription.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {subscription.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {subscription.cancelAtPeriodEnd
                  ? `Your subscription will cancel on ${new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}.`
                  : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`}
              </p>
              <div className="flex items-center gap-3">
                <ManageBillingButton />
                {subscription.cancelAtPeriodEnd ? (
                  <ResumeSubscriptionButton onDone={fetchBilling} />
                ) : (
                  <CancelSubscriptionButton onDone={fetchBilling} />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">You don't have an active subscription yet.</p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Link href="/pricing">View Plans</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-slate-900">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Amount</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 text-slate-700">
                        {new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${
                            PAYMENT_STATUS_STYLE[payment.status] ??
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
