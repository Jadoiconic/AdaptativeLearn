'use client';

import { useSession } from 'next-auth/react';
import { getInstructorAccessMessage } from '@/lib/instructor-auth-client';

interface InstructorApprovalGateProps {
  children: React.ReactNode;
}

export function InstructorApprovalGate({ children }: InstructorApprovalGateProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== 'instructor') {
    return <>{children}</>;
  }

  const message = getInstructorAccessMessage(session.user.approvalStatus);
  if (!message) {
    return <>{children}</>;
  }

  const isRejected = session.user.approvalStatus === 'rejected';
  const borderColor = isRejected ? 'border-red-400' : 'border-yellow-400';
  const bgColor = isRejected ? 'bg-red-50' : 'bg-yellow-50';
  const textColor = isRejected ? 'text-red-700' : 'text-yellow-700';
  const iconColor = isRejected ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className={`${bgColor} border-l-4 ${borderColor} p-4 mb-8 rounded-md`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className={`text-sm ${textColor} font-medium`}>{message}</p>
            {!isRejected && (
              <p className={`mt-2 text-sm ${textColor}`}>
                You will gain access to course management features once an administrator approves
                your account.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
