import type { MasteryRecordEntity } from '../entities/MasteryRecord';
import type { MasteryStatus, CompetencyDriftStatus } from '@flashlearn/shared';

export interface IMasteryRepository {
  findByUserAndCompetency(userId: string, competencyId: string): Promise<MasteryRecordEntity | null>;
  listByUser(userId: string): Promise<MasteryRecordEntity[]>;
  listAllMastered(): Promise<MasteryRecordEntity[]>;
  batchGetStatus(userId: string, competencyIds: string[]): Promise<Map<string, MasteryRecordEntity>>;
  upsertStatus(
    userId: string,
    competencyId: string,
    status: MasteryStatus,
    verifiedAttemptId?: string | null
  ): Promise<MasteryRecordEntity>;
  markStaleForCompetency(competencyId: string): Promise<number>;
  updateDriftState(
    id: string,
    update: {
      stability?: number;
      difficulty?: number;
      lastDemonstratedAt?: Date;
      cachedRetrievability?: number;
      driftStatus?: CompetencyDriftStatus;
      status?: MasteryStatus;
    }
  ): Promise<void>;
}

