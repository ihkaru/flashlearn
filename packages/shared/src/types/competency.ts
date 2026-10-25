export type OracleClass = 'A' | 'B' | 'C';
export type RiskLevel = 'low' | 'medium' | 'high';
export type MasteryStatus = 'locked' | 'ready' | 'in_progress' | 'mastered' | 'stale';

export type CognitiveArchetype =
  | 'algorithmic_quant'
  | 'artifact_audit'
  | 'ill_structured_case'
  | 'rapid_fluency';

export interface CompetencyNode {
  id: string;
  workspaceId: string;
  domainId?: string | null;
  sourceId?: string | null;
  code: string;
  title: string;
  description: string;
  oracleClass: OracleClass;
  cognitiveArchetype?: CognitiveArchetype;
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
  hasPassedUnaidedSandbox?: boolean;
  passedVariantCodes?: string[];
  masteredAt?: string | null;
  retestDueAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerCompetencyStatus extends CompetencyNode {
  userStatus: MasteryStatus;
  canAttempt: boolean;
  hasPassedUnaidedSandbox?: boolean;
  passedVariantCodes?: string[];
  blockingPrerequisites: Array<{ id: string; code: string; title: string }>;
  driftStatus?: string | null;
  cachedRetrievability?: number | null;
  stability?: number | null;
  lastDemonstratedAt?: string | null;
}

export interface CompetencyGraphResponse {
  workspaceId: string;
  domainId?: string | null;
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
  domainId?: string | null;
  sourceId?: string | null;
  code: string;
  title: string;
  description: string;
  oracleClass: OracleClass;
  cognitiveArchetype?: CognitiveArchetype;
  riskLevel: RiskLevel;
  prerequisiteIds?: string[];
}

export interface LinkPrerequisiteDto {
  competencyId: string;
  prerequisiteId: string;
}

export interface CausalProbe {
  id: string;
  type: 'causal_prediction' | 'analogical_comparison' | 'micro_debugging';
  prompt: string;
  predictionOptions?: string[];
  causalRationale: string;
  scenarioA?: string;
  scenarioB?: string;
  faultySnippet?: string;
  faultyLine?: number;
}

export interface CompetencyLearningBundle {
  competency: CompetencyNode;
  readingMaterials: Array<{
    id: string;
    title: string;
    summary?: string | null;
    body?: string | null;
    readingTimeMinutes?: number | null;
    type: 'materi' | 'quiz' | 'combined';
  }>;
  causalProbes?: CausalProbe[];
  workedExamples?: Array<{
    id: string;
    title: string;
    scenario: string;
    solutionSteps: Array<{ step: string; explanation: string; commonTrap?: string }>;
    finalOutcome: string;
  }>;
  jobAid?: {
    checklist?: string[];
    formulas?: Record<string, string>;
    statutoryCitations?: string[];
  };
  microSandbox?: {
    title: string;
    scenario: string;
    scaffoldingLevel?: 'high' | 'medium' | 'low' | 'unaided';
    checkpoints: Array<{ label: string; hint: string }>;
  };
}
