import { AuditLog } from '../types/database.types';

export class AuditService {
  /**
   * Log system audit event securely without sensitive keys
   */
  static logActivity(
    action: string,
    entityType: string,
    entityId?: string,
    actorUserId?: string,
    metadata?: Record<string, any>
  ): AuditLog {
    const sanitizedMetadata = { ...metadata };

    // Strip passwords, OTPs, or payment secrets if present
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.otp;
    delete sanitizedMetadata.secret;
    delete sanitizedMetadata.token;

    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      actor_user_id: actorUserId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: sanitizedMetadata,
      created_at: new Date().toISOString(),
    };

    console.log(`[AuditLog] ${action} on ${entityType}:${entityId || 'N/A'} by ${actorUserId || 'SYSTEM'}`);
    return log;
  }
}
