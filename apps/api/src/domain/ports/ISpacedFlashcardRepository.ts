import type { SpacedFlashcardEntity } from '../entities/SpacedFlashcard';

export interface ISpacedFlashcardRepository {
  create(card: {
    userId: string;
    competencyId: string;
    sourceChunkId?: string | null;
    front: string;
    back: string;
    category?: string;
  }): Promise<SpacedFlashcardEntity>;

  findDueCards(userId: string, limit?: number): Promise<SpacedFlashcardEntity[]>;
  findById(id: string): Promise<SpacedFlashcardEntity | null>;
  updateRepetition(cardId: string, intervalDays: number, easeFactor: number, repetitionCount: number, nextDue: Date): Promise<void>;
  listByUser(userId: string): Promise<SpacedFlashcardEntity[]>;
  listByCompetency(competencyId: string): Promise<SpacedFlashcardEntity[]>;
}
