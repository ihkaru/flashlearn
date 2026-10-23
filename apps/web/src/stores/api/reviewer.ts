import { fetchWithAuth } from './core';
import type { Attempt, Task, CompetencyNode } from '@flashlearn/shared';

export interface PendingReviewItem {
  attempt: Attempt;
  task: Task;
  competency: CompetencyNode;
  studentName: string;
}

export interface EvaluateReviewRequest {
  attemptId: string;
  passed: boolean;
  rubricScores: {
    criterionId: string;
    scoreAwarded: number;
    maxScore: number;
    feedback: string;
  }[];
  expertNotes: string;
}

export const reviewerApi = {
  getPending: (): Promise<{ success: boolean; data: PendingReviewItem[] }> =>
    fetchWithAuth('/api/v1/reviewer/pending'),
  evaluate: (data: EvaluateReviewRequest): Promise<{ success: boolean; data: Attempt }> =>
    fetchWithAuth('/api/v1/reviewer/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
