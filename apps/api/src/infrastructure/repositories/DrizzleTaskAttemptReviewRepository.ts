import { eq, and } from 'drizzle-orm';
import { db } from '../database/db';
import { taskAttemptReviews, attemptConsensusRecords } from '../database/schema';
import { TaskAttemptReviewEntity } from '../../domain/entities/TaskAttemptReview';
import type {
  ITaskAttemptReviewRepository,
  ConsensusRecord,
} from '../../domain/ports/ITaskAttemptReviewRepository';
import type { BlindReviewRole, BlindReviewStatus, ConsensusStatus } from '@flashlearn/shared';

export class DrizzleTaskAttemptReviewRepository implements ITaskAttemptReviewRepository {
  private toEntity(row: typeof taskAttemptReviews.$inferSelect): TaskAttemptReviewEntity {
    return new TaskAttemptReviewEntity({
      id: row.id,
      attemptId: row.attemptId,
      reviewerId: row.reviewerId,
      blindToken: row.blindToken,
      role: row.role as BlindReviewRole,
      status: row.status as BlindReviewStatus,
      rubricScores: (row.rubricScores as Record<string, number>) || undefined,
      totalScore: row.totalScore ?? undefined,
      notes: row.notes ?? undefined,
      submittedAt: row.submittedAt ? new Date(row.submittedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async create(entity: TaskAttemptReviewEntity): Promise<TaskAttemptReviewEntity> {
    const [row] = await db
      .insert(taskAttemptReviews)
      .values({
        id: entity.id,
        attemptId: entity.attemptId,
        reviewerId: entity.reviewerId,
        blindToken: entity.blindToken,
        role: entity.role,
        status: entity.status,
        rubricScores: entity.rubricScores,
        totalScore: entity.totalScore,
        notes: entity.notes,
        submittedAt: entity.submittedAt,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      })
      .returning();

    return this.toEntity(row);
  }

  async update(entity: TaskAttemptReviewEntity): Promise<TaskAttemptReviewEntity> {
    const [row] = await db
      .update(taskAttemptReviews)
      .set({
        role: entity.role,
        status: entity.status,
        rubricScores: entity.rubricScores,
        totalScore: entity.totalScore,
        notes: entity.notes,
        submittedAt: entity.submittedAt,
        updatedAt: entity.updatedAt,
      })
      .where(eq(taskAttemptReviews.id, entity.id))
      .returning();

    return this.toEntity(row);
  }

  async findById(id: string): Promise<TaskAttemptReviewEntity | null> {
    const [row] = await db.select().from(taskAttemptReviews).where(eq(taskAttemptReviews.id, id));
    return row ? this.toEntity(row) : null;
  }

  async findByBlindToken(blindToken: string): Promise<TaskAttemptReviewEntity | null> {
    const [row] = await db
      .select()
      .from(taskAttemptReviews)
      .where(eq(taskAttemptReviews.blindToken, blindToken));
    return row ? this.toEntity(row) : null;
  }

  async listByAttempt(attemptId: string): Promise<TaskAttemptReviewEntity[]> {
    const rows = await db
      .select()
      .from(taskAttemptReviews)
      .where(eq(taskAttemptReviews.attemptId, attemptId));
    return rows.map((r) => this.toEntity(r));
  }

  async listPendingByReviewer(reviewerId: string): Promise<TaskAttemptReviewEntity[]> {
    const rows = await db
      .select()
      .from(taskAttemptReviews)
      .where(
        and(
          eq(taskAttemptReviews.reviewerId, reviewerId),
          eq(taskAttemptReviews.status, 'assigned')
        )
      );
    return rows.map((r) => this.toEntity(r));
  }

  async saveConsensusRecord(
    record: Omit<ConsensusRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ConsensusRecord> {
    const existing = await this.findConsensusRecord(record.attemptId);

    if (existing) {
      const [updated] = await db
        .update(attemptConsensusRecords)
        .set({
          status: record.status,
          observedAgreement: record.observedAgreement.toString(),
          gwetAc1: record.gwetAc1.toString(),
          gwetAc2: record.gwetAc2.toString(),
          cohenKappa: record.cohenKappa.toString(),
          scoreDelta: record.scoreDelta.toString(),
          finalScore: record.finalScore,
          passed: record.passed,
          arbiterReviewId: record.arbiterReviewId,
          metrics: record.metrics,
          updatedAt: new Date(),
        })
        .where(eq(attemptConsensusRecords.attemptId, record.attemptId))
        .returning();

      return {
        id: updated.id,
        attemptId: updated.attemptId,
        status: updated.status as ConsensusStatus,
        observedAgreement: Number(updated.observedAgreement),
        gwetAc1: Number(updated.gwetAc1),
        gwetAc2: Number(updated.gwetAc2),
        cohenKappa: Number(updated.cohenKappa),
        scoreDelta: Number(updated.scoreDelta),
        finalScore: updated.finalScore ?? undefined,
        passed: updated.passed ?? undefined,
        arbiterReviewId: updated.arbiterReviewId ?? undefined,
        metrics: updated.metrics,
        createdAt: new Date(updated.createdAt),
        updatedAt: new Date(updated.updatedAt),
      };
    }

    const [inserted] = await db
      .insert(attemptConsensusRecords)
      .values({
        attemptId: record.attemptId,
        status: record.status,
        observedAgreement: record.observedAgreement.toString(),
        gwetAc1: record.gwetAc1.toString(),
        gwetAc2: record.gwetAc2.toString(),
        cohenKappa: record.cohenKappa.toString(),
        scoreDelta: record.scoreDelta.toString(),
        finalScore: record.finalScore,
        passed: record.passed,
        arbiterReviewId: record.arbiterReviewId,
        metrics: record.metrics,
      })
      .returning();

    return {
      id: inserted.id,
      attemptId: inserted.attemptId,
      status: inserted.status as ConsensusStatus,
      observedAgreement: Number(inserted.observedAgreement),
      gwetAc1: Number(inserted.gwetAc1),
      gwetAc2: Number(inserted.gwetAc2),
      cohenKappa: Number(inserted.cohenKappa),
      scoreDelta: Number(inserted.scoreDelta),
      finalScore: inserted.finalScore ?? undefined,
      passed: inserted.passed ?? undefined,
      arbiterReviewId: inserted.arbiterReviewId ?? undefined,
      metrics: inserted.metrics,
      createdAt: new Date(inserted.createdAt),
      updatedAt: new Date(inserted.updatedAt),
    };
  }

  async findConsensusRecord(attemptId: string): Promise<ConsensusRecord | null> {
    const [row] = await db
      .select()
      .from(attemptConsensusRecords)
      .where(eq(attemptConsensusRecords.attemptId, attemptId));

    if (!row) return null;

    return {
      id: row.id,
      attemptId: row.attemptId,
      status: row.status as ConsensusStatus,
      observedAgreement: Number(row.observedAgreement),
      gwetAc1: Number(row.gwetAc1),
      gwetAc2: Number(row.gwetAc2),
      cohenKappa: Number(row.cohenKappa),
      scoreDelta: Number(row.scoreDelta),
      finalScore: row.finalScore ?? undefined,
      passed: row.passed ?? undefined,
      arbiterReviewId: row.arbiterReviewId ?? undefined,
      metrics: row.metrics,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
