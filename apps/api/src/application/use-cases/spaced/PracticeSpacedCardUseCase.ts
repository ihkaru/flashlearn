import type { ISpacedFlashcardRepository } from '../../../domain/ports/ISpacedFlashcardRepository';
import type { SpacedRepetitionScheduler } from '../../../domain/services/SpacedRepetitionScheduler';
import type { SpacedFlashcardEntity } from '../../../domain/entities/SpacedFlashcard';

export interface PracticeSpacedCardRequest {
  cardId: string;
  userId: string;
  quality: number; // 0 (blackout) to 5 (perfect recall)
}

export class PracticeSpacedCardUseCase {
  constructor(
    private readonly spacedRepo: ISpacedFlashcardRepository,
    private readonly scheduler: SpacedRepetitionScheduler
  ) {}

  async execute(req: PracticeSpacedCardRequest): Promise<SpacedFlashcardEntity> {
    const card = await this.spacedRepo.findById(req.cardId);
    if (!card) throw new Error(`Spaced flashcard '${req.cardId}' not found`);

    if (card.userId !== req.userId) {
      throw new Error('Access denied: Cannot practice another learner\'s flashcard');
    }

    const next = this.scheduler.calculateNextReview({
      currentRepetition: card.repetitionCount,
      currentIntervalDays: card.repetitionIntervalDays,
      currentEaseFactor: card.easeFactor,
      quality: req.quality,
    });

    await this.spacedRepo.updateRepetition(
      card.id,
      next.intervalDays,
      next.easeFactor,
      next.repetitionCount,
      next.nextDue
    );

    const reloaded = await this.spacedRepo.findById(card.id);
    if (!reloaded) throw new Error('Failed to reload updated flashcard');
    return reloaded;
  }
}
