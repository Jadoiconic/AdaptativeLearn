import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function PremiumLock({ variant }: { variant: 'badge' | 'panel' }) {
  if (variant === 'badge') {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
        🔒 Locked
      </span>
    );
  }

  return (
    <div className="text-center py-12 border border-dashed border-amber-200 rounded-lg bg-amber-50/50">
      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
        🔒
      </div>
      <p className="text-slate-700 font-medium mb-1">Subscribe to unlock this lesson</p>
      <p className="text-sm text-slate-500 mb-4">
        Get full access to all course content, videos, and resources.
      </p>
      <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
        <Link href="/pricing">Upgrade Now</Link>
      </Button>
    </div>
  );
}
