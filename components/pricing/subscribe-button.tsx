'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/actions/subscription';
import type { PlanKey } from '@/lib/plans';

export function SubscribeButton({
  planKey,
  label,
  highlight,
}: {
  planKey: PlanKey;
  label: string;
  highlight?: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    setLoading(true);
    try {
      const result = await createCheckoutSession(planKey);
      if (result.success) {
        window.location.href = result.url;
      } else {
        toast.error(result.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={
        highlight
          ? 'w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
          : 'w-full'
      }
      variant={highlight ? 'default' : 'outline'}
    >
      {loading ? 'Redirecting…' : label}
    </Button>
  );
}
