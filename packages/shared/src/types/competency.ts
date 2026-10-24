export type OracleClass = 'A' | 'B' | 'C';
export type RiskLevel = 'low' | 'medium' | 'high';
export type MasteryStatus = 'locked' | 'ready' | 'in_progress' | 'mastered' | 'stale';

export interface CompetencyNode {
  id: string;
  workspaceId: string;
  sourceId?: string | null;
  code: string;
  title: string;
  description: string;
  oracleClass: OracleClass;
  riskLevel: RiskLevel;
  isExpertApproved: boolean;
  approvedBy?: string | null;
  prerequisiteIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyEdge {
  competencyId: string;
  prerequisiteId: string;
}

export interface MasteryRecord {
  id: string;
  userId: string;
  competencyId: string;
  status: MasteryStatus;
  verifiedAttemptId?: string | null;
  masteredAt?: string | null;
  retestDueAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerCompetencyStatus extends CompetencyNode {
  userStatus: MasteryStatus;
  canAttempt: boolean;
  blockingPrerequisites: Array<{ id: string; code: string; title: string }>;
  driftStatus?: string | null;
  cachedRetrievability?: number | null;
  stability?: number | null;
  lastDemonstratedAt?: string | null;
}

export interface CompetencyGraphResponse {
  workspaceId: string;
  totalNodes: number;
  nodes: LearnerCompetencyStatus[];
  edges: CompetencyEdge[];
  summary: {
    locked: number;
    ready: number;
    inProgress: number;
    mastered: number;
    stale: number;
  };
}

export interface CreateCompetencyDto {
  workspaceId: string;
  sourceId?: string | null;
  code: string;
  title: string;
  description: string;
  oracleClass: OracleClass;
  riskLevel: RiskLevel;
  prerequisiteIds?: string[];
}

export interface LinkPrerequisiteDto {
  competencyId: string;
  prerequisiteId: string;
}
