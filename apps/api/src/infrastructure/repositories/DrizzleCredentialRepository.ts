import { eq } from 'drizzle-orm';
import { db } from '../database/db';
import { workspaceKeypairs, issuedCredentials } from '../database/schema';
import type {
  ICredentialRepository,
  WorkspaceKeypairRecord,
  IssuedCredentialRecord,
} from '../../domain/ports/ICredentialRepository';
import { W3cCredentialCryptoEngine } from '../../domain/services/W3cCredentialCryptoEngine';
import type { W3CVerifiableCredential20 } from '@flashlearn/shared';

export class DrizzleCredentialRepository implements ICredentialRepository {
  private readonly cryptoEngine = new W3cCredentialCryptoEngine();

  async getOrCreateWorkspaceKeypair(workspaceId: string): Promise<WorkspaceKeypairRecord> {
    const existing = await this.findKeypairByWorkspace(workspaceId);
    if (existing) return existing;

    const keypair = this.cryptoEngine.generateKeypair();
    const didIdentifier = `did:web:flashlearn.dvlpid.my.id:workspaces:${workspaceId}#key-1`;

    const [row] = await db
      .insert(workspaceKeypairs)
      .values({
        workspaceId,
        publicKeyMultibase: keypair.publicKeyMultibase,
        publicKeyPem: keypair.publicKeyPem,
        privateKeyPem: keypair.privateKeyPem,
        didIdentifier,
      })
      .returning();

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      publicKeyMultibase: row.publicKeyMultibase,
      publicKeyPem: row.publicKeyPem,
      privateKeyPem: row.privateKeyPem,
      didIdentifier: row.didIdentifier,
      createdAt: new Date(row.createdAt),
    };
  }

  async findKeypairByWorkspace(workspaceId: string): Promise<WorkspaceKeypairRecord | null> {
    const [row] = await db
      .select()
      .from(workspaceKeypairs)
      .where(eq(workspaceKeypairs.workspaceId, workspaceId));

    if (!row) return null;

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      publicKeyMultibase: row.publicKeyMultibase,
      publicKeyPem: row.publicKeyPem,
      privateKeyPem: row.privateKeyPem,
      didIdentifier: row.didIdentifier,
      createdAt: new Date(row.createdAt),
    };
  }

  async saveIssuedCredential(credential: {
    id: string;
    gateId: string;
    userId: string;
    workspaceId: string;
    vcPayload: W3CVerifiableCredential20;
    signatureProof: string;
    status?: string;
  }): Promise<IssuedCredentialRecord> {
    const [row] = await db
      .insert(issuedCredentials)
      .values({
        id: credential.id,
        gateId: credential.gateId,
        userId: credential.userId,
        workspaceId: credential.workspaceId,
        vcPayload: credential.vcPayload,
        signatureProof: credential.signatureProof,
        status: credential.status || 'active',
      })
      .onConflictDoUpdate({
        target: issuedCredentials.id,
        set: {
          vcPayload: credential.vcPayload,
          signatureProof: credential.signatureProof,
          status: credential.status || 'active',
        },
      })
      .returning();

    return {
      id: row.id,
      gateId: row.gateId,
      userId: row.userId,
      workspaceId: row.workspaceId,
      vcPayload: row.vcPayload,
      signatureProof: row.signatureProof,
      status: row.status,
      issuedAt: new Date(row.issuedAt),
    };
  }

  async findCredentialById(id: string): Promise<IssuedCredentialRecord | null> {
    const [row] = await db
      .select()
      .from(issuedCredentials)
      .where(eq(issuedCredentials.id, id));

    if (!row) return null;

    return {
      id: row.id,
      gateId: row.gateId,
      userId: row.userId,
      workspaceId: row.workspaceId,
      vcPayload: row.vcPayload,
      signatureProof: row.signatureProof,
      status: row.status,
      issuedAt: new Date(row.issuedAt),
    };
  }
}
