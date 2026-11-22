import type { ContentArtifactKind, UserRole } from '@flashlearn/shared';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { IInteractiveRepository } from '../../../domain/ports/IInteractiveRepository';

export class DeleteContentArtifactUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly interactiveRepository: IInteractiveRepository
  ) {}

  async execute(
    userId: string,
    role: UserRole,
    contentId: string,
    kind: ContentArtifactKind
  ): Promise<{ deleted: boolean; contentId: string; kind: ContentArtifactKind }> {
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error(`Content '${contentId}' not found`);
    }

    const workspace = await this.workspaceRepository.findById(content.workspaceId);
    if (!workspace) {
      throw new Error('Parent workspace not found');
    }

    if (role !== 'superadmin' && workspace.creatorId !== userId) {
      throw new Error('Forbidden: You do not own this workspace to delete artifacts');
    }

    const deleted = await this.interactiveRepository.deleteArtifact(contentId, kind);
    return { deleted, contentId, kind };
  }
}
