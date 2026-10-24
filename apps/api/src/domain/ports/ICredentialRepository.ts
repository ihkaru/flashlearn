import type { W3CVerifiableCredential20 } from '@flashlearn/shared';

export interface WorkspaceKeypairRecord {
  id: string;
  workspaceId: string;
  publicKeyMultibase: string;
  publicKeyPem: string;
  privateKeyPem: string;
  didIdentifier: string;
  createdAt: Date;
}

export interface IssuedCredentialRecord {
  id: string;
  gateId: string;
  userId: string;
  workspaceId: string;
  vcPayload: W3CVerifiableCredential20;
  signatureProof: string;
  status: string;
  issuedAt: Date;
}

export interface ICredentialRepository {
  getOrCreateWorkspaceKeypair(workspaceId: string): Promise<WorkspaceKeypairRecord>;
  findKeypairByWorkspace(workspaceId: string): Promise<WorkspaceKeypairRecord | null>;
  saveIssuedCredential(credential: {
    id: string;
    gateId: string;
    userId: string;
    workspaceId: string;
    vcPayload: W3CVerifiableCredential20;
    signatureProof: string;
    status?: string;
  }): Promise<IssuedCredentialRecord>;
  findCredentialById(id: string): Promise<IssuedCredentialRecord | null>;
}
