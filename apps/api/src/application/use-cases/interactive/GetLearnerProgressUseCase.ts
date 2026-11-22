import type { LearnerContentProgress } from '@flashlearn/shared';
import type {
  IInteractiveRepository,
  LearnerIdentity,
  RecentResumableSession,
} from '../../../domain/ports/IInteractiveRepository';

export class GetLearnerProgressUseCase {
  constructor(private readonly interactiveRepository: IInteractiveRepository) {}

  async getForContent(
    contentId: string,
    identity: LearnerIdentity
  ): Promise<LearnerContentProgress | null> {
    if (!identity.userId && !identity.sessionKey) return null;
    return await this.interactiveRepository.getProgress(contentId, identity);
  }

  async listForWorkspace(
    workspaceId: string,
    identity: LearnerIdentity
  ): Promise<LearnerContentProgress[]> {
    if (!identity.userId && !identity.sessionKey) return [];
    return await this.interactiveRepository.listProgressByWorkspace(workspaceId, identity);
  }

  async listRecent(identity: LearnerIdentity, limit = 6): Promise<RecentResumableSession[]> {
    if (!identity.userId && !identity.sessionKey) return [];
    return await this.interactiveRepository.listRecentProgress(identity, limit);
  }
}
