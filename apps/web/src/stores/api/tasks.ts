import { fetchWithAuth } from './core';
import type { Task, Attempt, SocraticTutorResponse } from '@flashlearn/shared';

export interface SubmitTaskAttemptRequest {
  submission?: Record<string, any>;
  submissionData?: Record<string, any>;
  studentAnswerText?: string;
  sourceCitations?: { chunkId: string; quote: string }[];
}

export const taskApi = {
  listByCompetency: (competencyId: string): Promise<Task[]> =>
    fetchWithAuth(`/api/v1/tasks?competencyId=${competencyId}`),
  get: (id: string): Promise<Task> =>
    fetchWithAuth(`/api/v1/tasks/${id}`),
  create: (data: Partial<Task>): Promise<Task> =>
    fetchWithAuth('/api/v1/tasks', { method: 'POST', body: JSON.stringify(data) }),
  submitAttempt: (taskId: string, data: SubmitTaskAttemptRequest): Promise<any> => {
    const submission = data.submission || data.submissionData || {};
    return fetchWithAuth(`/api/v1/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submission, ...data }),
    });
  },
  getAttempts: (taskId: string): Promise<Attempt[]> =>
    fetchWithAuth(`/api/v1/tasks/${taskId}/attempts`),
  askSocraticHint: (taskId: string, question: string): Promise<SocraticTutorResponse> =>
    fetchWithAuth(`/api/v1/tasks/${taskId}/socratic-hint`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
