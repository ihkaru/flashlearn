import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const competencyController = new Elysia({ prefix: '/api/v1/competencies' })
  .get(
    '/graph',
    async ({ headers, query, set }) => {
      const workspaceId = query.workspaceId;
      if (!workspaceId) {
        set.status = 400;
        return { error: 'workspaceId query parameter is required' };
      }

      const auth = await resolveAuth(headers);
      const userId = auth.user?.id || null;

      try {
        return await container.getCompetencyGraphUseCase.execute(workspaceId, userId, query.domainId || null);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      query: t.Object({
        workspaceId: t.String({ description: 'Workspace / Domain ID' }),
        domainId: t.Optional(t.String({ description: 'Optional Domain filter' })),
      }),
      detail: {
        tags: ['Competency & Mastery DAG'],
        summary: 'Get Workspace Competency DAG with Learner Progression',
        description: 'Returns the full directed graph of competencies with calculated user status (locked, ready, in_progress, mastered, stale) based on prerequisites.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, set }) => {
      const node = await container.competencyRepository.findById(params.id);
      if (!node) {
        set.status = 404;
        return { error: 'Competency node not found' };
      }
      return node;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Competency & Mastery DAG'],
        summary: 'Get Competency Node by ID',
      },
    }
  )
  .post(
    '/',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Creating competency nodes is restricted to creators and superadmins' };
      }

      try {
        const node = await container.createCompetencyNodeUseCase.execute(body);
        set.status = 201;
        return node;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        workspaceId: t.String(),
        sourceId: t.Optional(t.String()),
        code: t.String({ minLength: 2, description: 'Unique code e.g. HPS-001' }),
        title: t.String({ minLength: 3 }),
        description: t.String(),
        oracleClass: t.Union([t.Literal('A'), t.Literal('B'), t.Literal('C')]),
        riskLevel: t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')]),
        prerequisiteIds: t.Optional(t.Array(t.String())),
      }),
      detail: {
        tags: ['Competency & Mastery DAG'],
        summary: 'Create Competency Node',
        description: 'Defines a new competency node in the domain graph with oracle class and risk tier.',
      },
    }
  )
  .post(
    '/link-prerequisite',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Modifying graph prerequisites is restricted to creators and superadmins' };
      }

      try {
        return await container.linkPrerequisiteUseCase.execute(body);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        competencyId: t.String({ description: 'Target competency ID' }),
        prerequisiteId: t.String({ description: 'Prerequisite competency ID that must be mastered first' }),
      }),
      detail: {
        tags: ['Competency & Mastery DAG'],
        summary: 'Link Competency Prerequisite (DAG Edge)',
        description: 'Creates a directed dependency edge. Automatically performs cycle detection to prevent deadlocks.',
      },
    }
  )
  .post(
    '/:id/approve',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Approving competency nodes requires expert or superadmin role' };
      }

      try {
        return await container.approveCompetencyUseCase.execute(params.id, auth.user.id);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Competency & Mastery DAG'],
        summary: 'Expert Approval of Competency Node',
        description: 'Enforces human expert validation before a competency node is activated for certification.',
      },
    }
  )
  .post(
    '/:id/mastery',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required to update mastery status' };
      }

      try {
        return await container.masteryRepository.upsertStatus(
          auth.user.id,
          params.id,
          body.status,
          body.verifiedAttemptId
        );
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.Union([
          t.Literal('ready'),
          t.Literal('in_progress'),
          t.Literal('mastered'),
          t.Literal('stale'),
        ]),
        verifiedAttemptId: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Competency & Mastery DAG'],
        summary: 'Update Learner Mastery Status',
        description: 'Updates a learner mastery ledger entry for a competency node.',
      },
    }
  );
