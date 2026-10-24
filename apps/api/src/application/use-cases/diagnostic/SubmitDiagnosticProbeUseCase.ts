import type { IDiagnosticSessionRepository } from '../../../domain/ports/IDiagnosticSessionRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { EvaluateAttemptUseCase } from '../task/EvaluateAttemptUseCase';
import type { DiagnosticPlacementEngine } from '../../engines/DiagnosticPlacementEngine';
import type { EvaluateAttemptResponse } from '@flashlearn/shared';

export interface SubmitDiagnosticProbeResult {
  evaluation: EvaluateAttemptResponse;
  passed: boolean;
  score: number;
  newlyInferredAncestors: string[];
  totalInferredMasteries: number;
  isComplete: boolean;
  currentFringeCodes: string[];
}

export class SubmitDiagnosticProbeUseCase {
  constructor(
    private readonly diagnosticRepo: IDiagnosticSessionRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly placementEngine: DiagnosticPlacementEngine,
    private readonly evaluateAttemptUseCase: EvaluateAttemptUseCase
  ) {}

  async execute(sessionId: string, submission: Record<string, any>): Promise<SubmitDiagnosticProbeResult> {
    const session = await this.diagnosticRepo.findById(sessionId);
    if (!session) {
      throw new Error(`Diagnostic session '${sessionId}' not found`);
    }

    if (session.isCompleted()) {
      throw new Error(`Diagnostic session '${sessionId}' has already completed`);
    }

    const competencies = await this.competencyRepo.listByWorkspace(session.workspaceId);
    const edges = await this.competencyRepo.listEdges(session.workspaceId);
    const kSpace = this.placementEngine.buildKnowledgeSpace(competencies, edges);

    const recommendation = await this.placementEngine.recommendNextProbe(session, kSpace, competencies);
    if (recommendation.isComplete || !recommendation.competencyId || !recommendation.task) {
      session.markCompleted();
      await this.diagnosticRepo.update(session);
      return {
        evaluation: null as any,
        passed: false,
        score: 0,
        newlyInferredAncestors: [],
        totalInferredMasteries: session.inferredMasteries.length,
        isComplete: true,
        currentFringeCodes: [],
      };
    }

    // Evaluate the attempt using standard FlashLearn evaluation engine
    const evalResult = await this.evaluateAttemptUseCase.execute(session.userId, {
      taskId: recommendation.task.id,
      submission,
    });

    const { newlyInferredAncestors } = this.placementEngine.applyProbeResult(
      session,
      kSpace,
      recommendation.competencyId,
      recommendation.task.id,
      evalResult.passed,
      evalResult.attempt.score
    );

    // If passed, persist masteries for newly inferred ancestors
    if (evalResult.passed) {
      for (const ancId of newlyInferredAncestors) {
        await this.masteryRepo.upsertStatus(session.userId, ancId, 'mastered', evalResult.attempt.id);
      }
    }

    await this.diagnosticRepo.update(session);

    const compMap = new Map(competencies.map((c) => [c.id, c]));
    const currentFringeCodes = (session.currentFringe || []).map((id) => compMap.get(id)?.code || id);

    return {
      evaluation: evalResult,
      passed: evalResult.passed,
      score: evalResult.attempt.score,
      newlyInferredAncestors,
      totalInferredMasteries: session.inferredMasteries.length,
      isComplete: session.isCompleted(),
      currentFringeCodes,
    };
  }
}
