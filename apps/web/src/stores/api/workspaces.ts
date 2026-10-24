import { fetchWithAuth } from './core';
import type {
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  DomainBlueprint,
  ImportBlueprintResponse,
} from '@flashlearn/shared';

export const workspaceApi = {
  list: (scope: 'public' | 'mine' | 'all' = 'public'): Promise<Workspace[]> =>
    fetchWithAuth(`/api/v1/workspaces?scope=${scope}`),
  get: (idOrSlug: string): Promise<Workspace> =>
    fetchWithAuth(`/api/v1/workspaces/${idOrSlug}`),
  create: (data: CreateWorkspaceRequest): Promise<Workspace> =>
    fetchWithAuth('/api/v1/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateWorkspaceRequest): Promise<Workspace> =>
    fetchWithAuth(`/api/v1/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<{ success: boolean }> =>
    fetchWithAuth(`/api/v1/workspaces/${id}`, { method: 'DELETE' }),
  rollback: (id: string, versionNumber?: number): Promise<Workspace> =>
    fetchWithAuth(`/api/v1/workspaces/${id}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ versionNumber }),
    }),
  restore: (id: string): Promise<Workspace> =>
    fetchWithAuth(`/api/v1/workspaces/${id}/restore`, { method: 'POST' }),
  importBlueprint: (blueprint: DomainBlueprint): Promise<ImportBlueprintResponse> =>
    fetchWithAuth('/api/v1/workspaces/import-blueprint', {
      method: 'POST',
      body: JSON.stringify(blueprint),
    }),
};
