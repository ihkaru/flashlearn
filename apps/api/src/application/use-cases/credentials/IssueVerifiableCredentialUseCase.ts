import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { ICredentialRepository } from '../../../domain/ports/ICredentialRepository';
import type { W3cCredentialCryptoEngine } from '../../../domain/services/W3cCredentialCryptoEngine';
import type { CompetencyDriftEngine } from '../../../domain/services/CompetencyDriftEngine';
import type { W3CVerifiableCredential20 } from '@flashlearn/shared';

export interface IssueVcInput {
  gateId: string;
  userId: string;
  now?: Date;
}

export class IssueVerifiableCredentialUseCase {
  constructor(
    private readonly gateRepo: IGateRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly userRepo: IUserRepository,
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly credentialRepo: ICredentialRepository,
    private readonly cryptoEngine: W3cCredentialCryptoEngine,
    private readonly driftEngine: CompetencyDriftEngine
  ) {}

  async execute(input: IssueVcInput): Promise<W3CVerifiableCredential20> {
    const now = input.now || new Date();

    const gate = await this.gateRepo.findById(input.gateId);
    if (!gate) throw new Error(`Gate '${input.gateId}' not found`);

    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new Error(`User '${input.userId}' not found`);

    const workspace = await this.workspaceRepo.findById(gate.workspaceId);
    if (!workspace) throw new Error(`Workspace '${gate.workspaceId}' not found`);

    const grant = await this.gateRepo.findGrantByUserAndGate(input.userId, input.gateId);
    if (!grant || grant.status !== 'active') {
      throw new Error(`User '${input.userId}' does not hold an active grant for gate '${gate.title}'`);
    }

    // Invariant: Verify Competency Health Index across all required competencies (R >= 0.85)
    for (const compId of grant.evidenceSnapshot.verifiedCompetencyIds || []) {
      const mastery = await this.masteryRepo.findByUserAndCompetency(input.userId, compId);
      if (mastery) {
        const elapsedMs = Math.max(0, now.getTime() - mastery.lastDemonstratedAt.getTime());
        const daysElapsed = elapsedMs / (1000 * 60 * 60 * 24);
        const r = this.driftEngine.computeRetrievability(daysElapsed, mastery.stability);

        if (r < 0.85 || mastery.driftStatus === 'drift_warning' || mastery.driftStatus === 'provisionally_expired') {
          throw new Error(
            `COMPETENCY_DRIFT_UNSTABLE: Competency '${compId}' has decayed to R=${r} (< 0.85). Revalidation required prior to credential issuance.`
          );
        }
      }
    }

    const keypair = await this.credentialRepo.getOrCreateWorkspaceKeypair(gate.workspaceId);
    const credentialId = `urn:uuid:${crypto.randomUUID()}`;

    const claimDoc: Omit<W3CVerifiableCredential20, 'proof'> = {
      '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
      ],
      id: credentialId,
      type: ['VerifiableCredential', 'OpenBadgeCredential', 'DigitalAuthorityPassport'],
      issuer: {
        id: `did:web:flashlearn.dvlpid.my.id:workspaces:${gate.workspaceId}`,
        name: workspace.name,
      },
      validFrom: now.toISOString(),
      credentialSubject: {
        id: `did:flashlearn:user:${user.id}`,
        name: user.name,
        email: user.email,
        achievement: {
          gateId: gate.id,
          gateLevel: gate.level,
          gateTitle: gate.title,
          workspaceId: gate.workspaceId,
          workspaceName: workspace.name,
          verifiedScore: grant.evidenceSnapshot.verifiedCompetencyIds.length > 0 ? 95 : 100,
          verifiedCompetencies: grant.evidenceSnapshot.verifiedCompetencyIds,
        },
      },
    };

    const signedVc = this.cryptoEngine.signCredential(
      claimDoc,
      keypair.privateKeyPem,
      keypair.didIdentifier
    );

    await this.credentialRepo.saveIssuedCredential({
      id: signedVc.id,
      gateId: gate.id,
      userId: user.id,
      workspaceId: gate.workspaceId,
      vcPayload: signedVc,
      signatureProof: signedVc.proof.proofValue,
      status: 'active',
    });

    return signedVc;
  }
}
