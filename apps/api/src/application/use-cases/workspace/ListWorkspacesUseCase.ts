import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { Workspace, UserRole } from '@flashlearn/shared';

export interface ListWorkspacesInput {
  userId?: string | null;
  role?: UserRole;
  scope?: 'public' | 'mine' | 'all';
}

export class ListWorkspacesUseCase {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute(input: ListWorkspacesInput): Promise<Workspace[]> {
    if (input.role === 'superadmin' && input.scope === 'all') {
      const all = await this.workspaceRepository.listAll();
      return all.map((w) => w.toJSON());
    }

    if (input.scope === 'mine') {
      if (input.userId) {
        const myWorkspaces = await this.workspaceRepository.listByCreator(input.userId);
        return myWorkspaces.map((w) => w.toJSON());
      }
      return [];
    }

    // Default to public workspaces for guests or public queries
    const publicWorkspaces = await this.workspaceRepository.listPublic();
    return publicWorkspaces.map((w) => w.toJSON());
  }
}
