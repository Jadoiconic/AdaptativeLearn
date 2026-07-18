'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createPortalSession } from '@/actions/subscription';

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await createPortalSession();
      if (result.success) {
        window.location.href = result.url;
      } else {
        toast.error(result.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Portal session error:', err);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} variant="outline">
      {loading ? 'Redirecting…' : 'Manage Billing'}
    </Button>
  );
}
