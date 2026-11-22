import { and, desc, eq, sql } from 'drizzle-orm';
import type {
  CreateMediaAssetInput,
  IMediaAssetRepository,
  StoredMediaAssetRow,
} from '../../domain/ports/IMediaAssetStore';
import { db } from '../database/db';
import { mediaAssets } from '../database/schemas/media';

function mapRow(r: typeof mediaAssets.$inferSelect): StoredMediaAssetRow {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    sha256: r.sha256,
    filename: r.filename,
    mimeType: r.mimeType,
    byteSize: r.byteSize,
    width: r.width,
    height: r.height,
    storageDriver: r.storageDriver,
    storageKey: r.storageKey,
    sourceRef: r.sourceRef,
    sourcePage: r.sourcePage,
    caption: r.caption,
    altText: r.altText,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
  };
}

export class DrizzleMediaAssetRepository implements IMediaAssetRepository {
  async findByWorkspaceAndSha(workspaceId: string, sha256: string): Promise<StoredMediaAssetRow | null> {
    const rows = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.workspaceId, workspaceId), eq(mediaAssets.sha256, sha256)))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findById(id: string): Promise<StoredMediaAssetRow | null> {
    const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async listByWorkspace(workspaceId: string): Promise<StoredMediaAssetRow[]> {
    const rows = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.workspaceId, workspaceId))
      .orderBy(desc(mediaAssets.createdAt));
    return rows.map(mapRow);
  }

  async create(input: CreateMediaAssetInput): Promise<StoredMediaAssetRow> {
    const [row] = await db
      .insert(mediaAssets)
      .values({
        workspaceId: input.workspaceId,
        sha256: input.sha256,
        filename: input.filename,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        width: input.width ?? null,
        height: input.height ?? null,
        storageDriver: input.storageDriver,
        storageKey: input.storageKey,
        sourceRef: input.sourceRef ?? null,
        sourcePage: input.sourcePage ?? null,
        caption: input.caption ?? null,
        altText: input.altText ?? null,
        createdBy: input.createdBy ?? null,
      })
      .returning();
    return mapRow(row);
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await db
      .delete(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .returning({ id: mediaAssets.id });
    return deleted.length > 0;
  }

  async countReferencesBySha(sha256: string): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mediaAssets)
      .where(eq(mediaAssets.sha256, sha256));
    return rows[0]?.count ?? 0;
  }
}
