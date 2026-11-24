import { fetchWithAuth, API_URL } from './core';
import { auth } from '../auth.svelte';
import type {
  Content,
  ContentArtifact,
  ContentArtifactKind,
  CreateContentRequest,
  UpdateContentRequest,
  QuizSubmissionRequest,
  QuizResultResponse,
  FlashcardItem,
  LearnerContentProgress,
  SaveLearnerProgressRequest,
} from '@flashlearn/shared';

export interface ResumableSessionSummary extends LearnerContentProgress {
  contentTitle: string;
  contentType: string;
  workspaceId: string;
  workspaceName: string;
}

export interface CheckQuestionResponse {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

export type QuizSubmissionPayload = QuizSubmissionRequest & {
  sessionMode?: 'full' | 'subset';
};

export const contentApi = {
  listByWorkspace: (workspaceId: string): Promise<Content[]> =>
    fetchWithAuth(`/api/v1/contents/workspace/${workspaceId}`),
  get: (id: string): Promise<Content> =>
    fetchWithAuth(`/api/v1/contents/${id}`),
  create: (data: CreateContentRequest): Promise<Content> =>
    fetchWithAuth('/api/v1/contents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateContentRequest): Promise<Content> =>
    fetchWithAuth(`/api/v1/contents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<{ success: boolean }> =>
    fetchWithAuth(`/api/v1/contents/${id}`, { method: 'DELETE' }),
  rollback: (id: string, versionNumber?: number): Promise<Content> =>
    fetchWithAuth(`/api/v1/contents/${id}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ versionNumber }),
    }),
  restore: (id: string): Promise<Content> =>
    fetchWithAuth(`/api/v1/contents/${id}/restore`, { method: 'POST' }),
  getVersions: (id: string): Promise<any[]> =>
    fetchWithAuth(`/api/v1/contents/${id}/versions`),
  getSubmissions: (id: string): Promise<any[]> =>
    fetchWithAuth(`/api/v1/contents/${id}/submissions`),
  async downloadExport(id: string, format: 'xlsx' | 'csv' = 'xlsx') {
    const headers = new Headers();
    if (auth.token) {
      headers.set('Authorization', `Bearer ${auth.token}`);
    }
    const res = await fetch(`${API_URL}/api/v1/contents/${id}/export?format=${format}`, {
      headers,
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashlearn_submissions_${id}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  checkGuestName: (id: string, name: string): Promise<{ isTaken: boolean; suggestedName: string }> =>
    fetchWithAuth(`/api/v1/contents/${id}/check-name`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  submitQuiz: (id: string, submission: QuizSubmissionPayload): Promise<QuizResultResponse> =>
    fetchWithAuth(`/api/v1/contents/${id}/submit-quiz`, {
      method: 'POST',
      body: JSON.stringify(submission),
    }),
  checkQuestion: (
    contentId: string,
    questionId: string,
    selectedOptionId: string
  ): Promise<CheckQuestionResponse> =>
    fetchWithAuth(`/api/v1/contents/${contentId}/check-question`, {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedOptionId }),
    }),
  getFlashcards: (id: string): Promise<FlashcardItem[]> =>
    fetchWithAuth(`/api/v1/contents/${id}/flashcards`),
  getArtifact: (id: string, kind: ContentArtifactKind): Promise<ContentArtifact> =>
    fetchWithAuth(`/api/v1/contents/${id}/artifacts/${kind}`),
  getProgress: (id: string): Promise<LearnerContentProgress | { contentId: string; notStarted: true }> =>
    fetchWithAuth(`/api/v1/contents/${id}/progress`),
  saveProgress: (id: string, payload: SaveLearnerProgressRequest): Promise<LearnerContentProgress> =>
    fetchWithAuth(`/api/v1/contents/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  listWorkspaceProgress: (workspaceId: string): Promise<LearnerContentProgress[]> =>
    fetchWithAuth(`/api/v1/contents/workspace/${workspaceId}/progress`),
  listRecentResumable: (limit = 6): Promise<ResumableSessionSummary[]> =>
    fetchWithAuth(`/api/v1/contents/resume/recent?limit=${limit}`),
};
