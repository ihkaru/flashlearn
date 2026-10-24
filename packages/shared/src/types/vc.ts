export interface W3CVerifiableCredential20 {
  '@context': string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
  };
  validFrom: string;
  validUntil?: string;
  credentialSubject: {
    id: string;
    name?: string;
    email?: string;
    achievement: {
      gateId: string;
      gateLevel: number;
      gateTitle: string;
      workspaceId: string;
      workspaceName: string;
      verifiedScore: number;
      verifiedCompetencies: string[];
    };
  };
  proof: {
    type: string;
    cryptosuite?: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

export interface VerifyVcResult {
  valid: boolean;
  credentialId?: string;
  issuerId?: string;
  subjectId?: string;
  issuedAt?: string;
  achievementTitle?: string;
  error?: string;
}
