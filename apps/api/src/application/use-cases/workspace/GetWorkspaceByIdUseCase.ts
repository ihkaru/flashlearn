import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Workspace, UserRole } from '@flashlearn/shared';

export class GetWorkspaceByIdUseCase {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute(
    idOrSlug: string,
    currentUserId?: string | null,
    role?: UserRole
  ): Promise<Workspace | null> {
    const isSuperadmin = role === 'superadmin';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let entity = isUUID ? await this.workspaceRepository.findById(idOrSlug) : null;
    if (!entity) {
      entity = await this.workspaceRepository.findBySlug(idOrSlug);
    }

    if (!entity) return null;

    if (!entity.canBeAccessedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You do not have permission to view this workspace');
    }

    return entity.toJSON();
  }
}
