import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { IAttemptRepository } from '../../../domain/ports/IAttemptRepository';
import type { IAuditLogRepository } from '../../../domain/ports/IAuditLogRepository';
import type { GateAuthorizationEngine } from '../../../domain/services/GateAuthorizationEngine';
import type { UserGateGrantEntity } from '../../../domain/entities/UserGateGrant';
import type { CompetencyEntity } from '../../../domain/entities/Competency';
import type { MasteryRecordEntity } from '../../../domain/entities/MasteryRecord';
import type { AttemptEntity } from '../../../domain/entities/Attempt';
import type { EvaluateGateEligibilityResult } from '@flashlearn/shared';

export interface EvaluateAndGrantResult {
  granted: boolean;
  grant?: UserGateGrantEntity;
  eligibility: EvaluateGateEligibilityResult;
}

export class EvaluateAndGrantGateUseCase {
  constructor(
    private readonly gateRepo: IGateRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly attemptRepo: IAttemptRepository,
    private readonly auditLogRepo: IAuditLogRepository,
    private readonly authEngine: GateAuthorizationEngine
  ) {}

  async execute(userId: string, gateId: string, actorId: string): Promise<EvaluateAndGrantResult> {
    const gate = await this.gateRepo.findById(gateId);
    if (!gate) throw new Error(`Gate '${gateId}' not found`);

    const allComps = await this.competencyRepo.listByWorkspace(gate.workspaceId);
    const compMap = new Map<string, CompetencyEntity>(allComps.map((c) => [c.id, c]));

    const userMasteries = await this.masteryRepo.listByUser(userId);
    const masteryMap = new Map<string, MasteryRecordEntity>(userMasteries.map((m) => [m.competencyId, m]));

    const userAttempts = await this.attemptRepo.listByUser(userId);
    const attemptMap = new Map<string, AttemptEntity>(userAttempts.map((a) => [a.id, a]));

    const eligibility = this.authEngine.evaluateEligibility({
      gate,
      competencyMap: compMap,
      masteryMap,
      attemptMap,
    });

    if (!eligibility.eligible) {
      return {
        granted: false,
        eligibility,
      };
    }

    // Check if active grant already exists
    const existingGrant = await this.gateRepo.findGrantByUserAndGate(userId, gate.id);
    if (existingGrant && existingGrant.isActive()) {
      return {
        granted: true,
        grant: existingGrant,
        eligibility,
      };
    }

    const verifiedCompIds = gate.requirements.map((r) => r.competencyId);
    const snapshot = {
      gateLevel: gate.level,
      verifiedCompetencyIds: verifiedCompIds,
      timestamp: new Date().toISOString(),
      evaluatorNotes: `Authorized for Level ${gate.level} wewenang bertahap`,
    };

    const grant = await this.gateRepo.createGrant({
      userId,
      gateId: gate.id,
      status: 'active',
      grantedBy: actorId,
      evidenceSnapshot: snapshot,
    });

    // Write immutable audit log
    await this.auditLogRepo.append({
      workspaceId: gate.workspaceId,
      actorId,
      action: 'GATE_GRANT',
      targetType: 'gate',
      targetId: gate.id,
      payload: {
        userId,
        gateLevel: gate.level,
        grantId: grant.id,
        snapshot,
      },
    });

    return {
      granted: true,
      grant,
      eligibility,
    };
  }
}
