import { eq, and, or, inArray } from 'drizzle-orm';
import { db } from '../database/db';
import { masteryRecords } from '../database/schema';
import { MasteryRecordEntity } from '../../domain/entities/MasteryRecord';
import type { IMasteryRepository } from '../../domain/ports/IMasteryRepository';
import type { MasteryStatus, CompetencyDriftStatus } from '@flashlearn/shared';

export class DrizzleMasteryRepository implements IMasteryRepository {
  private mapToEntity(row: typeof masteryRecords.$inferSelect): MasteryRecordEntity {
    return new MasteryRecordEntity({
      id: row.id,
      userId: row.userId,
      competencyId: row.competencyId,
      status: row.status as MasteryStatus,
      verifiedAttemptId: row.verifiedAttemptId,
      masteredAt: row.masteredAt,
      retestDueAt: row.retestDueAt,
      difficulty: row.difficulty ? Number(row.difficulty) : 5.0,
      stability: row.stability ? Number(row.stability) : 30.0,
      lastDemonstratedAt: row.lastDemonstratedAt ? new Date(row.lastDemonstratedAt) : (row.masteredAt || row.createdAt),
      cachedRetrievability: row.cachedRetrievability ? Number(row.cachedRetrievability) : 1.0,
      driftStatus: (row.driftStatus as CompetencyDriftStatus) || 'active',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByUserAndCompetency(userId: string, competencyId: string): Promise<MasteryRecordEntity | null> {
    const [row] = await db
      .select()
      .from(masteryRecords)
      .where(and(eq(masteryRecords.userId, userId), eq(masteryRecords.competencyId, competencyId)));

    return row ? this.mapToEntity(row) : null;
  }

  async listByUser(userId: string): Promise<MasteryRecordEntity[]> {
    const rows = await db
      .select()
      .from(masteryRecords)
      .where(eq(masteryRecords.userId, userId));

    return rows.map((r) => this.mapToEntity(r));
  }

  async listAllMastered(): Promise<MasteryRecordEntity[]> {
    const rows = await db
      .select()
      .from(masteryRecords)
      .where(or(eq(masteryRecords.status, 'mastered'), eq(masteryRecords.status, 'stale')));

    return rows.map((r) => this.mapToEntity(r));
  }

  async batchGetStatus(userId: string, competencyIds: string[]): Promise<Map<string, MasteryRecordEntity>> {
    const map = new Map<string, MasteryRecordEntity>();
    if (competencyIds.length === 0) return map;

    const rows = await db
      .select()
      .from(masteryRecords)
      .where(
        and(
          eq(masteryRecords.userId, userId),
          inArray(masteryRecords.competencyId, competencyIds)
        )
      );

    for (const r of rows) {
      map.set(r.competencyId, this.mapToEntity(r));
    }

    return map;
  }

  async upsertStatus(
    userId: string,
    competencyId: string,
    status: MasteryStatus,
    verifiedAttemptId?: string | null
  ): Promise<MasteryRecordEntity> {
    const now = new Date();
    const existing = await this.findByUserAndCompetency(userId, competencyId);

    if (existing) {
      const updateData: Record<string, any> = {
        status,
        updatedAt: now,
      };

      if (verifiedAttemptId !== undefined) {
        updateData.verifiedAttemptId = verifiedAttemptId;
      }
      if (status === 'mastered') {
        updateData.masteredAt = now;
      }

      const [updated] = await db
        .update(masteryRecords)
        .set(updateData)
        .where(eq(masteryRecords.id, existing.id))
        .returning();

      return this.mapToEntity(updated);
    }

    const [created] = await db
      .insert(masteryRecords)
      .values({
        userId,
        competencyId,
        status,
        verifiedAttemptId: verifiedAttemptId || null,
        masteredAt: status === 'mastered' ? now : null,
      })
      .returning();

    return this.mapToEntity(created);
  }

  async markStaleForCompetency(competencyId: string): Promise<number> {
    const updated = await db
      .update(masteryRecords)
      .set({
        status: 'stale',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(masteryRecords.competencyId, competencyId),
          eq(masteryRecords.status, 'mastered')
        )
      )
      .returning();

    return updated.length;
  }

  async updateDriftState(
    id: string,
    update: {
      stability?: number;
      difficulty?: number;
      lastDemonstratedAt?: Date;
      cachedRetrievability?: number;
      driftStatus?: CompetencyDriftStatus;
      status?: MasteryStatus;
    }
  ): Promise<void> {
    const values: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (update.cachedRetrievability !== undefined) {
      values.cachedRetrievability = update.cachedRetrievability.toString();
    }
    if (update.driftStatus !== undefined) {
      values.driftStatus = update.driftStatus;
    }
    if (update.stability !== undefined) {
      values.stability = update.stability.toString();
    }
    if (update.difficulty !== undefined) {
      values.difficulty = update.difficulty.toString();
    }
    if (update.lastDemonstratedAt !== undefined) {
      values.lastDemonstratedAt = update.lastDemonstratedAt;
    }
    if (update.status !== undefined) {
      values.status = update.status;
    }

    await db.update(masteryRecords).set(values).where(eq(masteryRecords.id, id));
  }
}
