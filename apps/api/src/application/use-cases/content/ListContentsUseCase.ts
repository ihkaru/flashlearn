import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { IInteractiveRepository } from '../../../domain/ports/IInteractiveRepository';
import type { Content, UserRole } from '@flashlearn/shared';

export interface ListContentsInput {
  workspaceId: string;
  userId?: string | null;
  role?: UserRole;
}

export class ListContentsUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly interactiveRepository?: IInteractiveRepository
  ) {}

  async execute(input: ListContentsInput): Promise<Content[]> {
    const isSuperadmin = input.role === 'superadmin';
    const workspace = await this.workspaceRepository.findById(input.workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!workspace.canBeAccessedBy(input.userId, isSuperadmin)) {
      throw new Error('Forbidden: You do not have permission to view this workspace contents');
    }

    const isOwner = workspace.canBeModifiedBy(input.userId || '', isSuperadmin);
    const contents = await this.contentRepository.listByWorkspace(
      input.workspaceId,
      !isOwner,
      isOwner
    );

    const kindsMap = this.interactiveRepository
      ? await this.interactiveRepository.listArtifactKindsByContentIds(contents.map((c) => c.id))
      : null;

    return contents.map((c) => {
      const dto = c.toJSON(isOwner);
      if (!kindsMap) return dto;
      const kinds = kindsMap.get(c.id) || [];
      return {
        ...dto,
        hasSlideDeck: kinds.includes('slide_deck_html'),
        hasAnchoringSim: kinds.includes('anchoring_sim_html'),
      };
    });
  }
}
