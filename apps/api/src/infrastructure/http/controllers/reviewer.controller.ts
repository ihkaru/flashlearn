import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';
import {
  assertWorkspaceOwner,
  isWorkspaceOwner,
  requirePermission,
} from '../middlewares/workspace-guard';

export const reviewerController = new Elysia({ prefix: '/api/v1/reviewer' })
  .get('/pending', async ({ headers, set }) => {
    const auth = await resolveAuth(headers);
    if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
      set.status = 403;
      return { success: false, error: 'Access denied: Expert reviewer credentials required' };
    }

    try {
      const items = await container.listPendingClassCReviewsUseCase.execute();
      if (auth.role === 'superadmin') {
        return { success: true, data: items };
      }

      const ownershipCache = new Map<string, boolean>();
      const filtered = [];
      for (const item of items) {
        if (!item.workspaceId) continue;
        let owned = ownershipCache.get(item.workspaceId);
        if (owned === undefined) {
          owned = await isWorkspaceOwner(item.workspaceId, auth);
          ownershipCache.set(item.workspaceId, owned);
        }
        if (owned) filtered.push(item);
      }
      return { success: true, data: filtered };
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
      const perm = requirePermission(auth, 'reviews:write');
      if (!perm.ok) {
        set.status = perm.status;
        return { success: false, error: perm.error };
      }

      const attempt = await container.attemptRepository.findById(body.attemptId);
      if (!attempt) {
        set.status = 404;
        return { success: false, error: 'Attempt not found' };
      }
      if (attempt.userId === auth.user.id) {
        set.status = 403;
        return { success: false, error: 'Forbidden: Self-review is strictly prohibited' };
      }
      const task = await container.taskRepository.findById(attempt.taskId);
      const competency = task ? await container.competencyRepository.findById(task.competencyId) : null;
      if (!competency) {
        set.status = 404;
        return { success: false, error: 'Associated competency not found' };
      }
      const ownership = await assertWorkspaceOwner(competency.workspaceId, auth);
      if (!ownership.ok) {
        set.status = ownership.status;
        return { success: false, error: ownership.error };
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
