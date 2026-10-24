import type { CompetencyEntity } from '../../domain/entities/Competency';
import type { TaskEntity } from '../../domain/entities/Task';
import type { DiagnosticSessionEntity } from '../../domain/entities/DiagnosticSession';
import { KnowledgeSpaceEngine, type PrerequisiteEdge } from '../../domain/services/KnowledgeSpaceEngine';
import type { ITaskRepository } from '../../domain/ports/ITaskRepository';

export interface NextProbeRecommendation {
  competencyId: string | null;
  competencyCode?: string;
  competencyTitle?: string;
  task: TaskEntity | null;
  isComplete: boolean;
  currentMasteriesCount: number;
  remainingUnmasteredCount: number;
  outerFringeCodes: string[];
}

export class DiagnosticPlacementEngine {
  constructor(private readonly taskRepo: ITaskRepository) {}

  buildKnowledgeSpace(
    competencies: CompetencyEntity[],
    edges: Array<{ competencyId?: string; prerequisiteId?: string; sourceCompetencyId?: string; targetCompetencyId?: string }>
  ): KnowledgeSpaceEngine {
    const nodes = competencies.map((c) => c.id);
    const mappedEdges: PrerequisiteEdge[] = edges.map((e) => ({
      sourceId: e.prerequisiteId ?? e.sourceCompetencyId ?? '',
      targetId: e.competencyId ?? e.targetCompetencyId ?? '',
    }));
    return new KnowledgeSpaceEngine(nodes, mappedEdges);
  }

  async recommendNextProbe(
    session: DiagnosticSessionEntity,
    kSpace: KnowledgeSpaceEngine,
    competencies: CompetencyEntity[]
  ): Promise<NextProbeRecommendation> {
    const compMap = new Map(competencies.map((c) => [c.id, c]));
    const mastered = session.inferredMasteries;
    const probed = session.probedCompetencyIds;

    // Termination check
    if (session.isCompleted() || mastered.length >= kSpace.getNodes().length || probed.length >= 12) {
      if (!session.isCompleted()) session.markCompleted();
      return {
        competencyId: null,
        task: null,
        isComplete: true,
        currentMasteriesCount: mastered.length,
        remainingUnmasteredCount: Math.max(0, kSpace.getNodes().length - mastered.length),
        outerFringeCodes: [],
      };
    }

    const nextCompetencyId = kSpace.selectOptimalFringeProbe(mastered, probed);
    if (!nextCompetencyId) {
      session.markCompleted();
      return {
        competencyId: null,
        task: null,
        isComplete: true,
        currentMasteriesCount: mastered.length,
        remainingUnmasteredCount: Math.max(0, kSpace.getNodes().length - mastered.length),
        outerFringeCodes: [],
      };
    }

    const nextComp = compMap.get(nextCompetencyId);
    const tasks = await this.taskRepo.listByCompetency(nextCompetencyId);
    const task = tasks.length > 0 ? tasks[0] : null;

    const outerFringe = kSpace.getOuterFringe(mastered);
    const outerFringeCodes = outerFringe.map((id) => compMap.get(id)?.code || id);

    return {
      competencyId: nextCompetencyId,
      competencyCode: nextComp?.code,
      competencyTitle: nextComp?.title,
      task,
      isComplete: false,
      currentMasteriesCount: mastered.length,
      remainingUnmasteredCount: Math.max(0, kSpace.getNodes().length - mastered.length),
      outerFringeCodes,
    };
  }

  applyProbeResult(
    session: DiagnosticSessionEntity,
    kSpace: KnowledgeSpaceEngine,
    competencyId: string,
    taskId: string,
    passed: boolean,
    score: number
  ): { updatedMasteries: string[]; newlyInferredAncestors: string[] } {
    let updatedMasteries = [...session.inferredMasteries];
    const newlyInferredAncestors: string[] = [];

    if (passed) {
      const beforeCount = updatedMasteries.length;
      const ancestors = kSpace.getAncestors(competencyId);
      for (const anc of ancestors) {
        if (!updatedMasteries.includes(anc)) newlyInferredAncestors.push(anc);
      }
      updatedMasteries = kSpace.propagateAncestralMastery(updatedMasteries, competencyId);
    }

    const nextFringe = kSpace.getOuterFringe(updatedMasteries);

    session.recordProbe(
      {
        competencyId,
        taskId,
        passed,
        score,
        timestamp: new Date(),
      },
      updatedMasteries,
      nextFringe
    );

    // Termination condition: all mastered or maximum probes reached
    if (updatedMasteries.length >= kSpace.getNodes().length || session.probedItems.length >= 10) {
      session.markCompleted();
    }

    return { updatedMasteries, newlyInferredAncestors };
  }
}
