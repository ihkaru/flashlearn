import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const reviewerController = new Elysia({ prefix: '/api/v1/reviewer' })
  .get('/pending', async ({ headers, set }) => {
    const auth = await resolveAuth(headers);
    if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
      set.status = 403;
      return { success: false, error: 'Access denied: Expert reviewer credentials required' };
    }

    try {
      const items = await container.listPendingClassCReviewsUseCase.execute();
      return { success: true, data: items };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  })
  .post(
    '/evaluate',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { success: false, error: 'Access denied: Expert reviewer credentials required' };
      }

      try {
        const updated = await container.reviewClassCAttemptUseCase.execute(auth.user.id, {
          attemptId: body.attemptId,
          passed: body.passed,
          rubricScores: body.rubricScores,
          expertNotes: body.expertNotes,
        });

        return { success: true, data: updated };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        attemptId: t.String(),
        passed: t.Boolean(),
        rubricScores: t.Array(
          t.Object({
            criterionId: t.String(),
            scoreAwarded: t.Number(),
            maxScore: t.Number(),
            feedback: t.String(),
          })
        ),
        expertNotes: t.String(),
      }),
    }
  );
