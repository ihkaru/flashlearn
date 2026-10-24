export type BlindReviewRole = 'primary' | 'secondary' | 'arbiter';
export type BlindReviewStatus = 'assigned' | 'submitted' | 'disputed' | 'arbitrated';
export type ConsensusStatus =
  | 'in_review'
  | 'consensus_approved'
  | 'arbitration_required'
  | 'arbitration_resolved';

export interface InterRaterReliabilityResult {
  observedAgreement: number;
  gwetAC1: number;
  gwetAC2: number;
  cohenKappa: number;
  scoreDelta: number;
  hasConsensus: boolean;
  requiresArbiter: boolean;
  finalScore?: number;
  arbitrationDetails?: {
    arbiterScore: number;
    rater1Score: number;
    rater2Score: number;
    resolvedMethod: string;
  };
}

export interface TaskAttemptReviewDto {
  id: string;
  attemptId: string;
  reviewerId: string;
  blindToken: string;
  role: BlindReviewRole;
  status: BlindReviewStatus;
  rubricScores?: Record<string, number>;
  totalScore?: number;
  notes?: string;
  submittedAt?: Date | string;
  createdAt: Date | string;
}

export interface SanitizedBlindAttemptDto {
  blindToken: string;
  attemptId: string;
  taskId: string;
  taskTitle: string;
  taskScenario: string;
  taskType: string;
  submission: Record<string, any>;
  rubricCriteria: Array<{
    id: string;
    title: string;
    weight: number;
    description: string;
    levels?: Array<{ score: number; label: string; description?: string }>;
  }>;
  passingScore: number;
}

export interface AssignBlindReviewersRequest {
  attemptId: string;
  primaryReviewerId: string;
  secondaryReviewerId: string;
}

export interface SubmitBlindReviewRequest {
  blindToken: string;
  rubricScores: Record<string, number>;
  totalScore?: number;
  notes?: string;
}

export interface ArbitrateReviewRequest {
  attemptId: string;
  arbiterId: string;
  rubricScores: Record<string, number>;
  totalScore: number;
  notes?: string;
}
