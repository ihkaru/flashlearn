import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const diagnosticController = new Elysia({ prefix: '/api/v1/diagnostic' })
  .post(
    '/start',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required to start diagnostic placement' };
      }

      try {
        const result = await container.startDiagnosticSessionUseCase.execute(auth.user.id, body.workspaceId);
        set.status = 201;
        return {
          session: {
            id: result.session.id,
            workspaceId: result.session.workspaceId,
            userId: result.session.userId,
            status: result.session.status,
            inferredMasteries: result.session.inferredMasteries,
            currentFringe: result.session.currentFringe,
            probedCount: result.session.probedItems.length,
          },
          totalCompetencies: result.totalCompetencies,
          initialFringeCodes: result.initialFringeCodes,
        };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        workspaceId: t.String(),
      }),
      detail: {
        tags: ['Diagnostic Placement Engine'],
        summary: 'Start Adaptive Diagnostic Placement Session',
      },
    }
  )
  .get(
    '/:id/next',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      try {
        const result = await container.getNextDiagnosticProbeUseCase.execute(params.id);
        return {
          isComplete: result.isComplete,
          competencyId: result.competencyId,
          competencyCode: result.competencyCode,
          competencyTitle: result.competencyTitle,
          task: result.task
            ? {
                id: result.task.id,
                title: result.task.title,
                scenario: result.task.scenario,
                taskType: result.task.taskType,
                passingScore: result.task.passingScore,
              }
            : null,
          currentMasteriesCount: result.currentMasteriesCount,
          remainingUnmasteredCount: result.remainingUnmasteredCount,
          outerFringeCodes: result.outerFringeCodes,
        };
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
        tags: ['Diagnostic Placement Engine'],
        summary: 'Get Next Minimal-Entropy Diagnostic Probe',
      },
    }
  )
  .post(
    '/:id/submit',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      try {
        const result = await container.submitDiagnosticProbeUseCase.execute(params.id, body.submission);
        return {
          passed: result.passed,
          score: result.score,
          isComplete: result.isComplete,
          newlyInferredAncestors: result.newlyInferredAncestors,
          totalInferredMasteries: result.totalInferredMasteries,
          currentFringeCodes: result.currentFringeCodes,
          attemptFeedback: result.evaluation?.attempt?.feedback,
        };
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
        submission: t.Record(t.String(), t.Any()),
      }),
      detail: {
        tags: ['Diagnostic Placement Engine'],
        summary: 'Submit Solution for Current Diagnostic Probe',
      },
    }
  );
