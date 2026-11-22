import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const mediaController = new Elysia({ prefix: '/api/v1' })
  .post(
    '/workspaces/:id/assets',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can upload media assets' };
      }

      const file = body.file;
      if (!file || typeof file.arrayBuffer !== 'function') {
        set.status = 400;
        return { error: 'Missing multipart field "file"' };
      }

      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const record = await container.uploadMediaAssetUseCase.execute(auth.user.id, auth.role, {
          workspaceId: params.id,
          filename: file.name || 'figure.webp',
          mimeType: file.type || 'application/octet-stream',
          bytes,
          width: body.width ? Number(body.width) : null,
          height: body.height ? Number(body.height) : null,
          sourceRef: body.sourceRef || null,
          sourcePage: body.sourcePage ? Number(body.sourcePage) : null,
          caption: body.caption || null,
          altText: body.altText || null,
        });
        set.status = record.deduplicated ? 200 : 201;
        return record;
      } catch (err: any) {
        set.status = err.message?.startsWith('Forbidden') ? 403 : 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        file: t.File(),
        caption: t.Optional(t.String()),
        altText: t.Optional(t.String()),
        sourceRef: t.Optional(t.String()),
        sourcePage: t.Optional(t.Union([t.String(), t.Number()])),
        width: t.Optional(t.Union([t.String(), t.Number()])),
        height: t.Optional(t.Union([t.String(), t.Number()])),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Upload Persistent Workspace Media Asset (Content-Addressed)',
        description:
          'Uploads an image/diagram asset scoped to a workspace with sha256 deduplication and pluggable storage backend (stateless PostgreSQL default, optional local volume or MediaVault).',
      },
    }
  )
  .get(
    '/workspaces/:id/assets',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      try {
        return await container.listMediaAssetsUseCase.execute(
          params.id,
          auth.user?.id,
          auth.role
        );
      } catch (err: any) {
        set.status = err.message?.startsWith('Forbidden') ? 403 : 404;
        return { error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ['Workspaces'],
        summary: 'List Persistent Media Assets in Workspace',
      },
    }
  )
  .get(
    '/assets/:id',
    async ({ headers, params, set }) => {
      if (!UUID_RE.test(params.id)) {
        set.status = 404;
        return { error: 'Media asset not found' };
      }

      const auth = await resolveAuth(headers);
      try {
        const result = await container.getMediaAssetUseCase.execute(
          params.id,
          auth.user?.id,
          auth.role
        );
        if (!result) {
          set.status = 404;
          return { error: 'Media asset not found' };
        }

        const etag = `"${result.asset.sha256}"`;
        const ifNoneMatch = headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch.replace(/^W\//, '') === etag) {
          return new Response(null, {
            status: 304,
            headers: {
              ETag: etag,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }

        const contentHeaders: Record<string, string> = {
          'Content-Type': result.asset.mimeType,
          'Content-Length': String(result.bytes.byteLength),
          ETag: etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        };
        if (result.asset.mimeType === 'image/svg+xml') {
          contentHeaders['Content-Security-Policy'] = "default-src 'none'; sandbox";
        }

        return new Response(Buffer.from(result.bytes), {
          status: 200,
          headers: contentHeaders,
        });
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Serve Persistent Media Asset Binary (Immutable Cached)',
      },
    }
  )
  .delete(
    '/assets/:id',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can delete media assets' };
      }
      try {
        return await container.deleteMediaAssetUseCase.execute(auth.user.id, auth.role, params.id);
      } catch (err: any) {
        set.status = err.message?.startsWith('Forbidden') ? 403 : 404;
        return { error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Delete Media Asset (Reference-Counted Blob GC)',
      },
    }
  );
