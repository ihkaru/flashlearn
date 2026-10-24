import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { IAttemptRepository } from '../../../domain/ports/IAttemptRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { OracleEvaluatorClassA } from '../../../domain/services/OracleEvaluatorClassA';
import type { OracleEvaluatorClassB } from '../../../domain/services/OracleEvaluatorClassB';
import type { FlashcardGeneratorService } from '../../../domain/services/FlashcardGeneratorService';
import type { CompetencyGraphEngine } from '../../../domain/services/CompetencyGraphEngine';
import type { IAuditLogRepository } from '../../../domain/ports/IAuditLogRepository';
import type {
  EvaluateAttemptRequest,
  EvaluateAttemptResponse,
  PostTaskFlashcard,
} from '@flashlearn/shared';

export class EvaluateAttemptUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly attemptRepo: IAttemptRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly evaluatorA: OracleEvaluatorClassA,
    private readonly evaluatorB: OracleEvaluatorClassB,
    private readonly flashcardGen: FlashcardGeneratorService,
    private readonly graphEngine: CompetencyGraphEngine,
    private readonly auditLogRepo?: IAuditLogRepository
  ) {}

  async execute(userId: string, req: EvaluateAttemptRequest): Promise<EvaluateAttemptResponse> {
    const task = await this.taskRepo.findById(req.taskId);
    if (!task) {
      throw new Error(`Task '${req.taskId}' not found`);
    }

    const competency = await this.competencyRepo.findById(task.competencyId);
    if (!competency) {
      throw new Error(`Associated competency '${task.competencyId}' not found`);
    }

    // 1. Verify Prerequisites (Learner cannot attempt a locked competency)
    const allNodes = await this.competencyRepo.listByWorkspace(competency.workspaceId);
    const allEdges = await this.competencyRepo.listEdges(competency.workspaceId);
    const masteryMap = await this.masteryRepo.batchGetStatus(userId, allNodes.map((n) => n.id));

    const progression = this.graphEngine.evaluateLearnerProgression(allNodes, allEdges, masteryMap);
    const nodeStatus = progression.find((p) => p.id === competency.id);

    if (nodeStatus && nodeStatus.userStatus === 'locked') {
      const blockers = nodeStatus.blockingPrerequisites.map((b) => b.code).join(', ');
      throw new Error(
        `Cannot attempt task: Competency '${competency.code}' is currently LOCKED. Complete prerequisites first: ${blockers}`
      );
    }

    // 2. Multi-Tier Oracle Evaluation Branching
    let score = 0;
    let passed = false;
    let feedback = '';
    let assessedBy = '';
    let details: any = {};
    let flashcards: PostTaskFlashcard[] = [];

    if (competency.oracleClass === 'A') {
      const resA = this.evaluatorA.evaluate(task, req.submission);
      score = resA.score;
      passed = resA.passed;
      feedback = resA.feedback;
      assessedBy = resA.assessedBy;
      details = resA.details;

      flashcards = this.flashcardGen.generateFromAttempt(
        task,
        resA.details.breakdown,
        resA.details.calculationDiscrepancies
      );
    } else if (competency.oracleClass === 'B') {
      const resB = await this.evaluatorB.evaluate(task, req.submission);
      score = resB.score;
      passed = resB.passed;
      feedback = resB.feedback;
      assessedBy = resB.assessedBy;
      details = resB.details;

      flashcards = this.flashcardGen.generateFromAttempt(
        task,
        resB.details.breakdown,
        undefined,
        resB.details.detectedTraps
      );
    } else {
      // Class C: Human Expert queue placeholder (handled in Phase 04)
      score = 0;
      passed = false;
      feedback = 'Tugas Kelas C telah masuk antrean penelaahan pakar manusia.';
      assessedBy = 'pending_expert_review';
    }

    // 3. Persist Attempt
    const attempt = await this.attemptRepo.create({
      taskId: task.id,
      userId,
      submission: req.submission,
      score,
      feedback,
      assessedBy,
      oracleClassUsed: competency.oracleClass,
      passed,
      details,
    });

    // Append Immutable Audit Log
    if (this.auditLogRepo) {
      await this.auditLogRepo.append({
        workspaceId: competency.workspaceId,
        actorId: userId,
        action: 'ORACLE_EVALUATED',
        targetType: 'attempt',
        targetId: attempt.id,
        payload: {
          taskId: task.id,
          taskTitle: task.title,
          competencyId: competency.id,
          competencyCode: competency.code,
          score,
          passed,
          oracleClassUsed: competency.oracleClass,
          assessedBy,
          detectedTraps: details?.detectedTraps || [],
        },
      });
    }

    // 4. Update Mastery Ledger if Passed
    let unlockedCompetencyId: string | null = null;
    if (passed) {
      await this.masteryRepo.upsertStatus(userId, competency.id, 'mastered', attempt.id);

      // Check which downstream nodes were unlocked
      const newMasteryMap = await this.masteryRepo.batchGetStatus(userId, allNodes.map((n) => n.id));
      const newProgression = this.graphEngine.evaluateLearnerProgression(allNodes, allEdges, newMasteryMap);
      const newlyUnlocked = newProgression.find(
        (p) => p.prerequisiteIds?.includes(competency.id) && p.userStatus === 'ready'
      );
      if (newlyUnlocked) {
        unlockedCompetencyId = newlyUnlocked.id;
      }
    } else {
      // If failed, ensure status is in_progress
      await this.masteryRepo.upsertStatus(userId, competency.id, 'in_progress', attempt.id);
    }

    return {
      attempt: {
        id: attempt.id,
        taskId: attempt.taskId,
        userId: attempt.userId,
        submission: attempt.submission,
        score: attempt.score,
        feedback: attempt.feedback,
        assessedBy: attempt.assessedBy,
        oracleClassUsed: attempt.oracleClassUsed,
        passed: attempt.passed,
        details: attempt.details,
        createdAt: attempt.props.createdAt.toISOString(),
      },
      passed,
      unlockedCompetencyId,
      generatedFlashcards: flashcards,
    };
  }
}
