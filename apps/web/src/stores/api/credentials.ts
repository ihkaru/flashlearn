import { fetchWithAuth } from './core';
import type { W3CVerifiableCredential20, VerifyVcResult } from '@flashlearn/shared';

export const credentialApi = {
  async issue(gateId: string, userId: string): Promise<{ success: boolean; credential: W3CVerifiableCredential20 }> {
    if (!gateId || !userId) {
      throw new Error('gateId and userId are required to issue a verifiable credential');
    }
    return fetchWithAuth('/api/v1/credentials/issue', {
      method: 'POST',
      body: JSON.stringify({ gateId, userId }),
    });
  },

  async verify(credential: any, publicKeyPem?: string): Promise<VerifyVcResult> {
    if (!credential) {
      throw new Error('Credential object is required for verification');
    }
    return fetchWithAuth('/api/v1/credentials/verify', {
      method: 'POST',
      body: JSON.stringify({ credential, publicKeyPem }),
    });
  },

  async getById(id: string): Promise<any> {
    if (!id) {
      throw new Error('Credential ID is required');
    }
    return fetchWithAuth(`/api/v1/credentials/${encodeURIComponent(id)}`);
  },
};
