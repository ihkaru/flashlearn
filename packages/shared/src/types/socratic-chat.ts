export interface SocraticChatTurn {
  id: string;
  sessionId: string;
  turnIndex: number;
  sender: 'learner' | 'socratic_tutor';
  message: string;
  turnHash: string;
  antiSpoilerBlocked: boolean;
  citedChunkIds: string[];
  createdAt: string;
}

export interface SocraticChatSession {
  id: string;
  userId: string;
  taskId: string | null;
  workspaceId: string;
  domainId: string | null;
  merkleRoot: string | null;
  status: 'active' | 'concluded';
  turnCount: number;
  turns?: SocraticChatTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface AppendSocraticTurnRequest {
  sessionId?: string;
  taskId?: string;
  workspaceId: string;
  domainId?: string;
  userMessage: string;
}

export interface AppendSocraticTurnResponse {
  session: SocraticChatSession;
  learnerTurn: SocraticChatTurn;
  tutorTurn: SocraticChatTurn;
  merkleRoot: string;
}
