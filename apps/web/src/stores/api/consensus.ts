import { fetchWithAuth } from './core';

export const consensusApi = {
  async getBlindReview(token: string): Promise<any> {
    if (!token) {
      throw new Error('Blind token is required to retrieve review');
    }
    return fetchWithAuth(`/api/v1/consensus/blind-review/${token}`);
  },

  async submitBlindReview(token: string, rubricScores: Record<string, number>, notes?: string): Promise<any> {
    if (!token || !rubricScores) {
      throw new Error('Blind token and rubric scores are required');
    }
    return fetchWithAuth('/api/v1/consensus/submit-review', {
      method: 'POST',
      body: JSON.stringify({ blindToken: token, rubricScores, notes }),
    });
  },

  async arbitrate(data: { attemptId: string; score: number; notes: string }): Promise<any> {
    if (!data.attemptId || data.score === undefined || !data.notes) {
      throw new Error('attemptId, score, and notes are required for arbitration');
    }
    return fetchWithAuth('/api/v1/consensus/arbitrate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
