import type { OracleClass } from './competency';

export type GateLevel = 0 | 1 | 2 | 3;
export type GateGrantStatus = 'active' | 'provisional' | 'revoked';

export interface Gate {
  id: string;
  workspaceId: string;
  domainId?: string | null;
  level: GateLevel;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface GateRequirement {
  id: string;
  gateId: string;
  competencyId: string;
  minimumScore: number;
  requiresHumanApproval: boolean;
  createdAt: string;
}

export interface UserGateGrant {
  id: string;
  userId: string;
  gateId: string;
  status: GateGrantStatus;
  grantedAt: string;
  grantedBy: string; // 'system' or expert user ID
  revokedAt?: string | null;
  revocationReason?: string | null;
  evidenceSnapshot: {
    gateLevel: GateLevel;
    verifiedCompetencyIds: string[];
    timestamp: string;
    evaluatorNotes?: string;
  };
}

export interface ClassCReviewDto {
  attemptId: string;
  passed: boolean;
  rubricScores: Array<{
    criterionId: string;
    scoreAwarded: number;
    maxScore: number;
    feedback: string;
  }>;
  expertNotes: string;
}

export interface EvaluateGateEligibilityResult {
  gateId: string;
  gateLevel: GateLevel;
  eligible: boolean;
  missingCompetencies: Array<{
    competencyId: string;
    code: string;
    title: string;
    oracleClass: OracleClass;
    requiresHumanApproval: boolean;
  }>;
  unmetScores: Array<{
    competencyId: string;
    requiredScore: number;
    achievedScore: number;
  }>;
}

export interface PublicGateVerificationResponse {
  grantId: string;
  holderName: string;
  workspaceName: string;
  gateLevel: GateLevel;
  gateTitle: string;
  gateDescription: string;
  status: GateGrantStatus;
  grantedAt: string;
  grantedBy: string;
  revokedAt?: string | null;
  revocationReason?: string | null;
  evidenceSnapshot: {
    gateLevel: GateLevel;
    verifiedCompetencyIds: string[];
    timestamp: string;
    evaluatorNotes?: string;
  };
  isCurrentlyValid: boolean;
  verificationUrl: string;
}
