'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProfessionalButton } from './professional-button';
import { cn } from '@/lib/utils';

interface ProfessionalNavProps {
  variant?: 'landing' | 'dashboard';
}

export function ProfessionalNav({ variant = 'landing' }: ProfessionalNavProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    router.push('/auth/signin');
  };

  if (variant === 'dashboard') {
    return (
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AL</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AdaptiveLearn</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/courses" 
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Courses
                </Link>
                <Link 
                  href="/dashboard/progress" 
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Progress
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-gray-900">{session?.user?.name}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {session?.user?.role}
                </span>
              </div>
              <ProfessionalButton 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </ProfessionalButton>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AL</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AdaptiveLearn</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="#features" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link 
              href="#roles" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Roles
            </Link>
            <Link 
              href="#technology" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Technology
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : session ? (
              <Link href="/dashboard">
                <ProfessionalButton variant="secondary" size="sm">
                  Dashboard
                </ProfessionalButton>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <ProfessionalButton variant="outline" size="sm">
                    Sign In
                  </ProfessionalButton>
                </Link>
                <Link href="/auth/signup">
                  <ProfessionalButton size="sm">
                    Get Started
                  </ProfessionalButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
