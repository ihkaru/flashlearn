import type { BlindReviewRole, BlindReviewStatus } from '@flashlearn/shared';

export interface TaskAttemptReviewProps {
  id?: string;
  attemptId: string;
  reviewerId: string;
  blindToken: string;
  role?: BlindReviewRole;
  status?: BlindReviewStatus;
  rubricScores?: Record<string, number>;
  totalScore?: number;
  notes?: string;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TaskAttemptReviewEntity {
  public readonly id: string;
  public readonly attemptId: string;
  public readonly reviewerId: string;
  public readonly blindToken: string;
  public role: BlindReviewRole;
  public status: BlindReviewStatus;
  public rubricScores?: Record<string, number>;
  public totalScore?: number;
  public notes?: string;
  public submittedAt?: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: TaskAttemptReviewProps) {
    this.id = props.id || crypto.randomUUID();
    this.attemptId = props.attemptId;
    this.reviewerId = props.reviewerId;
    this.blindToken = props.blindToken;
    this.role = props.role || 'primary';
    this.status = props.status || 'assigned';
    this.rubricScores = props.rubricScores;
    this.totalScore = props.totalScore;
    this.notes = props.notes;
    this.submittedAt = props.submittedAt;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  submitScorecard(rubricScores: Record<string, number>, totalScore: number, notes?: string): void {
    if (this.status !== 'assigned') {
      throw new Error(`Cannot submit scorecard: Review is in '${this.status}' state`);
    }
    this.rubricScores = rubricScores;
    this.totalScore = totalScore;
    this.notes = notes;
    this.submittedAt = new Date();
    this.status = 'submitted';
    this.updatedAt = new Date();
  }

  markDisputed(): void {
    this.status = 'disputed';
    this.updatedAt = new Date();
  }

  markArbitrated(): void {
    this.status = 'arbitrated';
    this.updatedAt = new Date();
  }

  isSubmitted(): boolean {
    return this.status === 'submitted' || this.status === 'disputed' || this.status === 'arbitrated';
  }
}
