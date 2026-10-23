import type { IAttemptRepository } from '../../../domain/ports/IAttemptRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { AttemptEntity } from '../../../domain/entities/Attempt';

export interface PendingReviewItem {
  attempt: AttemptEntity;
  taskTitle: string;
  competencyCode: string;
  competencyTitle: string;
  candidateName: string;
  candidateEmail: string;
}

export class ListPendingClassCReviewsUseCase {
  constructor(
    private readonly attemptRepo: IAttemptRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(): Promise<PendingReviewItem[]> {
    const pendingAttempts = await this.attemptRepo.listPendingClassC();
    const result: PendingReviewItem[] = [];

    for (const att of pendingAttempts) {
      const task = await this.taskRepo.findById(att.taskId);
      const competency = task ? await this.competencyRepo.findById(task.competencyId) : null;
      const candidate = await this.userRepo.findById(att.userId);

      result.push({
        attempt: att,
        taskTitle: task?.title || 'Unknown Task',
        competencyCode: competency?.code || 'UNKNOWN',
        competencyTitle: competency?.title || 'Unknown Competency',
        candidateName: candidate?.name || 'Unknown Candidate',
        candidateEmail: candidate?.email || 'Unknown Email',
      });
    }

    return result;
  }
}
