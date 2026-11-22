import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { IInteractiveRepository } from '../../../domain/ports/IInteractiveRepository';
import type { Content, UserRole } from '@flashlearn/shared';

export class GetContentByIdUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly interactiveRepository?: IInteractiveRepository
  ) {}

  async execute(
    contentId: string,
    userId?: string | null,
    role?: UserRole
  ): Promise<Content | null> {
    const isSuperadmin = role === 'superadmin';
    const content = await this.contentRepository.findById(contentId);

    if (!content) return null;

    const workspace = await this.workspaceRepository.findById(content.workspaceId);
    if (!workspace) return null;

    if (!workspace.canBeAccessedBy(userId, isSuperadmin)) {
      throw new Error('Forbidden: Access denied to this content');
    }

    const isOwner = workspace.canBeModifiedBy(userId || '', isSuperadmin);

    if (!content.isPublished && !isOwner) {
      throw new Error('This content is not published yet');
    }

    const dto = content.toJSON(isOwner);
    if (this.interactiveRepository) {
      const kindsMap = await this.interactiveRepository.listArtifactKindsByContentIds([content.id]);
      const kinds = kindsMap.get(content.id) || [];
      return {
        ...dto,
        hasSlideDeck: kinds.includes('slide_deck_html'),
        hasAnchoringSim: kinds.includes('anchoring_sim_html'),
      };
    }

    return dto;
  }
}
