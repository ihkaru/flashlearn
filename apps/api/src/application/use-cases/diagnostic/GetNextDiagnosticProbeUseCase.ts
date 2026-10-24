import type { IDiagnosticSessionRepository } from '../../../domain/ports/IDiagnosticSessionRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { DiagnosticPlacementEngine, NextProbeRecommendation } from '../../engines/DiagnosticPlacementEngine';

export class GetNextDiagnosticProbeUseCase {
  constructor(
    private readonly diagnosticRepo: IDiagnosticSessionRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly placementEngine: DiagnosticPlacementEngine
  ) {}

  async execute(sessionId: string): Promise<NextProbeRecommendation> {
    const session = await this.diagnosticRepo.findById(sessionId);
    if (!session) {
      throw new Error(`Diagnostic session '${sessionId}' not found`);
    }

    const competencies = await this.competencyRepo.listByWorkspace(session.workspaceId);
    const edges = await this.competencyRepo.listEdges(session.workspaceId);
    const kSpace = this.placementEngine.buildKnowledgeSpace(competencies, edges);

    const recommendation = await this.placementEngine.recommendNextProbe(session, kSpace, competencies);

    if (recommendation.isComplete && !session.isCompleted()) {
      session.markCompleted();
      await this.diagnosticRepo.update(session);
    }

    return recommendation;
  }
}
