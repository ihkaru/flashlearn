import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const contentController = new Elysia({ prefix: '/api/v1/contents' })
  .get(
    '/workspace/:workspaceId',
    async ({ headers, params }) => {
      const auth = await resolveAuth(headers);
      return await container.listContentsUseCase.execute({
        workspaceId: params.workspaceId,
        userId: auth.user?.id,
        role: auth.role,
      });
    },
    {
      params: t.Object({
        workspaceId: t.String({ description: 'Workspace UUID' }),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'List Contents in Workspace',
        description: 'Lists contents inside a specific workspace.',
      },
    }
  )
  .post(
    '/',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can create contents' };
      }

      try {
        const content = await container.createContentUseCase.execute(
          auth.user.id,
          auth.role,
          body as any
        );
        set.status = 201;
        return content;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        workspaceId: t.String({ description: 'Target workspace UUID' }),
        title: t.String({ minLength: 3, description: 'Content title' }),
        slug: t.Optional(t.String()),
        type: t.Union([t.Literal('materi'), t.Literal('quiz'), t.Literal('combined')], {
          description: 'Type of content',
        }),
        summary: t.Optional(t.String()),
        readingTimeMinutes: t.Optional(t.Integer()),
        body: t.Optional(t.String({ description: 'Markdown body for materi & combined' })),
        questions: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              question: t.String(),
              options: t.Array(
                t.Object({
                  id: t.String(),
                  text: t.String(),
                  isCorrect: t.Optional(t.Boolean()),
                })
              ),
              explanation: t.String(),
              hint: t.Optional(t.String()),
              difficulty: t.Optional(
                t.Union([t.Literal('easy'), t.Literal('medium'), t.Literal('hard')])
              ),
            })
          )
        ),
        isPublished: t.Optional(t.Boolean({ default: true })),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Create Content (Materi, Quiz, or Combined)',
        description:
          'Creates a new educational content module in the target workspace. Can be materi-only, quiz-only, or combined.',
      },
    }
  )
  .get(
    '/:id',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      try {
        const content = await container.getContentByIdUseCase.execute(
          params.id,
          auth.user?.id,
          auth.role
        );
        if (!content) {
          set.status = 404;
          return { error: 'Content not found' };
        }
        return content;
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Content UUID' }),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Get Content by ID',
        description:
          'Retrieves content details. For learners/guests, correct answer indicators are scrubbed to prevent inspection tampering.',
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
        const updated = await container.updateContentUseCase.execute(
          params.id,
          auth.user.id,
          auth.role,
          body as any
        );
        return updated;
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Content UUID' }),
      }),
      body: t.Object({
        title: t.Optional(t.String()),
        slug: t.Optional(t.String()),
        type: t.Optional(
          t.Union([t.Literal('materi'), t.Literal('quiz'), t.Literal('combined')])
        ),
        summary: t.Optional(t.String()),
        readingTimeMinutes: t.Optional(t.Integer()),
        body: t.Optional(t.String()),
        questions: t.Optional(t.Array(t.Any())),
        isPublished: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Update Content',
        description: 'Updates an existing content item in a workspace.',
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
        const success = await container.deleteContentUseCase.execute(
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
        id: t.String({ description: 'Content UUID' }),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Delete Content',
        description: 'Deletes a content item.',
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
        return await container.rollbackContentUseCase.execute(
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
        id: t.String({ description: 'Content UUID' }),
      }),
      body: t.Optional(
        t.Object({
          versionNumber: t.Optional(t.Integer({ description: 'Target version number to rollback to' })),
        })
      ),
      detail: {
        tags: ['Contents'],
        summary: 'Rollback Content to Previous Version',
        description: 'Reverts content fields to an earlier version snapshot.',
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
        return await container.restoreContentUseCase.execute(params.id, auth.user.id, auth.role);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Content UUID' }),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Restore Soft-Deleted Content',
        description: 'Recovers a soft-deleted content item back to active status.',
      },
    }
  )
  .get(
    '/:id/versions',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      try {
        return await container.listContentVersionsUseCase.execute(params.id, auth.user.id, auth.role);
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Content UUID' }),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'List Content Version History',
        description: 'Returns historical snapshots and actions performed on this content.',
      },
    }
  );
