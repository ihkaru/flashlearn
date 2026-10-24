import type { MasteryStatus, CompetencyDriftStatus } from '@flashlearn/shared';

export interface MasteryRecordProps {
  id: string;
  userId: string;
  competencyId: string;
  status: MasteryStatus;
  verifiedAttemptId?: string | null;
  masteredAt?: Date | null;
  retestDueAt?: Date | null;
  difficulty?: number;
  stability?: number;
  lastDemonstratedAt?: Date;
  cachedRetrievability?: number;
  driftStatus?: CompetencyDriftStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class MasteryRecordEntity {
  constructor(public readonly props: MasteryRecordProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get competencyId(): string {
    return this.props.competencyId;
  }

  get status(): MasteryStatus {
    return this.props.status;
  }

  get verifiedAttemptId(): string | null {
    return this.props.verifiedAttemptId ?? null;
  }

  get masteredAt(): Date | null {
    return this.props.masteredAt ?? null;
  }

  get retestDueAt(): Date | null {
    return this.props.retestDueAt ?? null;
  }

  get difficulty(): number {
    return this.props.difficulty ?? 5.0;
  }

  get stability(): number {
    return this.props.stability ?? 30.0;
  }

  get lastDemonstratedAt(): Date {
    return this.props.lastDemonstratedAt ?? this.props.masteredAt ?? this.props.createdAt;
  }

  get cachedRetrievability(): number {
    return this.props.cachedRetrievability ?? 1.0;
  }

  get driftStatus(): CompetencyDriftStatus {
    return this.props.driftStatus ?? 'active';
  }

  isMastered(): boolean {
    return this.props.status === 'mastered';
  }

  isStale(): boolean {
    return this.props.status === 'stale';
  }

  canAttempt(): boolean {
    return this.props.status === 'ready' || this.props.status === 'in_progress' || this.props.status === 'stale';
  }
}

