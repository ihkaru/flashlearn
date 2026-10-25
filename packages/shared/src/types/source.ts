export type SourceStatus = 'active' | 'superseded' | 'draft';

export interface Source {
  id: string;
  workspaceId: string;
  domainId?: string | null;
  title: string;
  code: string;
  version: string;
  status: SourceStatus;
  owner: string;
  effectiveDate: string;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SourceChunk {
  id: string;
  sourceId: string;
  locationTag: string; // e.g. "Pasal 28 Ayat 1 Huruf a"
  content: string;
  tokenCount: number;
  sha256Hash: string;
  createdAt: string;
}

export interface VerifiedClaim {
  claimText: string;
  sourceCode: string;
  locationTag: string;
  directQuote: string;
  isVerified?: boolean;
  verificationError?: string;
}

export interface CitationValidationDetail {
  claimText: string;
  sourceCode: string;
  locationTag: string;
  directQuote: string;
  isValid: boolean;
  error?: string;
}

export interface CitationValidationResult {
  isValid: boolean;
  totalClaims: number;
  validClaims: number;
  invalidClaims: number;
  details: CitationValidationDetail[];
}

export interface IngestSourceDto {
  workspaceId: string;
  domainId?: string | null;
  title: string;
  code: string;
  version?: string;
  owner?: string;
  effectiveDate?: string;
  rawText: string; // Document text with section/pasal delimiters
}

export interface GenerateLessonRequest {
  workspaceId: string;
  sourceCode: string;
  topic: string;
}

export interface GenerateLessonResponse {
  title: string;
  summary: string;
  body: string;
  verifiedClaims: VerifiedClaim[];
  unknowns: string[];
  validationResult: CitationValidationResult;
}
