import { eq } from 'drizzle-orm';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { db } from '../database/db';
import { workspaceKeypairs, issuedCredentials } from '../database/schema';
import type {
  ICredentialRepository,
  WorkspaceKeypairRecord,
  IssuedCredentialRecord,
} from '../../domain/ports/ICredentialRepository';
import { W3cCredentialCryptoEngine } from '../../domain/services/W3cCredentialCryptoEngine';
import type { W3CVerifiableCredential20 } from '@flashlearn/shared';

const ENVELOPE_PREFIX = 'enc:v1:';

function deriveAes256Key(kmsKey: string): Buffer {
  return createHash('sha256').update(kmsKey, 'utf8').digest();
}

export function encryptPrivateKeyPem(privateKeyPem: string, kmsKey = process.env.CREDENTIAL_KMS_KEY): string {
  if (!kmsKey || !kmsKey.trim()) {
    return privateKeyPem;
  }
  const key = deriveAes256Key(kmsKey.trim());
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(privateKeyPem, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENVELOPE_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

export function decryptPrivateKeyPem(stored: string, kmsKey = process.env.CREDENTIAL_KMS_KEY): string {
  if (!stored.startsWith(ENVELOPE_PREFIX)) {
    return stored;
  }
  if (!kmsKey || !kmsKey.trim()) {
    throw new Error('CREDENTIAL_KMS_KEY is required to decrypt encrypted workspace private keys');
  }
  const parts = stored.slice(ENVELOPE_PREFIX.length).split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted private key envelope');
  }
  const [ivB64, tagB64, ctB64] = parts;
  const key = deriveAes256Key(kmsKey.trim());
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plain = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
  return plain.toString('utf8');
}

export class DrizzleCredentialRepository implements ICredentialRepository {
  private readonly cryptoEngine = new W3cCredentialCryptoEngine();

  async getOrCreateWorkspaceKeypair(workspaceId: string): Promise<WorkspaceKeypairRecord> {
    const existing = await this.findKeypairByWorkspace(workspaceId);
    if (existing) return existing;

    const keypair = this.cryptoEngine.generateKeypair();
    const didIdentifier = `did:web:flashlearn.dvlpid.my.id:workspaces:${workspaceId}#key-1`;
    const storedPrivateKey = encryptPrivateKeyPem(keypair.privateKeyPem);

    const [row] = await db
      .insert(workspaceKeypairs)
      .values({
        workspaceId,
        publicKeyMultibase: keypair.publicKeyMultibase,
        publicKeyPem: keypair.publicKeyPem,
        privateKeyPem: storedPrivateKey,
        didIdentifier,
      })
      .returning();

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      publicKeyMultibase: row.publicKeyMultibase,
      publicKeyPem: row.publicKeyPem,
      privateKeyPem: keypair.privateKeyPem,
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
      privateKeyPem: decryptPrivateKeyPem(row.privateKeyPem),
      didIdentifier: row.didIdentifier,
      createdAt: new Date(row.createdAt),
    };
  }

  async saveIssuedCredential(credential: {
    id: string;
    gateId: string;
    userId: string;
    workspaceId: string;
    executionArtifactHash?: string | null;
    vcPayload: W3CVerifiableCredential20;
    signatureProof: string;
    status?: 'active' | 'revoked' | 'drift_suspended';
  }): Promise<IssuedCredentialRecord> {
    const resolvedStatus: 'active' | 'revoked' | 'drift_suspended' =
      credential.status || 'active';
    const [row] = await db
      .insert(issuedCredentials)
      .values({
        id: credential.id,
        gateId: credential.gateId,
        userId: credential.userId,
        workspaceId: credential.workspaceId,
        executionArtifactHash: credential.executionArtifactHash || null,
        vcPayload: credential.vcPayload,
        signatureProof: credential.signatureProof,
        status: resolvedStatus,
      })
      .onConflictDoUpdate({
        target: issuedCredentials.id,
        set: {
          executionArtifactHash: credential.executionArtifactHash || null,
          vcPayload: credential.vcPayload,
          signatureProof: credential.signatureProof,
          status: resolvedStatus,
        },
      })
      .returning();

    return {
      id: row.id,
      gateId: row.gateId,
      userId: row.userId,
      workspaceId: row.workspaceId,
      executionArtifactHash: row.executionArtifactHash,
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
      executionArtifactHash: row.executionArtifactHash,
      vcPayload: row.vcPayload,
      signatureProof: row.signatureProof,
      status: row.status,
      issuedAt: new Date(row.issuedAt),
    };
  }
}
