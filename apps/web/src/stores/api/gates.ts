import { fetchWithAuth } from './core';
import type { Gate, UserGateGrant } from '@flashlearn/shared';

export const gateApi = {
  listByWorkspace: (workspaceId: string): Promise<{ success: boolean; data: Gate[] }> =>
    fetchWithAuth(`/api/v1/gates/workspace/${workspaceId}`),
  getPassports: (workspaceId?: string): Promise<{ success: boolean; data: UserGateGrant[] }> =>
    fetchWithAuth(`/api/v1/gates/passports${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  evaluate: (gateId: string): Promise<{ success: boolean; grant: UserGateGrant }> =>
    fetchWithAuth('/api/v1/gates/evaluate', {
      method: 'POST',
      body: JSON.stringify({ gateId }),
    }),
  create: (data: Partial<Gate>): Promise<{ success: boolean; data: Gate }> =>
    fetchWithAuth('/api/v1/gates', { method: 'POST', body: JSON.stringify(data) }),
};
