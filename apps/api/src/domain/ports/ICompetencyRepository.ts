import type { CompetencyEntity } from '../entities/Competency';
import type { OracleClass, RiskLevel, CompetencyEdge, CognitiveArchetype } from '@flashlearn/shared';

export interface CreateCompetencyData {
  workspaceId: string;
  domainId?: string | null;
  sourceId?: string | null;
  code: string;
  title: string;
  description: string;
  oracleClass: OracleClass;
  cognitiveArchetype?: CognitiveArchetype;
  riskLevel: RiskLevel;
}

export interface ICompetencyRepository {
  findById(id: string): Promise<CompetencyEntity | null>;
  findByCode(workspaceId: string, code: string): Promise<CompetencyEntity | null>;
  listByWorkspace(workspaceId: string): Promise<CompetencyEntity[]>;
  create(data: CreateCompetencyData): Promise<CompetencyEntity>;
  update(id: string, data: Partial<CreateCompetencyData>): Promise<CompetencyEntity | null>;
  delete(id: string): Promise<boolean>;

  // Graph Edges (Prerequisites)
  addPrerequisite(competencyId: string, prerequisiteId: string): Promise<void>;
  removePrerequisite(competencyId: string, prerequisiteId: string): Promise<void>;
  getPrerequisites(competencyId: string): Promise<string[]>;
  listEdges(workspaceId: string): Promise<CompetencyEdge[]>;

  // Governance
  approveByExpert(id: string, expertUserId: string): Promise<CompetencyEntity | null>;
}
