'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HumanNav } from '@/components/ui/human-nav';
import { InstructorApprovalGate } from '@/components/instructor-approval-gate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sessionExpired, setSessionExpired] = useState(false);

  const isActiveRoute = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    return pathname.startsWith(route);
  };

  useEffect(() => {
    // Check for session expiration on mount and pathname changes
    const checkSession = () => {
      if (status === 'unauthenticated') {
        setSessionExpired(true);
        // Add a small delay to show the message before redirecting
        setTimeout(() => {
          router.push('/auth/signin?message=Your session has expired. Please log in again.');
        }, 2000);
      }
    };

    checkSession();
  }, [status, router]);

  // Check if student needs to complete placement assessment
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'student') {
      if (!session.user.placementAssessment?.completed && pathname !== '/placement-assessment') {
        router.push('/placement-assessment');
      }
    }
  }, [status, session, pathname, router]);

  // Prevent back button access after logout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Push a new state to the history stack
      window.history.pushState(null, '', window.location.href);
      
      // Handle popstate event (back button)
      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
        
        // If user is not authenticated, redirect to signin
        if (status === 'unauthenticated') {
          router.push('/auth/signin?message=Your session has expired. Please log in again.');
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-slate-700">Loading...</div>
          <div className="text-sm text-slate-500 mt-1">Preparing your workspace</div>
        </div>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Expired</h2>
          <p className="text-slate-600 mb-6">Your session has expired. Please log in again to continue.</p>
          <div className="w-12 h-12 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <HumanNav variant="dashboard" />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed top-0 left-0 h-screen overflow-y-auto z-40">
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Navigation</h2>
            </div>
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActiveRoute('/dashboard')
                    ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className={`w-5 h-5 transition-colors ${
                  isActiveRoute('/dashboard') ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Dashboard</span>
              </Link>
              
              <Link
                href="/dashboard/courses"
                className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActiveRoute('/dashboard/courses')
                    ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className={`w-5 h-5 transition-colors ${
                  isActiveRoute('/dashboard/courses') ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-medium">Courses</span>
              </Link>
              
              {session?.user?.role === 'student' && (
                <Link
                  href="/dashboard/progress"
                  className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/dashboard/progress')
                      ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <svg className={`w-5 h-5 transition-colors ${
                    isActiveRoute('/dashboard/progress') ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium">Progress</span>
                </Link>
              )}
              
              <Link
                href="/dashboard/profile"
                className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActiveRoute('/dashboard/profile')
                    ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className={`w-5 h-5 transition-colors ${
                  isActiveRoute('/dashboard/profile') ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">Profile</span>
              </Link>
              
              {session.user?.role === 'admin' && (
                <>
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Admin</h3>
                  </div>
                  <Link
                    href="/dashboard/users"
                    className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActiveRoute('/dashboard/users')
                        ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <svg className={`w-5 h-5 transition-colors ${
                      isActiveRoute('/dashboard/users') ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="font-medium">Users</span>
                  </Link>
                  
                  <Link
                    href="/dashboard/analytics"
                    className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActiveRoute('/dashboard/analytics')
                        ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <svg className={`w-5 h-5 transition-colors ${
                      isActiveRoute('/dashboard/analytics') ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Analytics</span>
                  </Link>
                </>
              )}
              
              {session.user?.role === 'instructor' && (
                <>
                  <Link
                    href="/dashboard/create-course"
                    className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActiveRoute('/dashboard/create-course')
                        ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <svg className={`w-5 h-5 transition-colors ${
                      isActiveRoute('/dashboard/create-course') ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">Create Course</span>
                  </Link>
                  
                  <Link
                    href="/dashboard/modules"
                    className={`group flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActiveRoute('/dashboard/modules')
                        ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <svg className={`w-5 h-5 transition-colors ${
                      isActiveRoute('/dashboard/modules') ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-medium">Manage Modules</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gradient-to-br from-gray-50 via-white to-blue-50 ml-64">
          <div className="p-8">
            <InstructorApprovalGate>
              {children}
            </InstructorApprovalGate>
          </div>
        </main>
      </div>
    </div>
  );
}
