import type { ITaskAttemptReviewRepository } from '../../../domain/ports/ITaskAttemptReviewRepository';
import type { IAttemptRepository } from '../../../domain/ports/IAttemptRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { SanitizedBlindAttemptDto } from '@flashlearn/shared';

export class GetBlindReviewByTokenUseCase {
  constructor(
    private readonly reviewRepo: ITaskAttemptReviewRepository,
    private readonly attemptRepo: IAttemptRepository,
    private readonly taskRepo: ITaskRepository
  ) {}

  async execute(blindToken: string): Promise<SanitizedBlindAttemptDto> {
    const review = await this.reviewRepo.findByBlindToken(blindToken);
    if (!review) {
      throw new Error(`Invalid or expired blind review token '${blindToken}'`);
    }

    const attempt = await this.attemptRepo.findById(review.attemptId);
    if (!attempt) {
      throw new Error(`Attempt '${review.attemptId}' not found`);
    }

    const task = await this.taskRepo.findById(attempt.taskId);
    if (!task) {
      throw new Error(`Task '${attempt.taskId}' not found`);
    }

    // Strict Double-Blind Sanitization: Decouple candidate identity completely
    return {
      blindToken: review.blindToken,
      attemptId: review.attemptId,
      taskId: task.id,
      taskTitle: task.title,
      taskScenario: task.scenario,
      taskType: task.taskType,
      submission: attempt.submission,
      rubricCriteria: task.rubricCriteria,
      passingScore: task.passingScore,
    };
  }
}
