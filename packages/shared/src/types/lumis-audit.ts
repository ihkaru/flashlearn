export interface LumisChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface LumisTranscriptBundle {
  sessionId: string;
  messages: LumisChatMessage[];
  merkleRootHash: string;
  isFlaggedForExtraction: boolean;
  extractionFlags?: string[];
  recordedAt: string;
}

export interface MerkleVerificationResult {
  isValid: boolean;
  computedRootHash: string;
  expectedRootHash: string;
  totalMessages: number;
}
