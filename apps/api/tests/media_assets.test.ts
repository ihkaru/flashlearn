import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { workspaceController } from '../src/infrastructure/http/controllers/workspace.controller';
import { mediaController } from '../src/infrastructure/http/controllers/media.controller';
import type {
  CreateMediaAssetInput,
  IMediaAssetRepository,
  IMediaBlobStore,
  StoredMediaAssetRow,
} from '../src/domain/ports/IMediaAssetStore';
import type { IWorkspaceRepository } from '../src/domain/ports/IWorkspaceRepository';
import {
  DeleteMediaAssetUseCase,
  GetMediaAssetUseCase,
  UploadMediaAssetUseCase,
} from '../src/application/use-cases/media/MediaAssetUseCases';
import { LocalVolumeMediaBlobStore } from '../src/infrastructure/storage/MediaBlobStores';

function createInMemoryMediaRepo(): IMediaAssetRepository {
  const rows = new Map<string, StoredMediaAssetRow>();
  let seq = 1;
  return {
    async findByWorkspaceAndSha(workspaceId, sha256) {
      return (
        Array.from(rows.values()).find((r) => r.workspaceId === workspaceId && r.sha256 === sha256) ||
        null
      );
    },
    async findById(id) {
      return rows.get(id) || null;
    },
    async listByWorkspace(workspaceId) {
      return Array.from(rows.values()).filter((r) => r.workspaceId === workspaceId);
    },
    async create(input: CreateMediaAssetInput) {
      const id = `00000000-0000-4000-8000-${String(seq++).padStart(12, '0')}`;
      const row: StoredMediaAssetRow = {
        id,
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
        createdAt: new Date().toISOString(),
      };
      rows.set(id, row);
      return row;
    },
    async deleteById(id) {
      return rows.delete(id);
    },
    async countReferencesBySha(sha256) {
      return Array.from(rows.values()).filter((r) => r.sha256 === sha256).length;
    },
  };
}

function createFakeWorkspaceRepo(): IWorkspaceRepository {
  const wsMap: Record<string, any> = {
    'ws-1': { id: 'ws-1', creatorId: 'creator-1', isPublic: true },
    'ws-2': { id: 'ws-2', creatorId: 'creator-1', isPublic: false },
  };
  return {
    findById: async (id: string) => wsMap[id] || null,
  } as unknown as IWorkspaceRepository;
}

function createStubRegistry(store: IMediaBlobStore) {
  return {
    activeDriver: store.driver,
    getActive: () => store,
    getByDriver: () => store,
  } as any;
}

describe('Phase 19 Persistent Content-Addressed Media Assets (Pluggable Storage)', () => {
  it('deduplicates identical blobs per workspace, serves immutable bytes, and performs reference-counted GC on delete', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'fl-blob-test-'));
    try {
      const localStore = new LocalVolumeMediaBlobStore(tmpDir);
      const repo = createInMemoryMediaRepo();
      const wsRepo = createFakeWorkspaceRepo();
      const registry = createStubRegistry(localStore);

      const uploader = new UploadMediaAssetUseCase(repo, wsRepo, registry);
      const getter = new GetMediaAssetUseCase(repo, wsRepo, registry);
      const deleter = new DeleteMediaAssetUseCase(repo, wsRepo, registry);

      const sampleWebp = new Uint8Array([82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80]);

      // First upload in ws-1
      const first = await uploader.execute('creator-1', 'creator', {
        workspaceId: 'ws-1',
        filename: 'fig-04-taps.webp',
        mimeType: 'image/webp',
        bytes: sampleWebp,
        sourcePage: 71,
        caption: 'Tabel 6 Tangga TAPs',
      });
      expect(first.deduplicated).toBe(false);
      expect(first.url).toBe(`/api/v1/assets/${first.id}`);

      // Identical upload in ws-1 deduplicates cleanly
      const dup = await uploader.execute('creator-1', 'creator', {
        workspaceId: 'ws-1',
        filename: 'fig-04-copy.webp',
        mimeType: 'image/webp',
        bytes: sampleWebp,
      });
      expect(dup.deduplicated).toBe(true);
      expect(dup.id).toBe(first.id);

      // Same bytes uploaded into ws-2 shares physical blob (2 refs)
      const secondWs = await uploader.execute('creator-1', 'creator', {
        workspaceId: 'ws-2',
        filename: 'fig-04-ws2.webp',
        mimeType: 'image/webp',
        bytes: sampleWebp,
      });
      expect(secondWs.id).not.toBe(first.id);
      expect(secondWs.sha256).toBe(first.sha256);

      // Public guest can read ws-1 asset, blocked from private ws-2 asset
      const fetched = await getter.execute(first.id);
      expect(fetched?.bytes).toEqual(sampleWebp);
      await expect(getter.execute(secondWs.id)).rejects.toThrow('Forbidden');

      // Deleting ws-1 keeps physical blob alive because ws-2 still references sha256
      const del1 = await deleter.execute('creator-1', 'creator', first.id);
      expect(del1.deleted).toBe(true);
      expect(del1.blobPurged).toBe(false);
      const stillReadableByOwner = await getter.execute(secondWs.id, 'creator-1', 'creator');
      expect(stillReadableByOwner?.bytes).toEqual(sampleWebp);

      // Deleting ws-2 purges physical blob once refcount drops to 0
      const del2 = await deleter.execute('creator-1', 'creator', secondWs.id);
      expect(del2.deleted).toBe(true);
      expect(del2.blobPurged).toBe(true);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('rejects unsupported MIME types and SVG payloads containing script tags or event handlers', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'fl-blob-sec-'));
    try {
      const localStore = new LocalVolumeMediaBlobStore(tmpDir);
      const uploader = new UploadMediaAssetUseCase(
        createInMemoryMediaRepo(),
        createFakeWorkspaceRepo(),
        createStubRegistry(localStore)
      );

      await expect(
        uploader.execute('creator-1', 'creator', {
          workspaceId: 'ws-1',
          filename: 'payload.html',
          mimeType: 'text/html',
          bytes: new TextEncoder().encode('<h1>nope</h1>'),
        })
      ).rejects.toThrow('Unsupported media type');

      await expect(
        uploader.execute('creator-1', 'creator', {
          workspaceId: 'ws-1',
          filename: 'evil.svg',
          mimeType: 'image/svg+xml',
          bytes: new TextEncoder().encode('<svg onload="alert(1)"><script>evil()</script></svg>'),
        })
      ).rejects.toThrow('Unsafe SVG rejected');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('mounts mediaController alongside workspaceController in Elysia without radix parameter conflict', () => {
    const app = new Elysia().use(workspaceController).use(mediaController);
    const routes = app.routes.map((r) => `${r.method} ${r.path}`);
    expect(routes).toContain('POST /api/v1/workspaces/:id/assets');
    expect(routes).toContain('GET /api/v1/workspaces/:id/assets');
    expect(routes).toContain('GET /api/v1/assets/:id');
    expect(routes).toContain('DELETE /api/v1/assets/:id');
  });
});
