export const INSTRUCTOR_PENDING_MESSAGE =
  'Your instructor account is awaiting administrator approval.';
export const INSTRUCTOR_REJECTED_MESSAGE =
  'Your instructor account application was rejected. Please contact an administrator.';
export const INSTRUCTOR_SUSPENDED_MESSAGE =
  'Your instructor account has been suspended. Please contact an administrator.';

export function getInstructorAccessMessage(
  approvalStatus?: string,
  isActive?: boolean
): string | null {
  if (isActive === false) return INSTRUCTOR_SUSPENDED_MESSAGE;
  if (approvalStatus === 'pending') return INSTRUCTOR_PENDING_MESSAGE;
  if (approvalStatus === 'rejected') return INSTRUCTOR_REJECTED_MESSAGE;
  return null;
}

export function isApprovedInstructor(session: any): boolean {
  return (
    session?.user?.role === 'instructor' &&
    session.user.approvalStatus === 'approved'
  );
}
