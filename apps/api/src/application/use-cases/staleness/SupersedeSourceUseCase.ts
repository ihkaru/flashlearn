import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { IAuditLogRepository } from '../../../domain/ports/IAuditLogRepository';
import type { StalenessInvalidationReport } from '@flashlearn/shared';

export interface SupersedeSourceRequest {
  sourceId: string;
  actorId: string;
  reason?: string;
}

export class SupersedeSourceUseCase {
  constructor(
    private readonly sourceRepo: ISourceRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly gateRepo: IGateRepository,
    private readonly auditLogRepo: IAuditLogRepository
  ) {}

  async execute(req: SupersedeSourceRequest): Promise<StalenessInvalidationReport> {
    const source = await this.sourceRepo.findById(req.sourceId);
    if (!source) throw new Error(`Source '${req.sourceId}' not found`);

    // 1. Update source status to superseded
    const updatedSource = await this.sourceRepo.updateStatus(source.id, 'superseded');
    if (!updatedSource) throw new Error(`Failed to update status of source '${req.sourceId}'`);

    // 2. Locate all competencies in this workspace
    const competencies = await this.competencyRepo.listByWorkspace(source.workspaceId);

    // 3. Invalidate masteries: mark active masteries as 'stale'
    let invalidatedMasteriesCount = 0;
    for (const comp of competencies) {
      const count = await this.masteryRepo.markStaleForCompetency(comp.id);
      invalidatedMasteriesCount += count;
    }

    // 4. Suspend active gate grants for this workspace
    const reasonText = req.reason || `Regulasi acuan [${source.code} v${source.version}] telah superseded. Uji ulang diperlukan.`;
    const suspendedGateGrantsCount = await this.gateRepo.suspendGrantsForWorkspace(
      source.workspaceId,
      reasonText
    );

    // 5. Append append-only audit trail
    await this.auditLogRepo.append({
      workspaceId: source.workspaceId,
      actorId: req.actorId,
      action: 'SOURCE_SUPERSEDED',
      targetType: 'source',
      targetId: source.id,
      payload: {
        sourceCode: source.code,
        version: source.version,
        reason: reasonText,
      },
    });

    await this.auditLogRepo.append({
      workspaceId: source.workspaceId,
      actorId: 'system_staleness_engine',
      action: 'STALENESS_TRIGGERED',
      targetType: 'source',
      targetId: source.id,
      payload: {
        sourceCode: source.code,
        staleCompetenciesCount: competencies.length,
        invalidatedMasteriesCount,
        suspendedGateGrantsCount,
      },
    });

    return {
      sourceId: source.id,
      sourceCode: source.code,
      supersededVersion: source.version,
      staleCompetenciesCount: competencies.length,
      invalidatedMasteriesCount,
      suspendedGateGrantsCount,
      affectedLearnerIds: [],
    };
  }
}
