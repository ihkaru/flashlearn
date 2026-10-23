import { eq, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { auditLogs } from '../database/schema';
import { AuditLogEntity } from '../../domain/entities/AuditLog';
import type { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository';
import type { AuditAction } from '@flashlearn/shared';

export class DrizzleAuditLogRepository implements IAuditLogRepository {
  private mapToEntity(row: typeof auditLogs.$inferSelect): AuditLogEntity {
    return new AuditLogEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      actorId: row.actorId,
      action: row.action as AuditAction,
      targetType: row.targetType as any,
      targetId: row.targetId,
      payload: row.payload as Record<string, any>,
      createdAt: row.createdAt,
    });
  }

  async append(log: {
    workspaceId: string;
    actorId: string;
    action: AuditAction;
    targetType: 'gate' | 'competency' | 'attempt' | 'source';
    targetId: string;
    payload: Record<string, any>;
  }): Promise<AuditLogEntity> {
    const [row] = await db
      .insert(auditLogs)
      .values({
        workspaceId: log.workspaceId,
        actorId: log.actorId,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        payload: log.payload,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async listByWorkspace(workspaceId: string, limit = 50): Promise<AuditLogEntity[]> {
    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.workspaceId, workspaceId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return rows.map((r) => this.mapToEntity(r));
  }

  async listByTarget(targetType: string, targetId: string): Promise<AuditLogEntity[]> {
    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.targetId, targetId))
      .orderBy(desc(auditLogs.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }
}
