'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cancelSubscription } from '@/actions/subscription';

export function CancelSubscriptionButton({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (
      !window.confirm(
        'Are you sure you want to cancel your subscription? You will keep access until the end of your current billing period.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await cancelSubscription();
      if (result.success) {
        toast.success('Your subscription will cancel at the end of the current period.');
        onDone();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error('Cancel subscription error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      className="text-red-600 border-red-200 hover:bg-red-50"
    >
      {loading ? 'Cancelling…' : 'Cancel Subscription'}
    </Button>
  );
}
