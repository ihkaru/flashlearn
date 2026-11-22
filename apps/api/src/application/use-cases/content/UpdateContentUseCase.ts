import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import {
  validateInteractiveModulePayload,
  type Content,
  type UpdateContentRequest,
  type UserRole,
} from '@flashlearn/shared';

export class UpdateContentUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(
    contentId: string,
    currentUserId: string,
    role: UserRole,
    input: UpdateContentRequest
  ): Promise<Content> {
    const isSuperadmin = role === 'superadmin';
    const content = await this.contentRepository.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    const workspace = await this.workspaceRepository.findById(content.workspaceId);
    if (!workspace) {
      throw new Error('Associated workspace not found');
    }

    if (!workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only edit contents in workspaces you created');
    }

    const effectiveType = input.type ?? content.type;
    if (effectiveType === 'interactive_module' && input.interactivePayload !== undefined) {
      const report = validateInteractiveModulePayload(input.interactivePayload);
      if (!report.valid) {
        const msg = report.issues
          .filter((i) => i.severity === 'error')
          .map((i) => `${i.code}: ${i.message}`)
          .join('; ');
        throw new Error(`Invalid interactive_module payload: ${msg}`);
      }
    }

    const updated = await this.contentRepository.update(contentId, input);
    if (!updated) {
      throw new Error('Failed to update content');
    }

    const currentVersion = await this.contentRepository.getLatestVersionNumber(contentId);
    await this.contentRepository.createVersion(
      contentId,
      currentVersion + 1,
      'update',
      updated.toJSON(true),
      currentUserId
    );

    return updated.toJSON(true);
  }
}
