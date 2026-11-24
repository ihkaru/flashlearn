import type { LearnerContentProgress, SaveLearnerProgressRequest, UserRole } from '@flashlearn/shared';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IInteractiveRepository, LearnerIdentity } from '../../../domain/ports/IInteractiveRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';

export class SaveLearnerProgressUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly interactiveRepository: IInteractiveRepository,
    private readonly masteryRepository?: IMasteryRepository,
    private readonly workspaceRepository?: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    identity: LearnerIdentity,
    input: SaveLearnerProgressRequest,
    role?: UserRole
  ): Promise<LearnerContentProgress> {
    if (!identity.userId && !identity.sessionKey) {
      throw new Error('Either authenticated user or sessionKey is required to save learning progress');
    }

    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    if (this.workspaceRepository) {
      const workspace = await this.workspaceRepository.findById(content.workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      const isOwnerOrAdmin =
        role === 'superadmin' || (!!identity.userId && workspace.creatorId === identity.userId);
      if (!workspace.isPublic && !isOwnerOrAdmin) {
        throw new Error('Forbidden: Private workspace');
      }
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
