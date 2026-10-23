import { eq, and, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { gates, gateRequirements, userGateGrants } from '../database/schema';
import { GateEntity } from '../../domain/entities/Gate';
import { UserGateGrantEntity } from '../../domain/entities/UserGateGrant';
import type { IGateRepository } from '../../domain/ports/IGateRepository';
import type { GateLevel, GateRequirement } from '@flashlearn/shared';

export class DrizzleGateRepository implements IGateRepository {
  private async loadRequirementsForGate(gateId: string): Promise<GateRequirement[]> {
    const rows = await db.select().from(gateRequirements).where(eq(gateRequirements.gateId, gateId));
    return rows.map((r) => ({
      id: r.id,
      gateId: r.gateId,
      competencyId: r.competencyId,
      minimumScore: r.minimumScore,
      requiresHumanApproval: r.requiresHumanApproval,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createGate(gate: {
    workspaceId: string;
    level: GateLevel;
    title: string;
    description: string;
  }): Promise<GateEntity> {
    const [row] = await db
      .insert(gates)
      .values({
        workspaceId: gate.workspaceId,
        level: gate.level,
        title: gate.title,
        description: gate.description,
      })
      .returning();

    return new GateEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      level: row.level as GateLevel,
      title: row.title,
      description: row.description,
      requirements: [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async addRequirements(gateId: string, reqs: Array<{
    competencyId: string;
    minimumScore: number;
    requiresHumanApproval: boolean;
  }>): Promise<GateRequirement[]> {
    if (reqs.length === 0) return [];

    const inserted = await db
      .insert(gateRequirements)
      .values(
        reqs.map((r) => ({
          gateId,
          competencyId: r.competencyId,
          minimumScore: r.minimumScore,
          requiresHumanApproval: r.requiresHumanApproval,
        }))
      )
      .returning();

    return inserted.map((r) => ({
      id: r.id,
      gateId: r.gateId,
      competencyId: r.competencyId,
      minimumScore: r.minimumScore,
      requiresHumanApproval: r.requiresHumanApproval,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async findById(id: string): Promise<GateEntity | null> {
    const [row] = await db.select().from(gates).where(eq(gates.id, id));
    if (!row) return null;
    const reqs = await this.loadRequirementsForGate(row.id);
    return new GateEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      level: row.level as GateLevel,
      title: row.title,
      description: row.description,
      requirements: reqs,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByWorkspaceAndLevel(workspaceId: string, level: GateLevel): Promise<GateEntity | null> {
    const [row] = await db
      .select()
      .from(gates)
      .where(and(eq(gates.workspaceId, workspaceId), eq(gates.level, level)));

    if (!row) return null;
    const reqs = await this.loadRequirementsForGate(row.id);
    return new GateEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      level: row.level as GateLevel,
      title: row.title,
      description: row.description,
      requirements: reqs,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async listByWorkspace(workspaceId: string): Promise<GateEntity[]> {
    const rows = await db
      .select()
      .from(gates)
      .where(eq(gates.workspaceId, workspaceId))
      .orderBy(gates.level);

    const result: GateEntity[] = [];
    for (const r of rows) {
      const reqs = await this.loadRequirementsForGate(r.id);
      result.push(
        new GateEntity({
          id: r.id,
          workspaceId: r.workspaceId,
          level: r.level as GateLevel,
          title: r.title,
          description: r.description,
          requirements: reqs,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
      );
    }
    return result;
  }

  async createGrant(grant: {
    userId: string;
    gateId: string;
    status: 'active' | 'provisional' | 'revoked';
    grantedBy: string;
    evidenceSnapshot: Record<string, any>;
  }): Promise<UserGateGrantEntity> {
    const [row] = await db
      .insert(userGateGrants)
      .values({
        userId: grant.userId,
        gateId: grant.gateId,
        status: grant.status,
        grantedBy: grant.grantedBy,
        evidenceSnapshot: grant.evidenceSnapshot,
      })
      .returning();

    return new UserGateGrantEntity({
      id: row.id,
      userId: row.userId,
      gateId: row.gateId,
      status: row.status as any,
      grantedAt: row.grantedAt,
      grantedBy: row.grantedBy,
      revokedAt: row.revokedAt,
      revocationReason: row.revocationReason,
      evidenceSnapshot: row.evidenceSnapshot as any,
    });
  }

  async findGrantByUserAndGate(userId: string, gateId: string): Promise<UserGateGrantEntity | null> {
    const [row] = await db
      .select()
      .from(userGateGrants)
      .where(and(eq(userGateGrants.userId, userId), eq(userGateGrants.gateId, gateId)))
      .orderBy(desc(userGateGrants.grantedAt))
      .limit(1);

    if (!row) return null;
    return new UserGateGrantEntity({
      id: row.id,
      userId: row.userId,
      gateId: row.gateId,
      status: row.status as any,
      grantedAt: row.grantedAt,
      grantedBy: row.grantedBy,
      revokedAt: row.revokedAt,
      revocationReason: row.revocationReason,
      evidenceSnapshot: row.evidenceSnapshot as any,
    });
  }

  async listGrantsByUser(userId: string): Promise<UserGateGrantEntity[]> {
    const rows = await db
      .select()
      .from(userGateGrants)
      .where(eq(userGateGrants.userId, userId))
      .orderBy(desc(userGateGrants.grantedAt));

    return rows.map(
      (r) =>
        new UserGateGrantEntity({
          id: r.id,
          userId: r.userId,
          gateId: r.gateId,
          status: r.status as any,
          grantedAt: r.grantedAt,
          grantedBy: r.grantedBy,
          revokedAt: r.revokedAt,
          revocationReason: r.revocationReason,
          evidenceSnapshot: r.evidenceSnapshot as any,
        })
    );
  }

  async updateGrantStatus(grantId: string, status: 'active' | 'provisional' | 'revoked', reason?: string): Promise<void> {
    await db
      .update(userGateGrants)
      .set({
        status,
        revocationReason: reason || null,
        revokedAt: status === 'revoked' ? new Date() : null,
      })
      .where(eq(userGateGrants.id, grantId));
  }

  async suspendGrantsForWorkspace(workspaceId: string, reason: string): Promise<number> {
    const gateRows = await db.select({ id: gates.id }).from(gates).where(eq(gates.workspaceId, workspaceId));
    if (gateRows.length === 0) return 0;

    let count = 0;
    for (const g of gateRows) {
      const updated = await db
        .update(userGateGrants)
        .set({
          status: 'provisional',
          revocationReason: reason,
        })
        .where(and(eq(userGateGrants.gateId, g.id), eq(userGateGrants.status, 'active')))
        .returning();
      count += updated.length;
    }
    return count;
  }
}
