import { randomBytes } from 'node:crypto';
import type { ITaskAttemptReviewRepository } from '../../../domain/ports/ITaskAttemptReviewRepository';
import type { IAttemptRepository } from '../../../domain/ports/IAttemptRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { MultiRaterConsensusEngine } from '../../../domain/services/MultiRaterConsensusEngine';
import { TaskAttemptReviewEntity } from '../../../domain/entities/TaskAttemptReview';

export interface ResolveArbitrationInput {
  attemptId: string;
  arbiterId: string;
  rubricScores: Record<string, number>;
  totalScore: number;
  notes?: string;
}

export interface ResolveArbitrationResult {
  attemptId: string;
  finalScore: number;
  passed: boolean;
  resolvedMethod: string;
  concordantPair: [number, number];
  arbiterReviewId: string;
}

export class ResolveArbitrationUseCase {
  constructor(
    private readonly reviewRepo: ITaskAttemptReviewRepository,
    private readonly attemptRepo: IAttemptRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly consensusEngine: MultiRaterConsensusEngine
  ) {}

  async execute(input: ResolveArbitrationInput): Promise<ResolveArbitrationResult> {
    const consensusRecord = await this.reviewRepo.findConsensusRecord(input.attemptId);
    if (!consensusRecord || consensusRecord.status !== 'arbitration_required') {
      throw new Error(`Attempt '${input.attemptId}' is not pending arbitration`);
    }

    const attempt = await this.attemptRepo.findById(input.attemptId);
    if (!attempt) throw new Error(`Attempt '${input.attemptId}' not found`);

    if (attempt.userId === input.arbiterId) {
      throw new Error('Self-assessment violation: Chief Arbiter cannot be the candidate');
    }

    const existingReviews = await this.reviewRepo.listByAttempt(input.attemptId);
    const r1 = existingReviews.find((r) => r.role === 'primary');
    const r2 = existingReviews.find((r) => r.role === 'secondary');

    if (!r1 || !r2 || !r1.totalScore || !r2.totalScore) {
      throw new Error('Both original rater evaluations must be recorded before arbitration');
    }

    if (r1.reviewerId === input.arbiterId || r2.reviewerId === input.arbiterId) {
      throw new Error('Chief Arbiter must be an independent third party, not one of the original raters');
    }

    const arbiterToken = `bln_arb_${randomBytes(16).toString('hex')}`;
    const arbiterEntity = new TaskAttemptReviewEntity({
      attemptId: input.attemptId,
      reviewerId: input.arbiterId,
      blindToken: arbiterToken,
      role: 'arbiter',
      status: 'arbitrated',
      rubricScores: input.rubricScores,
      totalScore: input.totalScore,
      notes: input.notes,
      submittedAt: new Date(),
    });

    const savedArbiter = await this.reviewRepo.create(arbiterEntity);

    // Reconcile three scores
    const resolution = this.consensusEngine.resolveArbitration(
      r1.totalScore,
      r2.totalScore,
      input.totalScore
    );

    const task = await this.taskRepo.findById(attempt.taskId);
    if (!task) throw new Error(`Task '${attempt.taskId}' not found`);

    const passed = resolution.finalScore >= task.passingScore;

    await this.reviewRepo.saveConsensusRecord({
      attemptId: input.attemptId,
      status: 'arbitration_resolved',
      observedAgreement: consensusRecord.observedAgreement,
      gwetAc1: consensusRecord.gwetAc1,
      gwetAc2: consensusRecord.gwetAc2,
      cohenKappa: consensusRecord.cohenKappa,
      scoreDelta: consensusRecord.scoreDelta,
      finalScore: resolution.finalScore,
      passed,
      arbiterReviewId: savedArbiter.id,
      metrics: {
        ...consensusRecord.metrics,
        hasConsensus: true,
        requiresArbiter: false,
        finalScore: resolution.finalScore,
        arbitrationDetails: {
          arbiterScore: input.totalScore,
          rater1Score: r1.totalScore,
          rater2Score: r2.totalScore,
          resolvedMethod: resolution.resolvedMethod,
        },
      },
    });

    // Update attempt evaluation in primary database
    await this.attemptRepo.updateEvaluation(input.attemptId, {
      score: resolution.finalScore,
      passed,
      feedback: `Arbitration resolved by Chief Arbiter via ${resolution.resolvedMethod} (Final Score: ${resolution.finalScore}%).`,
      assessedBy: 'chief_arbiter_arbitration',
      details: { arbitrationResolution: resolution },
    });

    // If passed, update competency mastery
    if (passed) {
      await this.masteryRepo.upsertStatus(attempt.userId, task.competencyId, 'mastered', attempt.id);
    }

    return {
      attemptId: input.attemptId,
      finalScore: resolution.finalScore,
      passed,
      resolvedMethod: resolution.resolvedMethod,
      concordantPair: resolution.concordantPair,
      arbiterReviewId: savedArbiter.id,
    };
  }
}
