import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';
import {
  assertWorkspaceOwner,
  assertWorkspaceReadable,
  requirePermission,
} from '../middlewares/workspace-guard';

async function resolveAttemptWorkspaceId(attemptId: string): Promise<string | null> {
  const attempt = await container.attemptRepository.findById(attemptId);
  if (!attempt) return null;
  const task = await container.taskRepository.findById(attempt.taskId);
  if (!task) return null;
  const comp = await container.competencyRepository.findById(task.competencyId);
  return comp?.workspaceId || null;
}

export const consensusController = new Elysia({ prefix: '/api/v1/consensus' })
  .post(
    '/assign',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Authentication required to assign blind reviewers' };
      }
      const perm = requirePermission(auth, 'consensus:write');
      if (!perm.ok) {
        set.status = perm.status;
        return { error: perm.error };
      }
      const workspaceId = await resolveAttemptWorkspaceId(body.attemptId);
      if (!workspaceId) {
        set.status = 404;
        return { error: 'Attempt or associated workspace not found' };
      }
      const ownership = await assertWorkspaceOwner(workspaceId, auth);
      if (!ownership.ok) {
        set.status = ownership.status;
        return { error: ownership.error };
      }

      try {
        const result = await container.assignBlindReviewersUseCase.execute({
          attemptId: body.attemptId,
          primaryReviewerId: body.primaryReviewerId,
          secondaryReviewerId: body.secondaryReviewerId,
        });
        set.status = 201;
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        attemptId: t.String(),
        primaryReviewerId: t.String(),
        secondaryReviewerId: t.String(),
      }),
      detail: {
        tags: ['Multi-Rater Consensus'],
        summary: 'Assign Double-Blind Reviewers to Class C Attempt',
      },
    }
  )
  .get(
    '/review/:blindToken',
    async ({ params, set }) => {
      try {
        const result = await container.getBlindReviewByTokenUseCase.execute(params.blindToken);
        return result;
      } catch (err: any) {
        set.status = 404;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        blindToken: t.String(),
      }),
      detail: {
        tags: ['Multi-Rater Consensus'],
        summary: 'Get Sanitized Blind Review Item by Blind Token',
      },
    }
  )
  .post(
    '/review/:blindToken/submit',
    async ({ params, body, set }) => {
      try {
        const result = await container.submitBlindReviewUseCase.execute({
          blindToken: params.blindToken,
          rubricScores: body.rubricScores,
          totalScore: body.totalScore,
          notes: body.notes,
        });
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        blindToken: t.String(),
      }),
      body: t.Object({
        rubricScores: t.Record(t.String(), t.Number()),
        totalScore: t.Optional(t.Number()),
        notes: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Multi-Rater Consensus'],
        summary: 'Submit Blind Scorecard and Calculate Consensus',
      },
    }
  )
  .get(
    '/attempt/:attemptId/irr-report',
    async ({ headers, params, set }) => {
      const workspaceId = await resolveAttemptWorkspaceId(params.attemptId);
      if (!workspaceId) {
        set.status = 404;
        return { error: `Attempt '${params.attemptId}' not found` };
      }
      const auth = await resolveAuth(headers);
      const access = await assertWorkspaceReadable(workspaceId, auth);
      if (!access.ok) {
        set.status = access.status;
        return { error: access.error };
      }
      try {
        const record = await container.reviewRepository.findConsensusRecord(params.attemptId);
        if (!record) {
          set.status = 404;
          return { error: `No consensus evaluation record found for attempt '${params.attemptId}'` };
        }
        return record;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        attemptId: t.String(),
      }),
      detail: {
        tags: ['Multi-Rater Consensus'],
        summary: 'Get Inter-Rater Reliability Report for Attempt',
      },
    }
  )
  .post(
    '/arbitrate',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Authentication required to arbitrate disputed evaluation' };
      }
      const perm = requirePermission(auth, 'consensus:write');
      if (!perm.ok) {
        set.status = perm.status;
        return { error: perm.error };
      }
      const workspaceId = await resolveAttemptWorkspaceId(body.attemptId);
      if (!workspaceId) {
        set.status = 404;
        return { error: 'Attempt or associated workspace not found' };
      }
      const ownership = await assertWorkspaceOwner(workspaceId, auth);
      if (!ownership.ok) {
        set.status = ownership.status;
        return { error: ownership.error };
      }

      try {
        const arbiterId = auth.user.id;
        const result = await container.resolveArbitrationUseCase.execute({
          attemptId: body.attemptId,
          arbiterId,
          rubricScores: body.rubricScores,
          totalScore: body.totalScore,
          notes: body.notes,
        });
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        attemptId: t.String(),
        arbiterId: t.Optional(t.String()),
        rubricScores: t.Record(t.String(), t.Number()),
        totalScore: t.Number(),
        notes: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Multi-Rater Consensus'],
        summary: 'Resolve Disputed Evaluation via Chief Arbiter Scorecard',
      },
    }
  );
