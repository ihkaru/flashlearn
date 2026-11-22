import type { ContentArtifact, ContentArtifactKind, UserRole } from '@flashlearn/shared';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { IInteractiveRepository } from '../../../domain/ports/IInteractiveRepository';

export class GetContentArtifactUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly interactiveRepository: IInteractiveRepository
  ) {}

  async execute(
    contentId: string,
    kind: ContentArtifactKind,
    userId?: string | null,
    role?: UserRole
  ): Promise<ContentArtifact | null> {
    const isSuperadmin = role === 'superadmin';
    const content = await this.contentRepository.findById(contentId);
    if (!content) return null;

    const workspace = await this.workspaceRepository.findById(content.workspaceId);
    if (!workspace) return null;

    if (!workspace.canBeAccessedBy(userId, isSuperadmin)) {
      throw new Error('Forbidden: Access denied to this content artifact');
    }

    const isOwner = workspace.canBeModifiedBy(userId || '', isSuperadmin);
    if (!content.isPublished && !isOwner) {
      throw new Error('This content is not published yet');
    }

    return await this.interactiveRepository.getArtifact(contentId, kind);
  }
}
