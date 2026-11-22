import { Elysia, t } from 'elysia';
import type { ContentArtifactKind } from '@flashlearn/shared';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

function resolveSessionKey(
  headers: Record<string, string | undefined>,
  query?: Record<string, string | undefined>,
  bodySessionKey?: string
): string | undefined {
  const fromHeader = headers['x-learner-session'];
  const raw = bodySessionKey || fromHeader || query?.sessionKey;
  if (!raw || raw.trim().length < 6) return undefined;
  return raw.trim().slice(0, 128);
}

export const interactiveController = new Elysia({ prefix: '/api/v1/contents' })
  .get(
    '/resume/recent',
    async ({ headers, query }) => {
      const auth = await resolveAuth(headers);
      const sessionKey = resolveSessionKey(headers, query as any);
      const limit = query?.limit ? Math.min(20, Math.max(1, Number(query.limit))) : 6;
      return await container.getLearnerProgressUseCase.listRecent(
        { userId: auth.user?.id, sessionKey },
        limit
      );
    },
    {
      detail: {
        tags: ['Contents'],
        summary: 'List Recent Resumable Learning Sessions',
        description: 'Returns the learner most recently accessed modules for one-tap resume.',
      },
    }
  )
  .get(
    '/workspace/:workspaceId/progress',
    async ({ headers, params, query }) => {
      const auth = await resolveAuth(headers);
      const sessionKey = resolveSessionKey(headers, query as any);
      return await container.getLearnerProgressUseCase.listForWorkspace(params.workspaceId, {
        userId: auth.user?.id,
        sessionKey,
      });
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      detail: {
        tags: ['Contents'],
        summary: 'List Learner Progress for Workspace Contents',
      },
    }
  )
  .put(
    '/:id/artifacts/:kind',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can upload content artifacts' };
      }

      try {
        const result = await container.upsertContentArtifactUseCase.execute(auth.user.id, auth.role, {
          contentId: params.id,
          kind: params.kind as ContentArtifactKind,
          htmlContent: body.htmlContent,
          mimeType: body.mimeType,
          metadata: body.metadata as any,
        });
        return result;
      } catch (err: any) {
        set.status = err.message?.startsWith('Forbidden') ? 403 : 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
        kind: t.Union([t.Literal('slide_deck_html'), t.Literal('anchoring_sim_html')]),
      }),
      body: t.Object({
        htmlContent: t.String({ minLength: 20 }),
        mimeType: t.Optional(t.String()),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Upload or Replace Sandboxed HTML Artifact (Slide Deck / Micro-Sim)',
      },
    }
  )
  .get(
    '/:id/artifacts/:kind',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      try {
        const artifact = await container.getContentArtifactUseCase.execute(
          params.id,
          params.kind as ContentArtifactKind,
          auth.user?.id,
          auth.role
        );
        if (!artifact) {
          set.status = 404;
          return { error: 'Content artifact not found' };
        }
        return artifact;
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
        kind: t.Union([t.Literal('slide_deck_html'), t.Literal('anchoring_sim_html')]),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Lazy-Load Sandboxed HTML Artifact',
      },
    }
  )
  .delete(
    '/:id/artifacts/:kind',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can delete content artifacts' };
      }
      try {
        return await container.deleteContentArtifactUseCase.execute(
          auth.user.id,
          auth.role,
          params.id,
          params.kind as ContentArtifactKind
        );
      } catch (err: any) {
        set.status = err.message?.startsWith('Forbidden') ? 403 : 404;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
        kind: t.Union([t.Literal('slide_deck_html'), t.Literal('anchoring_sim_html')]),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Delete Sandboxed HTML Artifact (Slide Deck / Micro-Sim)',
      },
    }
  )
  .get(
    '/:id/progress',
    async ({ headers, params, query }) => {
      const auth = await resolveAuth(headers);
      const sessionKey = resolveSessionKey(headers, query as any);
      const progress = await container.getLearnerProgressUseCase.getForContent(params.id, {
        userId: auth.user?.id,
        sessionKey,
      });
      return progress || { contentId: params.id, notStarted: true };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ['Contents'],
        summary: 'Get Saved Learning Progress for Seamless Resume',
      },
    }
  )
  .put(
    '/:id/progress',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      const sessionKey = resolveSessionKey(headers, undefined, body.sessionKey);
      if (!auth.user && !sessionKey) {
        set.status = 400;
        return { error: 'Provide either Authorization token or x-learner-session / sessionKey' };
      }

      try {
        return await container.saveLearnerProgressUseCase.execute(
          params.id,
          { userId: auth.user?.id, sessionKey },
          body as any
        );
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        sessionKey: t.Optional(t.String()),
        currentStepIndex: t.Integer({ minimum: 0 }),
        totalSteps: t.Integer({ minimum: 1 }),
        currentSlideIndex: t.Integer({ minimum: 0 }),
        completedStepIds: t.Array(t.String()),
        anchoringCompleted: t.Boolean(),
        diagnosticAttempts: t.Integer({ minimum: 0 }),
        lastLossScore: t.Optional(t.Union([t.Number(), t.Null()])),
        lossVector: t.Optional(t.Any()),
        thetaMastery: t.Number({ minimum: 0, maximum: 1 }),
        isCompleted: t.Boolean(),
        incrementStepsToday: t.Optional(t.Integer({ minimum: 0 })),
        incrementProbesToday: t.Optional(t.Integer({ minimum: 0 })),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Auto-Save Learner Guided Step, Slide & Diagnostic Progress',
      },
    }
  );
