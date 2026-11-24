import type { ICredentialRepository } from '../../../domain/ports/ICredentialRepository';
import type { W3cCredentialCryptoEngine } from '../../../domain/services/W3cCredentialCryptoEngine';
import type { W3CVerifiableCredential20, VerifyVcResult } from '@flashlearn/shared';

export class VerifyVerifiableCredentialUseCase {
  constructor(
    private readonly credentialRepo: ICredentialRepository,
    private readonly cryptoEngine: W3cCredentialCryptoEngine
  ) {}

  async execute(
    credential: W3CVerifiableCredential20
  ): Promise<VerifyVcResult> {
    if (!credential || !credential.proof) {
      return { valid: false, error: 'INVALID_CREDENTIAL: Missing proof structure' };
    }

    // Always resolve issuer public key from trusted workspace_keypairs in DB
    const vm = credential.proof.verificationMethod || '';
    const match = vm.match(/workspaces:([a-f0-9-]+)/);
    if (!match) {
      return {
        valid: false,
        credentialId: credential.id,
        error: 'UNKNOWN_ISSUER_KEY: Unable to extract workspace DID from verificationMethod',
      };
    }

    const workspaceId = match[1];
    const keypair = await this.credentialRepo.findKeypairByWorkspace(workspaceId);
    if (!keypair) {
      return {
        valid: false,
        credentialId: credential.id,
        error: 'UNKNOWN_ISSUER_KEY: Unable to resolve issuer public key from trusted registry',
      };
    }

    const expectedIssuerDid = keypair.didIdentifier.split('#')[0];
    if (!credential.issuer?.id || credential.issuer.id !== expectedIssuerDid) {
      return {
        valid: false,
        credentialId: credential.id,
        error: 'ISSUER_DID_MISMATCH: Credential issuer does not match resolved workspace DID',
      };
    }

    // Mathematical Ed25519 signature verification against trusted DB public key
    const verification = this.cryptoEngine.verifyCredential(credential, keypair.publicKeyPem);
    if (!verification.valid) {
      return verification;
    }

    // Require persisted active credential record in repository
    const storedRecord = await this.credentialRepo.findCredentialById(credential.id);
    if (!storedRecord) {
      return {
        valid: false,
        credentialId: credential.id,
        error: 'CREDENTIAL_NOT_FOUND',
      };
    }
    if (storedRecord.status !== 'active') {
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
