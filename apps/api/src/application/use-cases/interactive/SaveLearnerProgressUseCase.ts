import type { LearnerContentProgress, SaveLearnerProgressRequest } from '@flashlearn/shared';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IInteractiveRepository, LearnerIdentity } from '../../../domain/ports/IInteractiveRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';

export class SaveLearnerProgressUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly interactiveRepository: IInteractiveRepository,
    private readonly masteryRepository?: IMasteryRepository
  ) {}

  async execute(
    contentId: string,
    identity: LearnerIdentity,
    input: SaveLearnerProgressRequest
  ): Promise<LearnerContentProgress> {
    if (!identity.userId && !identity.sessionKey) {
      throw new Error('Either authenticated user or sessionKey is required to save learning progress');
    }

    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    const saved = await this.interactiveRepository.saveProgress(contentId, identity, input);

    // If linked to a Competency Node and authenticated learner completed the module with mastery,
    // gracefully mark unaided sandbox readiness without blocking progress save.
    if (
      this.masteryRepository &&
      identity.userId &&
      content.competencyId &&
      saved.isCompleted &&
      saved.thetaMastery >= 0.65
    ) {
      try {
        await this.masteryRepository.markUnaidedSandboxPassed(identity.userId, content.competencyId);
      } catch {
        // Non-fatal: learner progress is persisted regardless of competency enrollment state
      }
    }

    return saved;
  }
}
