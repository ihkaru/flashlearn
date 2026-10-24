import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const auditController = new Elysia({ prefix: '/api/v1/audit' })
  .get(
    '/logs',
    async ({ headers, query, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Authentication required to inspect audit logs' };
      }

      const workspaceId = query.workspaceId;
      if (!workspaceId) {
        set.status = 400;
        return { error: 'workspaceId query parameter is required' };
      }

      try {
        return await container.auditLogRepository.listByWorkspace(workspaceId, query.limit ?? 50);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      query: t.Object({
        workspaceId: t.String(),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 500 })),
      }),
      detail: {
        tags: ['Audit & Compliance'],
        summary: 'List Append-Only Audit Logs for Workspace',
      },
    }
  )
  .get(
    '/bundle',
    async ({ headers, query, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Exporting audit compliance bundles is restricted to creators and superadmins' };
      }

      const workspaceId = query.workspaceId;
      if (!workspaceId) {
        set.status = 400;
        return { error: 'workspaceId query parameter is required' };
      }

      try {
        return await container.exportAuditBundleUseCase.execute(workspaceId);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      query: t.Object({
        workspaceId: t.String(),
      }),
      detail: {
        tags: ['Audit & Compliance'],
        summary: 'Export Tamper-Evident Regulatory Compliance Bundle',
      },
    }
  );
