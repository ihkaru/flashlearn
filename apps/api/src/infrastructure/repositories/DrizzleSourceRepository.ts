import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { db } from '../database/db';
import { sources, sourceChunks } from '../database/schema';
import { SourceEntity } from '../../domain/entities/Source';
import { SourceChunkEntity } from '../../domain/entities/SourceChunk';
import type {
  ISourceRepository,
  CreateSourceData,
  CreateSourceChunkData,
} from '../../domain/ports/ISourceRepository';
import type { SourceStatus } from '@flashlearn/shared';

export class DrizzleSourceRepository implements ISourceRepository {
  private mapSourceToEntity(row: typeof sources.$inferSelect, chunkCount = 0): SourceEntity {
    return new SourceEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      title: row.title,
      code: row.code,
      version: row.version,
      status: row.status as SourceStatus,
      owner: row.owner,
      effectiveDate: row.effectiveDate,
      chunkCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private mapChunkToEntity(row: typeof sourceChunks.$inferSelect): SourceChunkEntity {
    return new SourceChunkEntity({
      id: row.id,
      sourceId: row.sourceId,
      locationTag: row.locationTag,
      content: row.content,
      tokenCount: row.tokenCount,
      sha256Hash: row.sha256Hash,
      createdAt: row.createdAt,
    });
  }

  async findById(id: string): Promise<SourceEntity | null> {
    const [row] = await db.select().from(sources).where(eq(sources.id, id));
    if (!row) return null;

    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sourceChunks)
      .where(eq(sourceChunks.sourceId, id));

    return this.mapSourceToEntity(row, countRes[0]?.count || 0);
  }

  async findByCode(code: string): Promise<SourceEntity | null> {
    const [row] = await db.select().from(sources).where(eq(sources.code, code));
    if (!row) return null;

    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sourceChunks)
      .where(eq(sourceChunks.sourceId, row.id));

    return this.mapSourceToEntity(row, countRes[0]?.count || 0);
  }

  async listByWorkspace(workspaceId: string): Promise<SourceEntity[]> {
    const rows = await db
      .select({
        source: sources,
        chunkCount: sql<number>`count(${sourceChunks.id})::int`,
      })
      .from(sources)
      .leftJoin(sourceChunks, eq(sources.id, sourceChunks.sourceId))
      .where(eq(sources.workspaceId, workspaceId))
      .groupBy(sources.id)
      .orderBy(desc(sources.createdAt));

    return rows.map((r) => this.mapSourceToEntity(r.source, r.chunkCount));
  }

  async create(data: CreateSourceData): Promise<SourceEntity> {
    const [row] = await db
      .insert(sources)
      .values({
        workspaceId: data.workspaceId,
        title: data.title,
        code: data.code,
        version: data.version,
        status: data.status || 'active',
        owner: data.owner,
        effectiveDate: data.effectiveDate,
      })
      .returning();

    return this.mapSourceToEntity(row, 0);
  }

  async updateStatus(id: string, status: SourceStatus): Promise<SourceEntity | null> {
    const [row] = await db
      .update(sources)
      .set({ status, updatedAt: new Date() })
      .where(eq(sources.id, id))
      .returning();

    return row ? this.findById(id) : null;
  }

  async delete(id: string): Promise<boolean> {
    const [row] = await db.delete(sources).where(eq(sources.id, id)).returning();
    return !!row;
  }

  async insertChunks(chunks: CreateSourceChunkData[]): Promise<SourceChunkEntity[]> {
    if (chunks.length === 0) return [];

    const inserted = await db
      .insert(sourceChunks)
      .values(
        chunks.map((c) => ({
          sourceId: c.sourceId,
          locationTag: c.locationTag,
          content: c.content,
          tokenCount: c.tokenCount,
          sha256Hash: c.sha256Hash,
        }))
      )
      .returning();

    return inserted.map((row) => this.mapChunkToEntity(row));
  }

  async findChunk(sourceCode: string, locationTag: string): Promise<SourceChunkEntity | null> {
    const [row] = await db
      .select({ chunk: sourceChunks })
      .from(sourceChunks)
      .innerJoin(sources, eq(sourceChunks.sourceId, sources.id))
      .where(
        and(
          eq(sources.code, sourceCode),
          eq(sql`lower(${sourceChunks.locationTag})`, locationTag.toLowerCase().trim())
        )
      );

    return row ? this.mapChunkToEntity(row.chunk) : null;
  }

  async listChunksBySourceId(sourceId: string): Promise<SourceChunkEntity[]> {
    const rows = await db
      .select()
      .from(sourceChunks)
      .where(eq(sourceChunks.sourceId, sourceId))
      .orderBy(sourceChunks.locationTag);

    return rows.map((r) => this.mapChunkToEntity(r));
  }

  async searchChunks(workspaceId: string, query: string, limit = 10): Promise<SourceChunkEntity[]> {
    const rows = await db
      .select({ chunk: sourceChunks })
      .from(sourceChunks)
      .innerJoin(sources, eq(sourceChunks.sourceId, sources.id))
      .where(
        and(
          eq(sources.workspaceId, workspaceId),
          ilike(sourceChunks.content, `%${query}%`)
        )
      )
      .limit(limit);

    return rows.map((r) => this.mapChunkToEntity(r.chunk));
  }
}
