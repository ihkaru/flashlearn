import { eq, and, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { diagnosticSessions } from '../database/schema';
import { DiagnosticSessionEntity } from '../../domain/entities/DiagnosticSession';
import type {
  IDiagnosticSessionRepository,
  CreateDiagnosticSessionData,
} from '../../domain/ports/IDiagnosticSessionRepository';

export class DrizzleDiagnosticSessionRepository implements IDiagnosticSessionRepository {
  private mapToEntity(row: typeof diagnosticSessions.$inferSelect): DiagnosticSessionEntity {
    return new DiagnosticSessionEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      userId: row.userId,
      status: row.status as 'in_progress' | 'completed',
      probedItems: (row.probedItems as any[]) || [],
      inferredMasteries: (row.inferredMasteries as string[]) || [],
      stateDistribution: (row.stateDistribution as Record<string, number>) || undefined,
      currentFringe: (row.currentFringe as string[]) || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<DiagnosticSessionEntity | null> {
    const [row] = await db.select().from(diagnosticSessions).where(eq(diagnosticSessions.id, id));
    return row ? this.mapToEntity(row) : null;
  }

  async findActiveByUserAndWorkspace(userId: string, workspaceId: string): Promise<DiagnosticSessionEntity | null> {
    const [row] = await db
      .select()
      .from(diagnosticSessions)
      .where(
        and(
          eq(diagnosticSessions.userId, userId),
          eq(diagnosticSessions.workspaceId, workspaceId),
          eq(diagnosticSessions.status, 'in_progress')
        )
      )
      .orderBy(desc(diagnosticSessions.createdAt))
      .limit(1);

    return row ? this.mapToEntity(row) : null;
  }

  async create(data: CreateDiagnosticSessionData): Promise<DiagnosticSessionEntity> {
    const [row] = await db
      .insert(diagnosticSessions)
      .values({
        workspaceId: data.workspaceId,
        userId: data.userId,
        status: 'in_progress',
        probedItems: [],
        inferredMasteries: [],
        currentFringe: data.initialFringe || [],
      })
      .returning();

    return this.mapToEntity(row);
  }

  async update(session: DiagnosticSessionEntity): Promise<DiagnosticSessionEntity> {
    const [row] = await db
      .update(diagnosticSessions)
      .set({
        status: session.status,
        probedItems: session.probedItems,
        inferredMasteries: session.inferredMasteries,
        currentFringe: session.currentFringe,
        stateDistribution: session.props.stateDistribution,
        updatedAt: new Date(),
      })
      .where(eq(diagnosticSessions.id, session.id))
      .returning();

    return this.mapToEntity(row);
  }
}
