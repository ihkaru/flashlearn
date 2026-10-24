import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const driftController = new Elysia({ prefix: '/api/v1/drift' })
  .get(
    '/audit/:workspaceId',
    async ({ headers, params, query, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      try {
        const threshold = query.threshold ? Number(query.threshold) : undefined;
        const report = await container.auditCompetencyDriftUseCase.execute(params.workspaceId, {
          threshold,
        });
        return report;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        workspaceId: t.String(),
      }),
      query: t.Object({
        threshold: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Predictive Competency Drift'],
        summary: 'Audit Competency Half-Life and Forgetting Curve Decay across Workspace',
      },
    }
  )
  .post(
    '/process-batch',
    async ({ headers, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      try {
        const result = await container.processCompetencyDecayBatchUseCase.execute();
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      detail: {
        tags: ['Predictive Competency Drift'],
        summary: 'Trigger Predictive Competency Drift Batch Decay Cycle',
      },
    }
  )
  .post(
    '/revalidate',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      try {
        const result = await container.revalidateCompetencyChallengeUseCase.execute({
          userId: body.userId,
          competencyId: body.competencyId,
          passed: body.passed,
          score: body.score,
        });
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        competencyId: t.String(),
        passed: t.Boolean(),
        score: t.Number(),
      }),
      detail: {
        tags: ['Predictive Competency Drift'],
        summary: 'Record Micro-Revalidation Challenge Defense and Stretch Stability',
      },
    }
  );
