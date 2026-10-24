import type { TaskAttemptReviewEntity } from '../entities/TaskAttemptReview';
import type { InterRaterReliabilityResult, ConsensusStatus } from '@flashlearn/shared';

export interface ConsensusRecord {
  id: string;
  attemptId: string;
  status: ConsensusStatus;
  observedAgreement: number;
  gwetAc1: number;
  gwetAc2: number;
  cohenKappa: number;
  scoreDelta: number;
  finalScore?: number;
  passed?: boolean;
  arbiterReviewId?: string;
  metrics: InterRaterReliabilityResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskAttemptReviewRepository {
  create(review: TaskAttemptReviewEntity): Promise<TaskAttemptReviewEntity>;
  update(review: TaskAttemptReviewEntity): Promise<TaskAttemptReviewEntity>;
  findById(id: string): Promise<TaskAttemptReviewEntity | null>;
  findByBlindToken(blindToken: string): Promise<TaskAttemptReviewEntity | null>;
  listByAttempt(attemptId: string): Promise<TaskAttemptReviewEntity[]>;
  listPendingByReviewer(reviewerId: string): Promise<TaskAttemptReviewEntity[]>;

  saveConsensusRecord(record: Omit<ConsensusRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConsensusRecord>;
  findConsensusRecord(attemptId: string): Promise<ConsensusRecord | null>;
}
