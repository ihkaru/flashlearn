import { eq, and, lte, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { spacedFlashcards } from '../database/schema';
import { SpacedFlashcardEntity } from '../../domain/entities/SpacedFlashcard';
import type { ISpacedFlashcardRepository } from '../../domain/ports/ISpacedFlashcardRepository';

export class DrizzleSpacedFlashcardRepository implements ISpacedFlashcardRepository {
  private mapToEntity(row: typeof spacedFlashcards.$inferSelect): SpacedFlashcardEntity {
    return new SpacedFlashcardEntity({
      id: row.id,
      userId: row.userId,
      competencyId: row.competencyId,
      sourceChunkId: row.sourceChunkId,
      cardType: row.cardType as any,
      front: row.front,
      back: row.back,
      predictionOptions: row.predictionOptions ?? undefined,
      causalRationale: row.causalRationale ?? undefined,
      category: row.category,
      repetitionIntervalDays: row.repetitionIntervalDays,
      easeFactor: row.easeFactor,
      repetitionCount: row.repetitionCount,
      nextReviewDue: row.nextReviewDue,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(card: {
    userId: string;
    competencyId: string;
    sourceChunkId?: string | null;
    cardType?: any;
    front: string;
    back: string;
    predictionOptions?: string[];
    causalRationale?: string;
    category?: string;
  }): Promise<SpacedFlashcardEntity> {
    const [row] = await db
      .insert(spacedFlashcards)
      .values({
        userId: card.userId,
        competencyId: card.competencyId,
        sourceChunkId: card.sourceChunkId || null,
        cardType: card.cardType || 'definition',
        front: card.front,
        back: card.back,
        predictionOptions: card.predictionOptions,
        causalRationale: card.causalRationale,
        category: card.category || 'general',
      })
      .returning();

    return this.mapToEntity(row);
  }

  async findDueCards(userId: string, limit = 20): Promise<SpacedFlashcardEntity[]> {
    const now = new Date();
    const rows = await db
      .select()
      .from(spacedFlashcards)
      .where(and(eq(spacedFlashcards.userId, userId), lte(spacedFlashcards.nextReviewDue, now)))
      .orderBy(spacedFlashcards.nextReviewDue)
      .limit(limit);

    return rows.map((r) => this.mapToEntity(r));
  }

  async findById(id: string): Promise<SpacedFlashcardEntity | null> {
    const [row] = await db.select().from(spacedFlashcards).where(eq(spacedFlashcards.id, id));
    return row ? this.mapToEntity(row) : null;
  }

  async updateRepetition(
    cardId: string,
    intervalDays: number,
    easeFactor: number,
    repetitionCount: number,
    nextDue: Date
  ): Promise<void> {
    await db
      .update(spacedFlashcards)
      .set({
        repetitionIntervalDays: intervalDays,
        easeFactor,
        repetitionCount,
        nextReviewDue: nextDue,
        updatedAt: new Date(),
      })
      .where(eq(spacedFlashcards.id, cardId));
  }

  async listByUser(userId: string): Promise<SpacedFlashcardEntity[]> {
    const rows = await db
      .select()
      .from(spacedFlashcards)
      .where(eq(spacedFlashcards.userId, userId))
      .orderBy(desc(spacedFlashcards.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }
}
