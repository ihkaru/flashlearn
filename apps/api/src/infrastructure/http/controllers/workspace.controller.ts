import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';
import { synthesizeDomainBlueprint } from '../../../../../packages/cli/src/core/domain-synthesizer';

export const workspaceController = new Elysia({ prefix: '/api/v1/workspaces' })
  .get(
    '/',
    async ({ headers, query }) => {
      const auth = await resolveAuth(headers);
      const scope = (query.scope as 'public' | 'mine' | 'all') || 'public';

      return await container.listWorkspacesUseCase.execute({
        userId: auth.user?.id,
        role: auth.role,
        scope,
      });
    },
    {
      query: t.Optional(
        t.Object({
          scope: t.Optional(
            t.Union([t.Literal('public'), t.Literal('mine'), t.Literal('all')], {
              description: 'Filter scope: public (guest/default), mine (creator), all (superadmin)',
            })
          ),
        })
      ),
      detail: {
        tags: ['Workspaces'],
        summary: 'List Workspaces',
        description:
          'Lists workspaces accessible by current role. Guests view public workspaces. Creators view their own and public workspaces. Superadmins can list all workspaces.',
      },
    }
  )
  .post(
    '/',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can create workspaces' };
      }

      try {
        const workspace = await container.createWorkspaceUseCase.execute(auth.user.id, body);
        set.status = 201;
        return workspace;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 3, description: 'Workspace name' }),
        slug: t.Optional(t.String({ description: 'Custom URL slug' })),
        description: t.Optional(t.String({ description: 'Workspace description' })),
        icon: t.Optional(t.String({ description: 'Emoji or icon symbol' })),
        isPublic: t.Optional(t.Boolean({ default: true, description: 'Public visibility flag' })),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Create Workspace',
        description: 'Creates a new workspace belonging to the authenticated creator or superadmin.',
      },
    }
  )
  .post(
    '/import-blueprint',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can import domain blueprints' };
      }

      try {
        const result = await container.importDomainBlueprintUseCase.execute(auth.user.id, body as any);
        set.status = 201;
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        version: t.String(),
        workspace: t.Object({
          name: t.String(),
          slug: t.Optional(t.String()),
          description: t.String(),
          icon: t.Optional(t.String()),
        }),
        sources: t.Array(t.Any()),
        competencies: t.Array(t.Any()),
        gates: t.Array(t.Any()),
        tasks: t.Optional(t.Array(t.Any())),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Import Universal Domain Blueprint',
        description: 'Declaratively imports full domain specification with sources, competency DAG, gates, and tasks.',
      },
    }
  )
  .post(
    '/synthesize-markdown',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can synthesize domains' };
      }

      if (!body.workspaceName || !body.markdownContent) {
        set.status = 400;
        return { error: 'workspaceName and markdownContent are required' };
      }

      try {
        const synthesis = synthesizeDomainBlueprint({
          workspaceName: body.workspaceName,
          markdownTexts: [{ text: body.markdownContent, title: body.workspaceName }],
          slug: body.slug,
        });

        const imported = await container.importDomainBlueprintUseCase.execute(
          auth.user.id,
          synthesis.blueprint
        );

        set.status = 201;
        return {
          success: true,
          workspaceId: imported.workspaceId,
          statistics: synthesis.statistics,
        };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        workspaceName: t.String(),
        markdownContent: t.String(),
        slug: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Synthesize and import domain from raw Markdown SOP regulation',
      },
    }
  )
  .get(
    '/:id',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      try {
        const workspace = await container.getWorkspaceByIdUseCase.execute(
          params.id,
          auth.user?.id,
          auth.role
        );
        if (!workspace) {
          set.status = 404;
          return { error: 'Workspace not found' };
        }
        return workspace;
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID or slug' }),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Get Workspace by ID or Slug',
        description: 'Fetches workspace details if public or if user has access privileges.',
      },
    }
  )
  .put(
    '/:id',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Authentication required' };
      }

      try {
        const updated = await container.updateWorkspaceUseCase.execute(
          params.id,
          auth.user.id,
          auth.role,
          body
        );
        return updated;
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID' }),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        icon: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Update Workspace',
        description:
          'Updates workspace details. Creators can only update their own workspaces. Superadmins can update any workspace.',
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

      try {
        const success = await container.deleteWorkspaceUseCase.execute(
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
        id: t.String({ description: 'Workspace UUID' }),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Delete Workspace',
        description:
          'Deletes a workspace. Creators can only delete their own workspaces. Superadmins can delete any workspace.',
      },
    }
  )
  .post(
    '/:id/rollback',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      try {
        const targetVersion = (body as any)?.versionNumber;
        return await container.rollbackWorkspaceUseCase.execute(
          params.id,
          auth.user.id,
          auth.role,
          targetVersion
        );
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID' }),
      }),
      body: t.Optional(
        t.Object({
          versionNumber: t.Optional(t.Integer({ description: 'Target version number' })),
        })
      ),
      detail: {
        tags: ['Workspaces'],
        summary: 'Rollback Workspace',
        description: 'Reverts workspace metadata to an earlier version snapshot.',
      },
    }
  )
  .post(
    '/:id/restore',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      try {
        return await container.restoreWorkspaceUseCase.execute(params.id, auth.user.id, auth.role);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID' }),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Restore Soft-Deleted Workspace',
        description: 'Recovers a soft-deleted workspace back to active status.',
      },
    }
  )
  .get(
    '/:id/describe',
    async ({ params, set }) => {
      try {
        return await container.describeDomainReadinessUseCase.execute(params.id);
      } catch (err: any) {
        set.status = 404;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID or unique slug' }),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Describe Domain Statistics, Gaps & Readiness for AI Agents',
        description: 'Comprehensive domain health check returning readiness score, statistics, completeness gaps, DAG integrity, and actionable CLI recommendations.',
      },
    }
  )
  .get(
    '/:id/diagnose',
    async ({ params, set }) => {
      try {
        return await container.describeDomainReadinessUseCase.execute(params.id);
      } catch (err: any) {
        set.status = 404;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID or unique slug' }),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Diagnose Domain (Alias for Describe)',
      },
    }
  );
