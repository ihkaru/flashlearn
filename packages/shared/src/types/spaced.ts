export interface SpacedFlashcard {
  id: string;
  userId: string;
  competencyId: string;
  sourceChunkId?: string | null;
  front: string;
  back: string;
  category: string;
  repetitionIntervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  nextReviewDue: string;
  createdAt: string;
  updatedAt: string;
}

export interface StalenessInvalidationReport {
  sourceId: string;
  sourceCode: string;
  supersededVersion: string;
  staleCompetenciesCount: number;
  invalidatedMasteriesCount: number;
  suspendedGateGrantsCount: number;
  affectedLearnerIds: string[];
}
