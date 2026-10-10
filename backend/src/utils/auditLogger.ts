import AuditLog from '../models/AuditLog';

export const logAudit = async (data: {
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  summary: string;
  outcome: 'success' | 'failure';
  details?: any;
}) => {
  try {
    await AuditLog.create(data);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
