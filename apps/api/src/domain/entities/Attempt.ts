import type { OracleClass, AttemptDetail } from '@flashlearn/shared';

export interface AttemptProps {
  id: string;
  taskId: string;
  userId: string;
  submission: Record<string, any>;
  score: number;
  feedback: string;
  assessedBy: string;
  oracleClassUsed: OracleClass;
  passed: boolean;
  details?: {
    breakdown?: AttemptDetail[];
    detectedTraps?: string[];
    calculationDiscrepancies?: Array<{ field: string; expected: number; received: number }>;
  };
  createdAt: Date;
}

export class AttemptEntity {
  constructor(public readonly props: AttemptProps) {}

  get id(): string {
    return this.props.id;
  }

  get taskId(): string {
    return this.props.taskId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get submission(): Record<string, any> {
    return this.props.submission;
  }

  get score(): number {
    return this.props.score;
  }

  get feedback(): string {
    return this.props.feedback;
  }

  get assessedBy(): string {
    return this.props.assessedBy;
  }

  get oracleClassUsed(): OracleClass {
    return this.props.oracleClassUsed;
  }

  get passed(): boolean {
    return this.props.passed;
  }

  get details(): AttemptProps['details'] {
    return this.props.details;
  }
}
