import type { ICredentialRepository } from '../../../domain/ports/ICredentialRepository';
import type { W3cCredentialCryptoEngine } from '../../../domain/services/W3cCredentialCryptoEngine';
import type { W3CVerifiableCredential20, VerifyVcResult } from '@flashlearn/shared';

export class VerifyVerifiableCredentialUseCase {
  constructor(
    private readonly credentialRepo: ICredentialRepository,
    private readonly cryptoEngine: W3cCredentialCryptoEngine
  ) {}

  async execute(
    credential: W3CVerifiableCredential20,
    options: { publicKeyPem?: string } = {}
  ): Promise<VerifyVcResult> {
    if (!credential || !credential.proof) {
      return { valid: false, error: 'INVALID_CREDENTIAL: Missing proof structure' };
    }

    let publicKeyPem = options.publicKeyPem;

    if (!publicKeyPem) {
      // Extract workspace ID from did:web or verificationMethod
      const vm = credential.proof.verificationMethod || '';
      const match = vm.match(/workspaces:([a-f0-9-]+)/);
      if (match) {
        const workspaceId = match[1];
        const keypair = await this.credentialRepo.findKeypairByWorkspace(workspaceId);
        if (keypair) {
          publicKeyPem = keypair.publicKeyPem;
        }
      }
    }

    if (!publicKeyPem) {
      return {
        valid: false,
        credentialId: credential.id,
        error: 'UNKNOWN_ISSUER_KEY: Unable to resolve issuer public key for offline verification',
      };
    }

    // Mathematical Ed25519 signature verification
    const verification = this.cryptoEngine.verifyCredential(credential, publicKeyPem);
    if (!verification.valid) {
      return verification;
    }

    // Check revocation status in repository
    const storedRecord = await this.credentialRepo.findCredentialById(credential.id);
    if (storedRecord && storedRecord.status !== 'active') {
      return {
        valid: false,
        credentialId: credential.id,
        error: `CREDENTIAL_${storedRecord.status.toUpperCase()}`,
      };
    }

    return {
      valid: true,
      credentialId: credential.id,
      issuerId: credential.issuer.id,
      subjectId: credential.credentialSubject.id,
      issuedAt: credential.validFrom,
      achievementTitle: credential.credentialSubject.achievement.gateTitle,
    };
  }
}
