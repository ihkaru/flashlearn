import { fetchWithAuth } from './core';
import type { Domain, CreateDomainRequest, UpdateDomainRequest } from '@flashlearn/shared';

export const domainApi = {
  listByWorkspace: (workspaceId: string): Promise<{ workspaceId: string; total: number; domains: Domain[] }> =>
    fetchWithAuth(`/api/v1/domains/workspace/${workspaceId}`),
  get: (id: string): Promise<Domain> =>
    fetchWithAuth(`/api/v1/domains/${id}`),
  create: (data: CreateDomainRequest): Promise<Domain> =>
    fetchWithAuth('/api/v1/domains', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateDomainRequest): Promise<Domain> =>
    fetchWithAuth(`/api/v1/domains/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string): Promise<{ success: boolean; deletedId: string }> =>
    fetchWithAuth(`/api/v1/domains/${id}`, { method: 'DELETE' }),
};
