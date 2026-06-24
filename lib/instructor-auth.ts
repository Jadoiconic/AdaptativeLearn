import { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import connectDB from '@/database/connection';
import { UserModel } from '@/database/models';

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

export function isApprovedInstructor(session: Session | null): boolean {
  return (
    session?.user?.role === 'instructor' &&
    session.user.approvalStatus === 'approved'
  );
}

export async function verifyApprovedInstructor(
  userId: string
): Promise<{ approved: boolean; message?: string }> {
  await connectDB();
  const instructor = await UserModel.findById(userId).select(
    'approvalStatus isActive role'
  );

  if (!instructor || instructor.role !== 'instructor') {
    return { approved: false, message: 'Instructor not found' };
  }

  if (!instructor.isActive) {
    return { approved: false, message: INSTRUCTOR_SUSPENDED_MESSAGE };
  }

  if (instructor.approvalStatus !== 'approved') {
    const message =
      instructor.approvalStatus === 'rejected'
        ? INSTRUCTOR_REJECTED_MESSAGE
        : INSTRUCTOR_PENDING_MESSAGE;
    return { approved: false, message };
  }

  return { approved: true };
}

export function instructorAccessDeniedResponse(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export async function requireApprovedInstructorSession(
  session: Session | null
): Promise<NextResponse | null> {
  if (!session || session.user.role !== 'instructor') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Instructor access required.' },
      { status: 403 }
    );
  }

  const result = await verifyApprovedInstructor(session.user.id);
  if (!result.approved) {
    return instructorAccessDeniedResponse(result.message!);
  }

  return null;
}
