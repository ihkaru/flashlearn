import type { MasteryRecordEntity } from '../entities/MasteryRecord';
import type { MasteryStatus } from '@flashlearn/shared';

export interface IMasteryRepository {
  findByUserAndCompetency(userId: string, competencyId: string): Promise<MasteryRecordEntity | null>;
  listByUser(userId: string): Promise<MasteryRecordEntity[]>;
  batchGetStatus(userId: string, competencyIds: string[]): Promise<Map<string, MasteryRecordEntity>>;
  upsertStatus(
    userId: string,
    competencyId: string,
    status: MasteryStatus,
    verifiedAttemptId?: string | null
  ): Promise<MasteryRecordEntity>;
  markStaleForCompetency(competencyId: string): Promise<number>;
}
