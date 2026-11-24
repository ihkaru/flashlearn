import { createHash } from 'node:crypto';
import type { MediaAssetRecord } from '@flashlearn/shared';
import type {
  IMediaAssetRepository,
  StoredMediaAssetRow,
} from '../../../domain/ports/IMediaAssetStore';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { PluggableMediaBlobStoreRegistry } from '../../../infrastructure/storage/MediaBlobStores';

const ALLOWED_IMAGE_MIMES = new Set([
  'image/webp',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
]);

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function verifyImageMagicBytes(mime: string, bytes: Uint8Array): boolean {
  if (mime === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mime === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === 'image/gif') {
    return (
      bytes.length >= 6 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61
    );
  }
  if (mime === 'image/webp') {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  if (mime === 'image/svg+xml') {
    const head = new TextDecoder().decode(bytes.slice(0, 512));
    return /<svg\b/i.test(head);
  }
  return false;
}

function sanitizeFilename(raw: string): string {
  const base = raw.split(/[\\/]/).pop() || 'asset.bin';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'asset.bin';
}

function toPublicRecord(row: StoredMediaAssetRow, deduplicated?: boolean): MediaAssetRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    sha256: row.sha256,
    filename: row.filename,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
    width: row.width,
    height: row.height,
    storageDriver: row.storageDriver,
    sourceRef: row.sourceRef,
    sourcePage: row.sourcePage,
    caption: row.caption,
    altText: row.altText,
    url: `/api/v1/assets/${row.id}`,
    ...(deduplicated !== undefined ? { deduplicated } : {}),
    createdAt: row.createdAt,
  };
}

export class UploadMediaAssetUseCase {
  constructor(
    private readonly mediaRepo: IMediaAssetRepository,
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly blobRegistry: PluggableMediaBlobStoreRegistry
  ) {}

  async execute(
    userId: string,
    role: string,
    input: {
      workspaceId: string;
      filename: string;
      mimeType: string;
      bytes: Uint8Array;
      width?: number | null;
      height?: number | null;
      sourceRef?: string | null;
      sourcePage?: number | null;
      caption?: string | null;
      altText?: string | null;
    }
  ): Promise<MediaAssetRecord> {
    const ws = await this.workspaceRepo.findById(input.workspaceId);
    if (!ws) throw new Error('Workspace not found');
    if (role !== 'superadmin' && ws.creatorId !== userId) {
      throw new Error('Forbidden: You do not own this workspace');
    }

    const mime = (input.mimeType || '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_IMAGE_MIMES.has(mime)) {
      throw new Error(`Unsupported media type "${mime}". Allowed: webp, png, jpeg, gif, svg.`);
    }

    const maxBytes = Number(process.env.ASSET_MAX_BYTES) || DEFAULT_MAX_BYTES;
    if (input.bytes.byteLength === 0 || input.bytes.byteLength > maxBytes) {
      throw new Error(`Asset byte size must be between 1 byte and ${Math.round(maxBytes / (1024 * 1024))} MB.`);
    }

    if (mime === 'image/svg+xml') {
      const svgText = new TextDecoder().decode(input.bytes);
      if (/<script\b|javascript:|on[a-z]+\s*=/i.test(svgText)) {
        throw new Error('Unsafe SVG rejected: script tags or inline event handlers are not allowed.');
      }
    }

    if (!verifyImageMagicBytes(mime, input.bytes)) {
      throw new Error(`Invalid file signature: bytes do not match declared MIME type "${mime}".`);
    }

    const sha256 = createHash('sha256').update(input.bytes).digest('hex');
    const existing = await this.mediaRepo.findByWorkspaceAndSha(input.workspaceId, sha256);
    if (existing) {
      return toPublicRecord(existing, true);
    }

    const cleanName = sanitizeFilename(input.filename);
    const store = this.blobRegistry.getActive();
    const storageKey = await store.put(sha256, input.bytes, mime, cleanName);

    const created = await this.mediaRepo.create({
      workspaceId: input.workspaceId,
      sha256,
      filename: cleanName,
      mimeType: mime,
      byteSize: input.bytes.byteLength,
      width: input.width ?? null,
      height: input.height ?? null,
      storageDriver: store.driver,
      storageKey,
      sourceRef: input.sourceRef ?? null,
      sourcePage: input.sourcePage ?? null,
      caption: input.caption ?? null,
      altText: input.altText ?? null,
      createdBy: userId,
    });

    return toPublicRecord(created, false);
  }
}

export class GetMediaAssetUseCase {
  constructor(
    private readonly mediaRepo: IMediaAssetRepository,
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly blobRegistry: PluggableMediaBlobStoreRegistry
  ) {}

  async execute(
    assetId: string,
    userId?: string,
    role?: string
  ): Promise<{ asset: MediaAssetRecord; bytes: Uint8Array; isPublic: boolean } | null> {
    const row = await this.mediaRepo.findById(assetId);
    if (!row) return null;

    const ws = await this.workspaceRepo.findById(row.workspaceId);
    if (!ws) return null;
    if (!ws.isPublic && role !== 'superadmin' && ws.creatorId !== userId) {
      throw new Error('Forbidden: Private workspace media asset');
    }

    const store = this.blobRegistry.getByDriver(row.storageDriver) || this.blobRegistry.getActive();
    const bytes = await store.get(row.storageKey, row.sha256);
    if (!bytes) return null;

    return { asset: toPublicRecord(row), bytes, isPublic: Boolean(ws.isPublic) };
  }
}

export class ListMediaAssetsUseCase {
  constructor(
    private readonly mediaRepo: IMediaAssetRepository,
    private readonly workspaceRepo: IWorkspaceRepository
  ) {}

  async execute(workspaceId: string, userId?: string, role?: string): Promise<MediaAssetRecord[]> {
    const ws = await this.workspaceRepo.findById(workspaceId);
    if (!ws) throw new Error('Workspace not found');
    if (!ws.isPublic && role !== 'superadmin' && ws.creatorId !== userId) {
      throw new Error('Forbidden: Private workspace');
    }
    const rows = await this.mediaRepo.listByWorkspace(workspaceId);
    return rows.map((r) => toPublicRecord(r));
  }
}

export class DeleteMediaAssetUseCase {
  constructor(
    private readonly mediaRepo: IMediaAssetRepository,
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly blobRegistry: PluggableMediaBlobStoreRegistry
  ) {}

  async execute(
    userId: string,
    role: string,
    assetId: string
  ): Promise<{ deleted: boolean; blobPurged: boolean; id: string }> {
    const row = await this.mediaRepo.findById(assetId);
    if (!row) throw new Error('Media asset not found');

    const ws = await this.workspaceRepo.findById(row.workspaceId);
    if (!ws) throw new Error('Workspace not found');
    if (role !== 'superadmin' && ws.creatorId !== userId) {
      throw new Error('Forbidden: You do not own this workspace');
    }

    await this.mediaRepo.deleteById(assetId);
    const remainingRefs = await this.mediaRepo.countReferencesBySha(row.sha256);
    let blobPurged = false;
    if (remainingRefs === 0) {
      const store = this.blobRegistry.getByDriver(row.storageDriver);
      if (store) {
        await store.delete(row.storageKey, row.sha256);
        blobPurged = true;
      }
    }

    return { deleted: true, blobPurged, id: assetId };
  }
}
