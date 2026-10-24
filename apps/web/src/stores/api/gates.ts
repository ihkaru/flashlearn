import { fetchWithAuth, API_URL } from './core';
import type { Gate, UserGateGrant, PublicGateVerificationResponse } from '@flashlearn/shared';

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
  verifyPassport: (grantId: string): Promise<PublicGateVerificationResponse> =>
    fetch(`${API_URL}/api/v1/gates/verify/${grantId}`).then(async (r) => {
      const data = await r.json();
      if (!data.success) throw new Error(data.error || 'Paspor tidak valid atau tidak ditemukan');
      return data.data;
    }),
};
