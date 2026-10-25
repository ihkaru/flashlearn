import type { SocraticChatSession, SocraticChatTurn } from '@flashlearn/shared';

export interface CreateChatSessionProps {
  userId: string;
  workspaceId: string;
  domainId?: string | null;
  taskId?: string | null;
}

export interface AppendChatTurnProps {
  sessionId: string;
  turnIndex: number;
  sender: 'learner' | 'socratic_tutor';
  message: string;
  turnHash: string;
  antiSpoilerBlocked?: boolean;
  citedChunkIds?: string[];
}

export interface ISocraticChatRepository {
  findSessionById(id: string): Promise<SocraticChatSession | null>;
  findActiveSession(userId: string, taskId?: string | null): Promise<SocraticChatSession | null>;
  createSession(data: CreateChatSessionProps): Promise<SocraticChatSession>;
  appendTurn(data: AppendChatTurnProps): Promise<SocraticChatTurn>;
  listTurns(sessionId: string): Promise<SocraticChatTurn[]>;
  updateSessionMerkleRoot(sessionId: string, merkleRoot: string, turnCount: number): Promise<void>;
}
