import type { ISpacedFlashcardRepository } from '../../../domain/ports/ISpacedFlashcardRepository';
import type { SpacedFlashcardEntity } from '../../../domain/entities/SpacedFlashcard';

export class GetDueSpacedCardsUseCase {
  constructor(private readonly spacedRepo: ISpacedFlashcardRepository) {}

  async execute(userId: string, limit = 20): Promise<SpacedFlashcardEntity[]> {
    return this.spacedRepo.findDueCards(userId, limit);
  }
}
