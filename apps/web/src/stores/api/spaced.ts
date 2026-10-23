import { fetchWithAuth } from './core';
import type { SpacedFlashcard } from '@flashlearn/shared';

export const spacedApi = {
  getDue: (): Promise<{ success: boolean; data: SpacedFlashcard[] }> =>
    fetchWithAuth('/api/v1/spaced/due'),
  practice: (cardId: string, quality: number): Promise<{ success: boolean; data: SpacedFlashcard }> =>
    fetchWithAuth(`/api/v1/spaced/${cardId}/practice`, {
      method: 'POST',
      body: JSON.stringify({ quality }),
    }),
};
