import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';
import { assertWorkspaceOwner, requirePermission } from '../middlewares/workspace-guard';

export const driftController = new Elysia({ prefix: '/api/v1/drift' })
  .get(
    '/audit/:workspaceId',
    async ({ headers, params, query, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      const ownership = await assertWorkspaceOwner(params.workspaceId, auth);
      if (!ownership.ok) {
        set.status = ownership.status;
        return { error: ownership.error };
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
      if (auth.role !== 'superadmin') {
        set.status = 403;
        return { error: 'Forbidden: Batch competency decay processing is restricted to superadmins' };
      }
      const perm = requirePermission(auth, 'drift:write');
      if (!perm.ok) {
        set.status = perm.status;
        return { error: perm.error };
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
      const perm = requirePermission(auth, 'drift:write');
      if (!perm.ok) {
        set.status = perm.status;
        return { error: perm.error };
      }
      const comp = await container.competencyRepository.findById(body.competencyId);
      if (!comp) {
        set.status = 404;
        return { error: 'Competency not found' };
      }
      const ownership = await assertWorkspaceOwner(comp.workspaceId, auth);
      if (!ownership.ok) {
        set.status = ownership.status;
        return { error: ownership.error };
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
