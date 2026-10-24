import { randomBytes } from 'node:crypto';
import type { ITaskAttemptReviewRepository } from '../../../domain/ports/ITaskAttemptReviewRepository';
import type { IAttemptRepository } from '../../../domain/ports/IAttemptRepository';
import { TaskAttemptReviewEntity } from '../../../domain/entities/TaskAttemptReview';

export interface AssignBlindReviewersInput {
  attemptId: string;
  primaryReviewerId: string;
  secondaryReviewerId: string;
}

export interface AssignBlindReviewersResult {
  attemptId: string;
  primaryReview: { id: string; reviewerId: string; blindToken: string };
  secondaryReview: { id: string; reviewerId: string; blindToken: string };
}

export class AssignBlindReviewersUseCase {
  constructor(
    private readonly reviewRepo: ITaskAttemptReviewRepository,
    private readonly attemptRepo: IAttemptRepository
  ) {}

  private generateBlindToken(): string {
    return `bln_${randomBytes(16).toString('hex')}`;
  }

  async execute(input: AssignBlindReviewersInput): Promise<AssignBlindReviewersResult> {
    if (input.primaryReviewerId === input.secondaryReviewerId) {
      throw new Error('Primary and secondary reviewers must be different individuals');
    }

    const attempt = await this.attemptRepo.findById(input.attemptId);
    if (!attempt) {
      throw new Error(`Attempt '${input.attemptId}' not found`);
    }

    // Double-blind invariant: Learner cannot be assigned to grade their own submission
    if (attempt.userId === input.primaryReviewerId || attempt.userId === input.secondaryReviewerId) {
      throw new Error('Self-assessment violation: A candidate cannot review their own submission');
    }

    // Check if reviews already exist
    const existing = await this.reviewRepo.listByAttempt(input.attemptId);
    if (existing.length >= 2) {
      throw new Error(`Attempt '${input.attemptId}' already has reviewers assigned`);
    }

    const primaryToken = this.generateBlindToken();
    const secondaryToken = this.generateBlindToken();

    const primaryEntity = new TaskAttemptReviewEntity({
      attemptId: input.attemptId,
      reviewerId: input.primaryReviewerId,
      blindToken: primaryToken,
      role: 'primary',
      status: 'assigned',
    });

    const secondaryEntity = new TaskAttemptReviewEntity({
      attemptId: input.attemptId,
      reviewerId: input.secondaryReviewerId,
      blindToken: secondaryToken,
      role: 'secondary',
      status: 'assigned',
    });

    const savedPrimary = await this.reviewRepo.create(primaryEntity);
    const savedSecondary = await this.reviewRepo.create(secondaryEntity);

    // Initialize consensus record
    await this.reviewRepo.saveConsensusRecord({
      attemptId: input.attemptId,
      status: 'in_review',
      observedAgreement: 0,
      gwetAc1: 0,
      gwetAc2: 0,
      cohenKappa: 0,
      scoreDelta: 0,
      metrics: {
        observedAgreement: 0,
        gwetAC1: 0,
        gwetAC2: 0,
        cohenKappa: 0,
        scoreDelta: 0,
        hasConsensus: false,
        requiresArbiter: false,
      },
    });

    return {
      attemptId: input.attemptId,
      primaryReview: {
        id: savedPrimary.id,
        reviewerId: savedPrimary.reviewerId,
        blindToken: savedPrimary.blindToken,
      },
      secondaryReview: {
        id: savedSecondary.id,
        reviewerId: savedSecondary.reviewerId,
        blindToken: savedSecondary.blindToken,
      },
    };
  }
}
