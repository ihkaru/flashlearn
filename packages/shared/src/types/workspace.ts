export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  icon: string | null;
  isPublic: boolean;
  creatorId: string;
  creatorName?: string;
  creatorEmail?: string;
  contentCount?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceVersion {
  id: string;
  workspaceId: string;
  versionNumber: number;
  action: 'create' | 'update' | 'rollback';
  snapshot: Record<string, any>;
  changedBy: string | null;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface RollbackRequest {
  versionNumber?: number;
}

export interface DomainBlueprint {
  version: string;
  workspace: {
    name: string;
    slug?: string;
    description: string;
    icon?: string;
  };
  sources: Array<{
    code: string;
    title: string;
    version: string;
    owner: string;
    effectiveDate: string;
    chunks: Array<{
      locationTag: string;
      content: string;
    }>;
  }>;
  competencies: Array<{
    code: string;
    sourceCode?: string;
    title: string;
    description: string;
    oracleClass: 'A' | 'B' | 'C';
    riskLevel: 'low' | 'medium' | 'high';
    prerequisites?: string[];
  }>;
  gates: Array<{
    level: 0 | 1 | 2 | 3;
    title: string;
    description: string;
    requirements: Array<{
      competencyCode: string;
      minimumScore: number;
      requiresHumanApproval?: boolean;
    }>;
  }>;
  tasks?: Array<{
    competencyCode: string;
    title: string;
    scenario: string;
    taskType: 'calculation' | 'case_study' | 'document_draft' | 'checklist';
    oracleData: Record<string, any>;
    rubricCriteria: Array<{
      id: string;
      title: string;
      weight: number;
      description: string;
    }>;
    passingScore?: number;
  }>;
}

export interface ImportBlueprintResponse {
  workspaceId: string;
  workspaceSlug: string;
  sourcesCreated: number;
  competenciesCreated: number;
  edgesLinked: number;
  gatesCreated: number;
  tasksCreated: number;
}

export interface DomainDiagnosticReport {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isPublic: boolean;
    createdAt: string;
  };
  statistics: {
    sourcesCount: number;
    activeSourcesCount: number;
    chunksCount: number;
    competenciesCount: number;
    competenciesByClass: { A: number; B: number; C: number };
    competenciesByRisk: { low: number; medium: number; high: number };
    approvedCompetenciesCount: number;
    edgesCount: number;
    tasksCount: number;
    tasksByType: Record<string, number>;
    gatesCount: number;
    gateLevelsPresent: number[];
    contentsCount: number;
    contentsByType: Record<string, number>;
  };
  dagIntegrity: {
    isValid: boolean;
    cycleDetected: boolean;
    cyclePath?: string[];
    rootNodesCount: number;
    terminalNodesCount: number;
  };
  gaps: {
    orphanCompetenciesWithoutTasks: Array<{ id: string; code: string; title: string }>;
    unapprovedCompetencies: Array<{ id: string; code: string; title: string }>;
    competenciesWithoutSource: Array<{ id: string; code: string; title: string }>;
    missingGateLevels: number[];
    gatesWithoutRequirements: Array<{ id: string; level: number; title: string }>;
    sourcesWithoutChunks: Array<{ id: string; code: string; title: string }>;
    missingMaterials: boolean;
  };
  readiness: {
    score: number;
    status: 'PRODUCTION_READY' | 'DEVELOPMENT_IN_PROGRESS' | 'INCOMPLETE_DRAFT' | 'INVALID_CYCLE';
    summary: string;
  };
  recommendations: Array<{
    issue: string;
    severity: 'critical' | 'warning' | 'info';
    suggestedCliCommand: string;
  }>;
}
