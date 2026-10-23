import type { OracleClass } from './competency';

export type TaskType = 'calculation' | 'case_study' | 'document_draft' | 'checklist';

export interface RubricCriterion {
  id: string;
  title: string;
  weight: number;
  description: string;
}

export interface NegativeAnchor {
  id: string;
  trapDescription: string;
  penaltyPoints: number;
  fatal: boolean;
}

export interface OracleDataClassA {
  expectedFormulas?: Record<string, { expectedValue: number; tolerance?: number }>;
  requiredChecklistItems?: string[];
}

export interface OracleDataClassB {
  goldSolution: string;
  negativeAnchors: NegativeAnchor[];
  keyTakeaways: string[];
}

export type OracleData = OracleDataClassA & Partial<OracleDataClassB> & Record<string, any>;

export interface Task {
  id: string;
  competencyId: string;
  title: string;
  scenario: string;
  taskType: TaskType;
  oracleData: OracleData;
  rubricCriteria: RubricCriterion[];
  passingScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptDetail {
  criterionId: string;
  criterionTitle: string;
  passed: boolean;
  scoreAwarded: number;
  maxScore: number;
  reason: string;
}

export interface Attempt {
  id: string;
  taskId: string;
  userId: string;
  submission: Record<string, any>;
  score: number;
  feedback: string;
  assessedBy: string;
  oracleClassUsed: OracleClass;
  passed: boolean;
  details?: {
    breakdown?: AttemptDetail[];
    detectedTraps?: string[];
    calculationDiscrepancies?: Array<{ field: string; expected: number; received: number }>;
  };
  createdAt: string;
}

export interface CreateTaskDto {
  competencyId: string;
  title: string;
  scenario: string;
  taskType: TaskType;
  oracleData: OracleData;
  rubricCriteria: RubricCriterion[];
  passingScore?: number;
}

export interface EvaluateAttemptRequest {
  taskId: string;
  submission: Record<string, any>;
}

export interface PostTaskFlashcard {
  front: string;
  back: string;
  category: string;
  remedyHint?: string;
}

export interface EvaluateAttemptResponse {
  attempt: Attempt;
  passed: boolean;
  unlockedCompetencyId?: string | null;
  generatedFlashcards: PostTaskFlashcard[];
}
