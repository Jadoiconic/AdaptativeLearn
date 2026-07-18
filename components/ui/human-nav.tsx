'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HumanButton } from './human-button';
import { cn } from '@/lib/utils';
import { PLAN_CONFIG, PlanKey } from '@/lib/plans';

interface HumanNavProps {
  variant?: 'landing' | 'dashboard';
}

function usePlanLabel(enabled: boolean) {
  const [plan, setPlan] = useState<PlanKey | null | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch('/api/subscription')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPlan(data.success && data.subscription ? data.subscription.plan : null);
      })
      .catch(() => {
        if (!cancelled) setPlan(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled || plan === undefined) return null;
  return plan ? PLAN_CONFIG[plan].name : 'Free';
}

export function HumanNav({ variant = 'landing' }: HumanNavProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const planLabel = usePlanLabel(variant === 'dashboard' && session?.user?.role === 'student');

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/auth/signin'
      });
      
      // Clear any local storage data
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Redirect to signin page
      router.push('/auth/signin');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      router.push('/auth/signin');
    }
  };

  if (variant === 'dashboard') {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                  <span className="text-white font-bold text-sm">AL</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AdaptiveLearn</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-1">
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/courses" 
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Courses
                </Link>
                <Link 
                  href="/dashboard/progress" 
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Progress
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm text-gray-500">Welcome back,</span>
                <span className="text-sm font-semibold text-gray-900">{session?.user?.name}</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                  {session?.user?.role}
                </span>
                {planLabel && (
                  <Link
                    href="/dashboard/billing"
                    className={cn(
                      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm transition-colors',
                      planLabel === 'Free'
                        ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                    )}
                  >
                    {planLabel}
                  </Link>
                )}
              </div>
              <HumanButton
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Sign Out
              </HumanButton>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                <span className="text-white font-bold text-sm">AL</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AdaptiveLearn</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="#features" 
              className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Features
            </Link>
            <Link 
              href="#roles" 
              className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              For Who
            </Link>
            <Link 
              href="#technology" 
              className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              How It Works
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
            ) : session ? (
              <Link href="/dashboard">
                <HumanButton variant="secondary" size="sm" className="bg-gray-100 hover:bg-gray-200 text-gray-900 transition-all duration-200">
                  Go to Dashboard
                </HumanButton>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <HumanButton variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-50 transition-all duration-200">
                    Sign In
                  </HumanButton>
                </Link>
                <Link href="/auth/signup">
                  <HumanButton size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md transition-all duration-200">
                    Get Started
                  </HumanButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
