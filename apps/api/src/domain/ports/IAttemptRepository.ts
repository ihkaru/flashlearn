import type { AttemptEntity, AttemptProps } from '../entities/Attempt';

export type CreateAttemptData = Omit<AttemptProps, 'id' | 'createdAt'>;

export interface IAttemptRepository {
  findById(id: string): Promise<AttemptEntity | null>;
  listByUser(userId: string): Promise<AttemptEntity[]>;
  listByTask(taskId: string): Promise<AttemptEntity[]>;
  findLatestPassedAttempt(userId: string, taskId: string): Promise<AttemptEntity | null>;
  create(data: CreateAttemptData): Promise<AttemptEntity>;
  updateEvaluation(id: string, update: {
    score: number;
    passed: boolean;
    feedback: string;
    assessedBy: string;
    details?: any;
  }): Promise<AttemptEntity>;
  listPendingClassC(): Promise<AttemptEntity[]>;
}
