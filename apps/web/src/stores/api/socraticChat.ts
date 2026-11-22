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
  chat: (data: {
    message: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
    context?: {
      phase?: string;
      workspaceName?: string;
      taskTitle?: string;
      scenario?: string;
      competencyCode?: string;
      competencyTitle?: string;
    };
  }): Promise<{ reply: string; model: string }> =>
    fetchWithAuth('/api/v1/socratic/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
