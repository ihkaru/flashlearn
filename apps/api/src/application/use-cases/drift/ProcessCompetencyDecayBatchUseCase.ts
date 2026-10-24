import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { IAuditLogRepository } from '../../../domain/ports/IAuditLogRepository';
import type { CompetencyDriftEngine } from '../../../domain/services/CompetencyDriftEngine';
import type { ProcessDecayBatchResult } from '@flashlearn/shared';

export class ProcessCompetencyDecayBatchUseCase {
  constructor(
    private readonly masteryRepo: IMasteryRepository,
    private readonly gateRepo: IGateRepository,
    private readonly auditRepo: IAuditLogRepository,
    private readonly driftEngine: CompetencyDriftEngine
  ) {}

  async execute(now: Date = new Date()): Promise<ProcessDecayBatchResult> {
    const allMastered = await this.masteryRepo.listAllMastered();
    let warningCount = 0;
    let expiredCount = 0;
    let suspendedGatePassportsCount = 0;

    for (const record of allMastered) {
      const elapsedMs = Math.max(0, now.getTime() - record.lastDemonstratedAt.getTime());
      const daysElapsed = elapsedMs / (1000 * 60 * 60 * 24);

      const evalResult = this.driftEngine.evaluateDrift(daysElapsed, record.stability);

      if (evalResult.isWarning) warningCount++;
      if (evalResult.isExpired) expiredCount++;

      // Update cached values
      await this.masteryRepo.updateDriftState(record.id, {
        cachedRetrievability: evalResult.retrievability,
        driftStatus: evalResult.driftStatus,
        status: evalResult.isExpired ? 'stale' : undefined,
      });

      // If expired, suspend any dependent Gate Passports
      if (evalResult.isExpired) {
        const userGrants = await this.gateRepo.listGrantsByUser(record.userId);
        for (const grant of userGrants) {
          if (grant.status === 'active') {
            const gate = await this.gateRepo.findById(grant.gateId);
            const workspaceId = gate?.workspaceId;

            await this.gateRepo.updateGrantStatus(
              grant.id,
              'provisional',
              `Predictive competency decay: Retrievability dropped to ${evalResult.retrievability} (< 0.70) for competency '${record.competencyId}'`
            );
            suspendedGatePassportsCount++;

            if (workspaceId) {
              await this.auditRepo.append({
                workspaceId,
                actorId: 'system_competency_drift_daemon',
                action: 'GATE_PASSPORT_SUSPENDED_DRIFT' as any,
                targetType: 'gate',
                targetId: grant.id,
                payload: {
                  userId: record.userId,
                  competencyId: record.competencyId,
                  retrievability: evalResult.retrievability,
                  stability: record.stability,
                  daysElapsed,
                },
              });
            }
          }
        }
      }
    }

    return {
      totalProcessed: allMastered.length,
      warningCount,
      expiredCount,
      suspendedGatePassportsCount,
      processedAt: now,
    };
  }
}
