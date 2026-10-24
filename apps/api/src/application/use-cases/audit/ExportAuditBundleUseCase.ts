import { createHash } from 'crypto';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { IAuditLogRepository } from '../../../domain/ports/IAuditLogRepository';
import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { AuditComplianceBundle } from '@flashlearn/shared';

export class ExportAuditBundleUseCase {
  constructor(
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly auditLogRepo: IAuditLogRepository,
    private readonly sourceRepo: ISourceRepository,
    private readonly gateRepo: IGateRepository
  ) {}

  async execute(workspaceId: string): Promise<AuditComplianceBundle> {
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace '${workspaceId}' not found`);
    }

    // 1. Fetch Sources & Chunk counts
    const sources = await this.sourceRepo.listByWorkspace(workspaceId);
    const sourcesSummary = [];
    for (const s of sources) {
      const chunks = await this.sourceRepo.listChunksBySourceId(s.id);
      sourcesSummary.push({
        code: s.code,
        version: s.version,
        status: s.status,
        totalChunks: chunks.length,
      });
    }

    // 2. Fetch Gates & Gate Grants
    const gates = await this.gateRepo.listByWorkspace(workspaceId);
    const gateMap = new Map<string, number>();
    for (const g of gates) {
      gateMap.set(g.id, g.level);
    }

    const grants = await this.gateRepo.listGrantsByWorkspace(workspaceId);
    const gateGrantsSummary = grants.map((gr) => ({
      userId: gr.userId,
      gateLevel: gateMap.get(gr.gateId) ?? 0,
      status: gr.status,
      grantedAt: gr.grantedAt,
    }));

    // 3. Fetch Audit Logs
    const rawLogs = await this.auditLogRepo.listByWorkspace(workspaceId, 1000);
    const logs = rawLogs.map((l) => ({
      id: l.id,
      workspaceId: l.workspaceId,
      actorId: l.actorId,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      payload: l.payload,
      createdAt: l.createdAt,
    }));

    // 4. Compute Tamper-Evident SHA-256 Bundle Checksum
    const canonicalPayload = JSON.stringify(logs.map((l) => [l.id, l.action, l.targetId, l.createdAt]));
    const bundleSignature = createHash('sha256').update(canonicalPayload).digest('hex');

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      bundleSignature,
      sources: sourcesSummary,
      gateGrants: gateGrantsSummary,
      logs,
    };
  }
}
