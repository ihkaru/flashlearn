import type { AuditLogEntity } from '../entities/AuditLog';
import type { AuditAction } from '@flashlearn/shared';

export interface IAuditLogRepository {
  append(log: {
    workspaceId: string;
    actorId: string;
    action: AuditAction;
    targetType: 'gate' | 'competency' | 'attempt' | 'source' | 'content';
    targetId: string;
    payload: Record<string, any>;
  }): Promise<AuditLogEntity>;

  listByWorkspace(workspaceId: string, limit?: number): Promise<AuditLogEntity[]>;
  listByTarget(targetType: string, targetId: string): Promise<AuditLogEntity[]>;
}
