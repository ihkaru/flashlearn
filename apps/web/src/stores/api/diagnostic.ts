import { fetchWithAuth } from './core';

export const diagnosticApi = {
  async start(workspaceId: string): Promise<any> {
    if (!workspaceId) {
      throw new Error('workspaceId is required to start diagnostic placement');
    }
    return fetchWithAuth('/api/v1/diagnostic/start', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    });
  },

  async getNextProbe(sessionId: string): Promise<any> {
    if (!sessionId) {
      throw new Error('sessionId is required to fetch next probe');
    }
    return fetchWithAuth(`/api/v1/diagnostic/session/${sessionId}/next`);
  },

  async submitProbe(sessionId: string, submission: Record<string, any>): Promise<any> {
    if (!sessionId || !submission) {
      throw new Error('sessionId and submission payload are required');
    }
    return fetchWithAuth(`/api/v1/diagnostic/session/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submission }),
    });
  },
};
