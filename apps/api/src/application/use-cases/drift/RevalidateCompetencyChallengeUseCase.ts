import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { CompetencyDriftEngine } from '../../../domain/services/CompetencyDriftEngine';
import type { CompetencyMemoryStateDto } from '@flashlearn/shared';

export interface RevalidateCompetencyInput {
  userId: string;
  competencyId: string;
  passed: boolean;
  score: number;
  now?: Date;
}

export interface RevalidateCompetencyResult {
  userId: string;
  competencyId: string;
  previousStability: number;
  newStability: number;
  stretchFactor: number;
  retrievabilityAtTest: number;
  newRetrievability: number;
  driftStatus: string;
  passed: boolean;
}

export class RevalidateCompetencyChallengeUseCase {
  constructor(
    private readonly masteryRepo: IMasteryRepository,
    private readonly driftEngine: CompetencyDriftEngine
  ) {}

  async execute(input: RevalidateCompetencyInput): Promise<RevalidateCompetencyResult> {
    const record = await this.masteryRepo.findByUserAndCompetency(input.userId, input.competencyId);
    if (!record) {
      throw new Error(`Mastery record not found for user '${input.userId}' and competency '${input.competencyId}'`);
    }

    const now = input.now || new Date();
    const elapsedMs = Math.max(0, now.getTime() - record.lastDemonstratedAt.getTime());
    const daysElapsed = elapsedMs / (1000 * 60 * 60 * 24);

    const retrievabilityAtTest = this.driftEngine.computeRetrievability(daysElapsed, record.stability);

    const newStability = this.driftEngine.updateStability(
      record.stability,
      record.difficulty,
      retrievabilityAtTest,
      input.passed
    );

    const stretchFactor = Math.round((newStability / record.stability) * 100) / 100;
    const newDriftStatus = input.passed ? 'active' : 'provisionally_expired';
    const newRetrievability = input.passed ? 1.0 : 0.5;

    await this.masteryRepo.updateDriftState(record.id, {
      stability: newStability,
      lastDemonstratedAt: now,
      cachedRetrievability: newRetrievability,
      driftStatus: newDriftStatus,
      status: input.passed ? 'mastered' : 'stale',
    });

    return {
      userId: input.userId,
      competencyId: input.competencyId,
      previousStability: record.stability,
      newStability,
      stretchFactor,
      retrievabilityAtTest,
      newRetrievability,
      driftStatus: newDriftStatus,
      passed: input.passed,
    };
  }
}
