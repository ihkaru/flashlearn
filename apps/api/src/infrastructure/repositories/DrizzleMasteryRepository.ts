import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../database/db';
import { masteryRecords } from '../database/schema';
import { MasteryRecordEntity } from '../../domain/entities/MasteryRecord';
import type { IMasteryRepository } from '../../domain/ports/IMasteryRepository';
import type { MasteryStatus } from '@flashlearn/shared';

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
}
