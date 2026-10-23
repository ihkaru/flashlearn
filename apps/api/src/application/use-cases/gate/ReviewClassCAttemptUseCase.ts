import type { IAttemptRepository } from '../../../domain/ports/IAttemptRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { IAuditLogRepository } from '../../../domain/ports/IAuditLogRepository';
import type { AttemptEntity } from '../../../domain/entities/Attempt';
import type { ClassCReviewDto } from '@flashlearn/shared';

export class ReviewClassCAttemptUseCase {
  constructor(
    private readonly attemptRepo: IAttemptRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly auditLogRepo: IAuditLogRepository
  ) {}

  async execute(reviewerId: string, dto: ClassCReviewDto): Promise<AttemptEntity> {
    const attempt = await this.attemptRepo.findById(dto.attemptId);
    if (!attempt) throw new Error(`Attempt '${dto.attemptId}' not found`);

    if (attempt.userId === reviewerId) {
      throw new Error('Self-assessment violation: Reviewer cannot verify their own Class C submission');
    }

    const task = await this.taskRepo.findById(attempt.taskId);
    if (!task) throw new Error(`Task '${attempt.taskId}' not found`);

    const competency = await this.competencyRepo.findById(task.competencyId);
    if (!competency) throw new Error(`Competency '${task.competencyId}' not found`);

    let totalScore = 0;
    let maxPossibleScore = 0;
    for (const s of dto.rubricScores) {
      totalScore += s.scoreAwarded;
      maxPossibleScore += s.maxScore;
    }

    const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const passed = dto.passed && scorePercentage >= task.passingScore;

    const feedback = `[HUMAN EXPERT SIGN-OFF] Hasil Penilaian Pakar: ${passed ? 'KOMPETEN' : 'BELUM MEMENUHI'}. Catatan: ${dto.expertNotes}`;

    const updated = await this.attemptRepo.updateEvaluation(attempt.id, {
      score: scorePercentage,
      passed,
      feedback,
      assessedBy: `human_expert:${reviewerId}`,
      details: {
        rubricScores: dto.rubricScores,
        expertNotes: dto.expertNotes,
        reviewedAt: new Date().toISOString(),
      },
    });

    if (passed) {
      await this.masteryRepo.upsertStatus(attempt.userId, competency.id, 'mastered', updated.id);
    }

    await this.auditLogRepo.append({
      workspaceId: competency.workspaceId,
      actorId: reviewerId,
      action: 'CLASS_C_EXPERT_VERIFICATION',
      targetType: 'attempt',
      targetId: updated.id,
      payload: {
        candidateUserId: attempt.userId,
        competencyId: competency.id,
        score: scorePercentage,
        passed,
        expertNotes: dto.expertNotes,
      },
    });

    return updated;
  }
}
