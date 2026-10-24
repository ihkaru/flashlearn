import type { ITaskAttemptReviewRepository } from '../../../domain/ports/ITaskAttemptReviewRepository';
import type { IAttemptRepository } from '../../../domain/ports/IAttemptRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { MultiRaterConsensusEngine } from '../../../domain/services/MultiRaterConsensusEngine';
import type { InterRaterReliabilityResult, ConsensusStatus } from '@flashlearn/shared';

export interface SubmitBlindReviewInput {
  blindToken: string;
  rubricScores: Record<string, number>;
  totalScore?: number;
  notes?: string;
}

export interface SubmitBlindReviewResult {
  reviewId: string;
  attemptId: string;
  status: string;
  consensusStatus: ConsensusStatus;
  bothReviewsSubmitted: boolean;
  reliability?: InterRaterReliabilityResult;
  finalScore?: number;
  passed?: boolean;
}

export class SubmitBlindReviewUseCase {
  constructor(
    private readonly reviewRepo: ITaskAttemptReviewRepository,
    private readonly attemptRepo: IAttemptRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly consensusEngine: MultiRaterConsensusEngine
  ) {}

  async execute(input: SubmitBlindReviewInput): Promise<SubmitBlindReviewResult> {
    const review = await this.reviewRepo.findByBlindToken(input.blindToken);
    if (!review) {
      throw new Error(`Invalid blind review token '${input.blindToken}'`);
    }

    if (review.isSubmitted()) {
      throw new Error('This review has already been submitted and is immutable');
    }

    const attempt = await this.attemptRepo.findById(review.attemptId);
    if (!attempt) {
      throw new Error(`Attempt '${review.attemptId}' not found`);
    }

    const task = await this.taskRepo.findById(attempt.taskId);
    if (!task) {
      throw new Error(`Task '${attempt.taskId}' not found`);
    }

    // Calculate total score from rubric weights if not provided explicitly
    let totalScore = input.totalScore;
    if (totalScore === undefined) {
      let earned = 0;
      let totalWeight = 0;
      for (const crit of task.rubricCriteria) {
        const score = input.rubricScores[crit.id] ?? 0;
        earned += (score / 100) * crit.weight;
        totalWeight += crit.weight;
      }
      totalScore = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;
    }

    review.submitScorecard(input.rubricScores, totalScore, input.notes);
    await this.reviewRepo.update(review);

    // Check sibling reviews for this attempt
    const allReviews = await this.reviewRepo.listByAttempt(review.attemptId);
    const primaryReview = allReviews.find((r) => r.role === 'primary');
    const secondaryReview = allReviews.find((r) => r.role === 'secondary');

    if (!primaryReview?.isSubmitted() || !secondaryReview?.isSubmitted()) {
      return {
        reviewId: review.id,
        attemptId: review.attemptId,
        status: review.status,
        consensusStatus: 'in_review',
        bothReviewsSubmitted: false,
      };
    }

    // Both reviews are submitted: compute Gwet's AC1, AC2, Cohen's Kappa, and consensus
    const reliability = this.consensusEngine.calculateReliability(
      {
        reviewerId: primaryReview.reviewerId,
        totalScore: primaryReview.totalScore!,
        rubricScores: primaryReview.rubricScores || {},
      },
      {
        reviewerId: secondaryReview.reviewerId,
        totalScore: secondaryReview.totalScore!,
        rubricScores: secondaryReview.rubricScores || {},
      }
    );

    if (reliability.hasConsensus && reliability.finalScore !== undefined) {
      const passed = reliability.finalScore >= task.passingScore;

      await this.reviewRepo.saveConsensusRecord({
        attemptId: review.attemptId,
        status: 'consensus_approved',
        observedAgreement: reliability.observedAgreement,
        gwetAc1: reliability.gwetAC1,
        gwetAc2: reliability.gwetAC2,
        cohenKappa: reliability.cohenKappa,
        scoreDelta: reliability.scoreDelta,
        finalScore: reliability.finalScore,
        passed,
        metrics: reliability,
      });

      // Update attempt in primary database
      await this.attemptRepo.updateEvaluation(review.attemptId, {
        score: reliability.finalScore,
        passed,
        feedback: `Double-blind consensus achieved (Score: ${reliability.finalScore}%, Gwet AC1: ${reliability.gwetAC1}, Delta: ${reliability.scoreDelta}%).`,
        assessedBy: 'consensus_double_blind',
        details: { consensusMetrics: reliability },
      });

      // If passed, update competency mastery ledger
      if (passed) {
        await this.masteryRepo.upsertStatus(attempt.userId, task.competencyId, 'mastered', attempt.id);
      }

      return {
        reviewId: review.id,
        attemptId: review.attemptId,
        status: review.status,
        consensusStatus: 'consensus_approved',
        bothReviewsSubmitted: true,
        reliability,
        finalScore: reliability.finalScore,
        passed,
      };
    } else {
      // Disputed evaluation: trigger escalation to Chief Arbiter
      primaryReview.markDisputed();
      secondaryReview.markDisputed();
      await this.reviewRepo.update(primaryReview);
      await this.reviewRepo.update(secondaryReview);

      await this.reviewRepo.saveConsensusRecord({
        attemptId: review.attemptId,
        status: 'arbitration_required',
        observedAgreement: reliability.observedAgreement,
        gwetAc1: reliability.gwetAC1,
        gwetAc2: reliability.gwetAC2,
        cohenKappa: reliability.cohenKappa,
        scoreDelta: reliability.scoreDelta,
        metrics: reliability,
      });

      return {
        reviewId: review.id,
        attemptId: review.attemptId,
        status: 'disputed',
        consensusStatus: 'arbitration_required',
        bothReviewsSubmitted: true,
        reliability,
      };
    }
  }
}
