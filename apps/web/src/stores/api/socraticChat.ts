import { fetchWithAuth } from './core';
import type {
  SocraticChatSession,
  AppendSocraticTurnRequest,
  AppendSocraticTurnResponse,
} from '@flashlearn/shared';

export const socraticChatApi = {
  getSession: (id: string): Promise<SocraticChatSession> =>
    fetchWithAuth(`/api/v1/socratic/session/${id}`),
  getActiveSession: (userId: string, taskId?: string): Promise<SocraticChatSession | { active: false }> =>
    fetchWithAuth(`/api/v1/socratic/active?userId=${encodeURIComponent(userId)}${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ''}`),
  appendTurn: (data: AppendSocraticTurnRequest): Promise<AppendSocraticTurnResponse> =>
    fetchWithAuth('/api/v1/socratic/turn', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
