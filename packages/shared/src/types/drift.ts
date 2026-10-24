export type CompetencyDriftStatus = 'active' | 'drift_warning' | 'provisionally_expired';

export interface CompetencyMemoryStateDto {
  userId: string;
  competencyId: string;
  competencyCode?: string;
  competencyTitle?: string;
  difficulty: number;
  stability: number; // in days
  lastDemonstratedAt: Date | string;
  retrievability: number; // 0.0 - 1.0
  driftStatus: CompetencyDriftStatus;
  daysElapsed: number;
  daysUntilWarning: number;
  daysUntilExpiration: number;
}

export interface DriftAuditReport {
  workspaceId: string;
  totalMonitored: number;
  activeCount: number;
  warningCount: number;
  expiredCount: number;
  items: CompetencyMemoryStateDto[];
}

export interface ProcessDecayBatchResult {
  totalProcessed: number;
  warningCount: number;
  expiredCount: number;
  suspendedGatePassportsCount: number;
  processedAt: Date | string;
}
