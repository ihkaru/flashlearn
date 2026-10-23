import type { MasteryStatus } from '@flashlearn/shared';

export interface MasteryRecordProps {
  id: string;
  userId: string;
  competencyId: string;
  status: MasteryStatus;
  verifiedAttemptId?: string | null;
  masteredAt?: Date | null;
  retestDueAt?: Date | null;
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
