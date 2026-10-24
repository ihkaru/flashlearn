import { fetchWithAuth } from './core';

export const driftApi = {
  async auditWorkspace(workspaceId: string, threshold?: number): Promise<any> {
    if (!workspaceId) {
      throw new Error('workspaceId is required for drift audit');
    }
    const query = threshold !== undefined ? `?threshold=${threshold}` : '';
    return fetchWithAuth(`/api/v1/drift/audit/${workspaceId}${query}`);
  },

  async processBatch(): Promise<any> {
    return fetchWithAuth('/api/v1/drift/process-batch', {
      method: 'POST',
    });
  },

  async revalidateChallenge(data: {
    userId: string;
    competencyId: string;
    passed: boolean;
    score: number;
  }): Promise<any> {
    if (!data.userId || !data.competencyId || data.score === undefined) {
      throw new Error('userId, competencyId, and score are required for revalidation challenge');
    }
    return fetchWithAuth('/api/v1/drift/revalidate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
