'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { resumeSubscription } from '@/actions/subscription';

export function ResumeSubscriptionButton({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await resumeSubscription();
      if (result.success) {
        toast.success('Your subscription has been resumed.');
        onDone();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error('Resume subscription error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} className="bg-green-600 hover:bg-green-700">
      {loading ? 'Resuming…' : 'Resume Subscription'}
    </Button>
  );
}
