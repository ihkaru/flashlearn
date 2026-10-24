import type { IDiagnosticSessionRepository } from '../../../domain/ports/IDiagnosticSessionRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { DiagnosticPlacementEngine } from '../../engines/DiagnosticPlacementEngine';
import type { DiagnosticSessionEntity } from '../../../domain/entities/DiagnosticSession';

export interface StartDiagnosticSessionResult {
  session: DiagnosticSessionEntity;
  totalCompetencies: number;
  initialFringeCodes: string[];
}

export class StartDiagnosticSessionUseCase {
  constructor(
    private readonly diagnosticRepo: IDiagnosticSessionRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly placementEngine: DiagnosticPlacementEngine
  ) {}

  async execute(userId: string, workspaceId: string): Promise<StartDiagnosticSessionResult> {
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace '${workspaceId}' not found`);
    }

    // Check for an active existing session
    const existing = await this.diagnosticRepo.findActiveByUserAndWorkspace(userId, workspaceId);
    if (existing) {
      const allComps = await this.competencyRepo.listByWorkspace(workspaceId);
      const compMap = new Map(allComps.map((c) => [c.id, c]));
      const fringeCodes = (existing.currentFringe || []).map((id) => compMap.get(id)?.code || id);
      return {
        session: existing,
        totalCompetencies: allComps.length,
        initialFringeCodes: fringeCodes,
      };
    }

    const competencies = await this.competencyRepo.listByWorkspace(workspaceId);
    if (competencies.length === 0) {
      throw new Error(`Workspace '${workspaceId}' has no competencies to diagnose`);
    }

    const edges = await this.competencyRepo.listEdges(workspaceId);
    const kSpace = this.placementEngine.buildKnowledgeSpace(competencies, edges);

    const initialFringe = kSpace.getOuterFringe([]);
    const compMap = new Map(competencies.map((c) => [c.id, c]));
    const initialFringeCodes = initialFringe.map((id) => compMap.get(id)?.code || id);

    const session = await this.diagnosticRepo.create({
      workspaceId,
      userId,
      initialFringe,
    });

    return {
      session,
      totalCompetencies: competencies.length,
      initialFringeCodes,
    };
  }
}
