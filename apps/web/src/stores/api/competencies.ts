import { fetchWithAuth } from './core';
import type { CompetencyNode, CompetencyEdge, CompetencyLearningBundle } from '@flashlearn/shared';

export interface CompetencyGraphResponse {
  nodes: (CompetencyNode & {
    userStatus: 'locked' | 'ready' | 'in_progress' | 'mastered' | 'stale';
    masteryScore: number | null;
  })[];
  edges: CompetencyEdge[];
}

export const competencyApi = {
  getGraph: (workspaceId: string, domainId?: string): Promise<CompetencyGraphResponse> =>
    fetchWithAuth(`/api/v1/competencies/graph?workspaceId=${encodeURIComponent(workspaceId)}${domainId ? `&domainId=${encodeURIComponent(domainId)}` : ''}`),
  get: (id: string): Promise<CompetencyNode> =>
    fetchWithAuth(`/api/v1/competencies/${id}`),
  getLearningBundle: (id: string): Promise<CompetencyLearningBundle> =>
    fetchWithAuth(`/api/v1/competencies/${id}/learning-bundle`),
  create: (data: Partial<CompetencyNode>): Promise<CompetencyNode> =>
    fetchWithAuth('/api/v1/competencies', { method: 'POST', body: JSON.stringify(data) }),
  createPrerequisite: (data: { competencyId: string; prerequisiteId: string }): Promise<CompetencyEdge> =>
    fetchWithAuth('/api/v1/competencies/link-prerequisite', { method: 'POST', body: JSON.stringify(data) }),
  verifyExpert: (id: string, notes?: string): Promise<{ success: boolean; data: CompetencyNode }> =>
    fetchWithAuth(`/api/v1/competencies/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  markUnaidedSandboxPassed: (
    id: string
  ): Promise<{ success: boolean; competencyId: string; hasPassedUnaidedSandbox: boolean }> =>
    fetchWithAuth(`/api/v1/competencies/${id}/unaided-sandbox-pass`, {
      method: 'POST',
    }),
};
