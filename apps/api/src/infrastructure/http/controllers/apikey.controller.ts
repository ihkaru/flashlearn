import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/workspace-guard';

export const apiKeyController = new Elysia({ prefix: '/api/v1/api-keys' })
  .get(
    '/',
    async ({ headers, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: API key management is reserved for creators and superadmins' };
      }
      const perm = requirePermission(auth, 'apikeys:manage');
      if (!perm.ok) {
        set.status = perm.status;
        return { error: perm.error };
      }

      return await container.listApiKeysUseCase.execute(auth.user.id, auth.role);
    },
    {
      detail: {
        tags: ['API Keys'],
        summary: 'List API Keys',
        description:
          'Lists active API keys created by the current user, or all keys if superadmin.',
      },
    }
  )
  .post(
    '/',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: API key generation is reserved for creators and superadmins' };
      }
      const perm = requirePermission(auth, 'apikeys:manage');
      if (!perm.ok) {
        set.status = perm.status;
        return { error: perm.error };
      }

      try {
        const result = await container.createApiKeyUseCase.execute(auth.user.id, body);
        set.status = 201;
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, description: 'Descriptive name for this key' }),
        permissions: t.Optional(t.Array(t.String(), { default: ['*'] })),
        expiresInDays: t.Optional(t.Integer({ minimum: 0, description: 'Expiry duration in days (0 or omit for never)' })),
      }),
      detail: {
        tags: ['API Keys'],
        summary: 'Generate New Scoped API Key',
        description:
          'Generates a new secret API key prefixed with fl_live_... and stores its SHA-256 hash. The plaintext key is returned only once.',
      },
    }
  )
  .delete(
    '/:id',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Authentication required' };
      }
      const perm = requirePermission(auth, 'apikeys:manage');
      if (!perm.ok) {
        set.status = perm.status;
        return { error: perm.error };
      }

      try {
        const success = await container.revokeApiKeyUseCase.execute(
          params.id,
          auth.user.id,
          auth.role
        );
        return { success };
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'API Key UUID' }),
      }),
      detail: {
        tags: ['API Keys'],
        summary: 'Revoke API Key',
        description: 'Permanently deletes and revokes an API key.',
      },
    }
  );
