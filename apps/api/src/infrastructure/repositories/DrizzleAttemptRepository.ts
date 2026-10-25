import { eq, and, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { attempts } from '../database/schema';
import { AttemptEntity } from '../../domain/entities/Attempt';
import type { IAttemptRepository, CreateAttemptData } from '../../domain/ports/IAttemptRepository';
import type { OracleClass } from '@flashlearn/shared';

export class DrizzleAttemptRepository implements IAttemptRepository {
  private mapToEntity(row: typeof attempts.$inferSelect): AttemptEntity {
    return new AttemptEntity({
      id: row.id,
      taskId: row.taskId,
      userId: row.userId,
      submission: row.submission as Record<string, any>,
      score: row.score,
      feedback: row.feedback,
      assessedBy: row.assessedBy,
      oracleClassUsed: row.oracleClassUsed as OracleClass,
      passed: row.passed,
      isUnaided: row.isUnaided,
      aiHintsUsedCount: row.aiHintsUsedCount,
      isPractice: row.isPractice,
      details: row.details as any,
      createdAt: row.createdAt,
    });
  }

  async findById(id: string): Promise<AttemptEntity | null> {
    const [row] = await db.select().from(attempts).where(eq(attempts.id, id));
    return row ? this.mapToEntity(row) : null;
  }

  async listByUser(userId: string): Promise<AttemptEntity[]> {
    const rows = await db
      .select()
      .from(attempts)
      .where(eq(attempts.userId, userId))
      .orderBy(desc(attempts.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async listByTask(taskId: string): Promise<AttemptEntity[]> {
    const rows = await db
      .select()
      .from(attempts)
      .where(eq(attempts.taskId, taskId))
      .orderBy(desc(attempts.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async findLatestPassedAttempt(userId: string, taskId: string): Promise<AttemptEntity | null> {
    const [row] = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.taskId, taskId), eq(attempts.passed, true)))
      .orderBy(desc(attempts.createdAt))
      .limit(1);

    return row ? this.mapToEntity(row) : null;
  }

  async create(data: CreateAttemptData): Promise<AttemptEntity> {
    const [row] = await db
      .insert(attempts)
      .values({
        taskId: data.taskId,
        userId: data.userId,
        submission: data.submission,
        score: data.score,
        feedback: data.feedback,
        assessedBy: data.assessedBy,
        oracleClassUsed: data.oracleClassUsed,
        passed: data.passed,
        isUnaided: data.isUnaided ?? false,
        aiHintsUsedCount: data.aiHintsUsedCount ?? 0,
        isPractice: data.isPractice ?? false,
        details: data.details,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async updateEvaluation(id: string, update: {
    score: number;
    passed: boolean;
    feedback: string;
    assessedBy: string;
    details?: any;
  }): Promise<AttemptEntity> {
    const [row] = await db
      .update(attempts)
      .set({
        score: update.score,
        passed: update.passed,
        feedback: update.feedback,
        assessedBy: update.assessedBy,
        details: update.details,
      })
      .where(eq(attempts.id, id))
      .returning();

    if (!row) throw new Error(`Attempt '${id}' not found`);
    return this.mapToEntity(row);
  }

  async listPendingClassC(): Promise<AttemptEntity[]> {
    const rows = await db
      .select()
      .from(attempts)
      .where(and(
        eq(attempts.oracleClassUsed, 'C'),
        eq(attempts.assessedBy, 'pending_expert_review')
      ))
      .orderBy(desc(attempts.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }
}
