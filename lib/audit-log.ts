import AuditLogModel from '@/database/models/AuditLog';

export async function logAdminAction({
  adminId,
  targetUserId,
  action,
  previousStatus,
  newStatus,
}: {
  adminId: string;
  targetUserId: string;
  action: string;
  previousStatus: string;
  newStatus: string;
}) {
  await AuditLogModel.create({
    adminId,
    targetUserId,
    action,
    previousStatus,
    newStatus,
  });
}
