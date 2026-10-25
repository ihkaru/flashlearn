import { eq, and, desc, asc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db as defaultDb } from '../database/db';
import { socraticChatSessions, socraticChatTurns } from '../database/schemas/chat';
import type { SocraticChatSession, SocraticChatTurn } from '@flashlearn/shared';
import type {
  ISocraticChatRepository,
  CreateChatSessionProps,
  AppendChatTurnProps,
} from '../../domain/ports/ISocraticChatRepository';

export class DrizzleSocraticChatRepository implements ISocraticChatRepository {
  constructor(private readonly db: PostgresJsDatabase<any> = defaultDb) {}

  private mapSession(row: any): SocraticChatSession {
    return {
      id: row.id,
      userId: row.userId,
      taskId: row.taskId,
      workspaceId: row.workspaceId,
      domainId: row.domainId,
      merkleRoot: row.merkleRoot,
      status: row.status,
      turnCount: row.turnCount,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }

  private mapTurn(row: any): SocraticChatTurn {
    return {
      id: row.id,
      sessionId: row.sessionId,
      turnIndex: row.turnIndex,
      sender: row.sender,
      message: row.message,
      turnHash: row.turnHash,
      antiSpoilerBlocked: row.antiSpoilerBlocked,
      citedChunkIds: row.citedChunkIds ?? [],
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    };
  }

  async findSessionById(id: string): Promise<SocraticChatSession | null> {
    const [row] = await this.db.select().from(socraticChatSessions).where(eq(socraticChatSessions.id, id));
    if (!row) return null;
    const session = this.mapSession(row);
    session.turns = await this.listTurns(id);
    return session;
  }

  async findActiveSession(userId: string, taskId?: string | null): Promise<SocraticChatSession | null> {
    const conditions = [
      eq(socraticChatSessions.userId, userId),
      eq(socraticChatSessions.status, 'active'),
    ];
    if (taskId) {
      conditions.push(eq(socraticChatSessions.taskId, taskId));
    }
    const [row] = await this.db
      .select()
      .from(socraticChatSessions)
      .where(and(...conditions))
      .orderBy(desc(socraticChatSessions.updatedAt))
      .limit(1);

    if (!row) return null;
    const session = this.mapSession(row);
    session.turns = await this.listTurns(session.id);
    return session;
  }

  async createSession(data: CreateChatSessionProps): Promise<SocraticChatSession> {
    const [created] = await this.db
      .insert(socraticChatSessions)
      .values({
        userId: data.userId,
        workspaceId: data.workspaceId,
        domainId: data.domainId ?? null,
        taskId: data.taskId ?? null,
        status: 'active',
        turnCount: 0,
      })
      .returning();

    const session = this.mapSession(created);
    session.turns = [];
    return session;
  }

  async appendTurn(data: AppendChatTurnProps): Promise<SocraticChatTurn> {
    const [created] = await this.db
      .insert(socraticChatTurns)
      .values({
        sessionId: data.sessionId,
        turnIndex: data.turnIndex,
        sender: data.sender,
        message: data.message,
        turnHash: data.turnHash,
        antiSpoilerBlocked: data.antiSpoilerBlocked ?? false,
        citedChunkIds: data.citedChunkIds ?? [],
      })
      .returning();

    return this.mapTurn(created);
  }

  async listTurns(sessionId: string): Promise<SocraticChatTurn[]> {
    const rows = await this.db
      .select()
      .from(socraticChatTurns)
      .where(eq(socraticChatTurns.sessionId, sessionId))
      .orderBy(asc(socraticChatTurns.turnIndex));

    return rows.map((r) => this.mapTurn(r));
  }

  async updateSessionMerkleRoot(sessionId: string, merkleRoot: string, turnCount: number): Promise<void> {
    await this.db
      .update(socraticChatSessions)
      .set({
        merkleRoot,
        turnCount,
        updatedAt: new Date(),
      })
      .where(eq(socraticChatSessions.id, sessionId));
  }
}
