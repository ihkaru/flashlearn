import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import type { MediaStorageDriver } from '@flashlearn/shared';
import type { IMediaBlobStore } from '../../domain/ports/IMediaAssetStore';
import { db } from '../database/db';
import { mediaAssetBlobs } from '../database/schemas/media';

const MIME_TO_EXT: Record<string, string> = {
  'image/webp': '.webp',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

/**
 * Default zero-config stateless blob store backed by dedicated PostgreSQL table `media_asset_blobs`.
 * Works reliably inside ephemeral containers without mandatory volume mounts and is backed up by pg_dump.
 */
export class PostgresMediaBlobStore implements IMediaBlobStore {
  public readonly driver: MediaStorageDriver = 'postgres';

  async put(sha256: string, bytes: Uint8Array, mimeType: string): Promise<string> {
    await db
      .insert(mediaAssetBlobs)
      .values({
        sha256,
        mimeType,
        byteSize: bytes.byteLength,
        data: bytes,
      })
      .onConflictDoNothing({ target: mediaAssetBlobs.sha256 });
    return sha256;
  }

  async get(storageKey: string, sha256: string): Promise<Uint8Array | null> {
    const key = storageKey || sha256;
    const rows = await db
      .select({ data: mediaAssetBlobs.data })
      .from(mediaAssetBlobs)
      .where(eq(mediaAssetBlobs.sha256, key))
      .limit(1);
    return rows[0]?.data || null;
  }

  async delete(storageKey: string, sha256: string): Promise<void> {
    const key = storageKey || sha256;
    await db.delete(mediaAssetBlobs).where(eq(mediaAssetBlobs.sha256, key));
  }
}

/**
 * Opt-in local filesystem / mounted Docker volume blob store.
 * Activated only when operator sets ASSET_STORAGE_DRIVER=local (and optional ASSET_STORAGE_DIR).
 */
export class LocalVolumeMediaBlobStore implements IMediaBlobStore {
  public readonly driver: MediaStorageDriver = 'local';
  private readonly rootDir: string;

  constructor(rootDir?: string) {
    this.rootDir = resolve(rootDir || process.env.ASSET_STORAGE_DIR || './data/assets');
  }

  async put(sha256: string, bytes: Uint8Array, mimeType: string, filename: string): Promise<string> {
    const ext = MIME_TO_EXT[mimeType] || extname(filename).toLowerCase() || '.bin';
    const relKey = join(sha256.slice(0, 2), `${sha256}${ext}`);
    const absPath = resolve(this.rootDir, relKey);
    if (!existsSync(absPath)) {
      mkdirSync(dirname(absPath), { recursive: true });
      writeFileSync(absPath, bytes);
    }
    return relKey;
  }

  async get(storageKey: string): Promise<Uint8Array | null> {
    const absPath = resolve(this.rootDir, storageKey);
    if (!absPath.startsWith(this.rootDir) || !existsSync(absPath)) return null;
    return new Uint8Array(readFileSync(absPath));
  }

  async delete(storageKey: string): Promise<void> {
    const absPath = resolve(this.rootDir, storageKey);
    if (absPath.startsWith(this.rootDir) && existsSync(absPath)) {
      unlinkSync(absPath);
    }
  }
}

/**
 * Opt-in external MediaVault blob store.
 * Never forced in upstream deployments; requires explicit ASSET_STORAGE_DRIVER=mediavault and MEDIAVAULT_URL.
 */
export class MediaVaultBlobStore implements IMediaBlobStore {
  public readonly driver: MediaStorageDriver = 'mediavault';
  private readonly vaultUrl: string;
  private readonly apiKey: string;
  private readonly appId: string;

  constructor(opts?: { vaultUrl?: string; apiKey?: string; appId?: string }) {
    const url = (opts?.vaultUrl || process.env.MEDIAVAULT_URL || '').trim().replace(/\/$/, '');
    if (!url) {
      throw new Error('ASSET_STORAGE_DRIVER=mediavault requires MEDIAVAULT_URL to be configured.');
    }
    this.vaultUrl = url;
    this.apiKey = (opts?.apiKey || process.env.MEDIAVAULT_API_KEY || '').trim();
    this.appId = (opts?.appId || process.env.MEDIAVAULT_APP_ID || 'flashlearn').trim();
  }

  async put(_sha256: string, bytes: Uint8Array, mimeType: string, filename: string): Promise<string> {
    const form = new FormData();
    form.append('file', new Blob([Buffer.from(bytes)], { type: mimeType }), filename);
    form.append('tags', 'flashlearn,media-asset');
    const headers: Record<string, string> = { 'X-App-ID': this.appId };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;

    const res = await fetch(`${this.vaultUrl}/api/v1/files/upload`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      throw new Error(`MediaVault upload failed with HTTP ${res.status}`);
    }
    const json: any = await res.json();
    const dlPath = json?.data?.download_url;
    if (typeof dlPath !== 'string' || !dlPath) {
      throw new Error('MediaVault response missing data.download_url');
    }
    return dlPath.startsWith('http') ? dlPath : `${this.vaultUrl}${dlPath}`;
  }

  async get(storageKey: string): Promise<Uint8Array | null> {
    const headers: Record<string, string> = { 'X-App-ID': this.appId };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    const res = await fetch(storageKey, { headers });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  }

  async delete(): Promise<void> {
    // External MediaVault lifecycle is managed independently by the vault service
  }
}

export class PluggableMediaBlobStoreRegistry {
  private readonly stores = new Map<MediaStorageDriver, IMediaBlobStore>();
  public readonly activeDriver: MediaStorageDriver;

  constructor(defaultDriver?: MediaStorageDriver) {
    const envDriver = (defaultDriver || process.env.ASSET_STORAGE_DRIVER || 'postgres')
      .toLowerCase()
      .trim() as MediaStorageDriver;

    this.stores.set('postgres', new PostgresMediaBlobStore());
    this.stores.set('local', new LocalVolumeMediaBlobStore());

    if (envDriver === 'mediavault' && process.env.MEDIAVAULT_URL?.trim()) {
      this.stores.set('mediavault', new MediaVaultBlobStore());
      this.activeDriver = 'mediavault';
    } else if (envDriver === 'local') {
      this.activeDriver = 'local';
    } else {
      this.activeDriver = 'postgres';
    }
  }

  public getActive(): IMediaBlobStore {
    return this.stores.get(this.activeDriver)!;
  }

  public getByDriver(driver: MediaStorageDriver): IMediaBlobStore | null {
    if (driver === 'mediavault' && !this.stores.has('mediavault') && process.env.MEDIAVAULT_URL?.trim()) {
      this.stores.set('mediavault', new MediaVaultBlobStore());
    }
    return this.stores.get(driver) || null;
  }
}
