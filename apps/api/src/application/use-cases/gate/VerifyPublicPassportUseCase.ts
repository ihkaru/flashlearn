import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { PublicGateVerificationResponse } from '@flashlearn/shared';

export class VerifyPublicPassportUseCase {
  constructor(
    private readonly gateRepo: IGateRepository,
    private readonly userRepo: IUserRepository,
    private readonly workspaceRepo: IWorkspaceRepository
  ) {}

  async execute(grantId: string): Promise<PublicGateVerificationResponse> {
    const grant = await this.gateRepo.findGrantById(grantId);
    if (!grant) {
      throw new Error(`Passport authority grant '${grantId}' not found or invalid`);
    }

    const gate = await this.gateRepo.findById(grant.gateId);
    if (!gate) {
      throw new Error(`Associated gate '${grant.gateId}' not found`);
    }

    const user = await this.userRepo.findById(grant.userId);
    const workspace = await this.workspaceRepo.findById(gate.workspaceId);

    const holderName = user ? (user.name || user.email.split('@')[0]) : 'Pegawai Terverifikasi';
    const workspaceName = workspace ? workspace.name : 'Domain Kredensial';

    return {
      grantId: grant.id,
      holderName,
      workspaceName,
      gateLevel: gate.level,
      gateTitle: gate.title,
      gateDescription: gate.description,
      status: grant.status,
      grantedAt: grant.grantedAt,
      grantedBy: grant.grantedBy,
      revokedAt: grant.revokedAt,
      revocationReason: grant.revocationReason,
      evidenceSnapshot: grant.evidenceSnapshot,
      isCurrentlyValid: grant.status === 'active',
      verificationUrl: `/verify/${grant.id}`,
    };
  }
}
