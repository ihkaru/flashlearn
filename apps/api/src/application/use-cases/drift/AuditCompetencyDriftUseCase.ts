import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { CompetencyDriftEngine } from '../../../domain/services/CompetencyDriftEngine';
import type { DriftAuditReport, CompetencyMemoryStateDto } from '@flashlearn/shared';

export class AuditCompetencyDriftUseCase {
  constructor(
    private readonly competencyRepo: ICompetencyRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly driftEngine: CompetencyDriftEngine
  ) {}

  async execute(
    workspaceId: string,
    options: { threshold?: number; now?: Date } = {}
  ): Promise<DriftAuditReport> {
    const now = options.now || new Date();
    const threshold = options.threshold ?? 0.85;

    const competencies = await this.competencyRepo.listByWorkspace(workspaceId);
    const compMap = new Map(competencies.map((c) => [c.id, c]));

    const allMastered = await this.masteryRepo.listAllMastered();
    const workspaceRecords = allMastered.filter((m) => compMap.has(m.competencyId));

    const items: CompetencyMemoryStateDto[] = [];
    let activeCount = 0;
    let warningCount = 0;
    let expiredCount = 0;

    for (const record of workspaceRecords) {
      const comp = compMap.get(record.competencyId);
      const elapsedMs = Math.max(0, now.getTime() - record.lastDemonstratedAt.getTime());
      const daysElapsed = elapsedMs / (1000 * 60 * 60 * 24);

      const evalResult = this.driftEngine.evaluateDrift(daysElapsed, record.stability);

      if (evalResult.driftStatus === 'active') activeCount++;
      else if (evalResult.driftStatus === 'drift_warning') warningCount++;
      else if (evalResult.driftStatus === 'provisionally_expired') expiredCount++;

      items.push({
        userId: record.userId,
        competencyId: record.competencyId,
        competencyCode: comp?.code,
        competencyTitle: comp?.title,
        difficulty: record.difficulty,
        stability: record.stability,
        lastDemonstratedAt: record.lastDemonstratedAt,
        retrievability: evalResult.retrievability,
        driftStatus: evalResult.driftStatus,
        daysElapsed: evalResult.daysElapsed,
        daysUntilWarning: evalResult.daysUntilWarning,
        daysUntilExpiration: evalResult.daysUntilExpiration,
      });
    }

    const filteredItems = threshold
      ? items.filter((item) => item.retrievability <= threshold)
      : items;

    return {
      workspaceId,
      totalMonitored: workspaceRecords.length,
      activeCount,
      warningCount,
      expiredCount,
      items: filteredItems,
    };
  }
}
