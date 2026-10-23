import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const quizController = new Elysia({ prefix: '/api/v1/contents' })
  .post(
    '/:id/check-name',
    async ({ params, body }) => {
      return await container.checkGuestNameUseCase.execute(params.id, body.name);
    },
    {
      params: t.Object({
        id: t.String({ description: 'Content UUID' }),
      }),
      body: t.Object({
        name: t.String({ description: 'Candidate guest name' }),
      }),
      detail: {
        tags: ['Quiz & Flashcards'],
        summary: 'Check Guest Name Disambiguation',
        description: 'Checks if guest name is already taken in this quiz and suggests a disambiguated suffix.',
      },
    }
  )
  .post(
    '/:id/submit-quiz',
    async ({ params, body, set }) => {
      try {
        const result = await container.submitQuizUseCase.execute(params.id, body);
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Content UUID with quiz' }),
      }),
      body: t.Object({
        guestName: t.String({ minLength: 2, description: 'Participant name (required, min 2 chars)' }),
        answers: t.Array(
          t.Object({
            questionId: t.String(),
            selectedOptionId: t.String(),
          })
        ),
      }),
      detail: {
        tags: ['Quiz & Flashcards'],
        summary: 'Submit Quiz Answers',
        description:
          'Submits user answers to the quiz, validates correct choices, and returns score percentage with detailed feedback.',
      },
    }
  )
  .get(
    '/:id/flashcards',
    async ({ params, set }) => {
      try {
        const flashcards = await container.generateFlashcardsUseCase.execute(params.id);
        return flashcards;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Content UUID with quiz' }),
      }),
      detail: {
        tags: ['Quiz & Flashcards'],
        summary: 'Generate Post-Quiz 3D Flashcards',
        description:
          'Converts the quiz questions of the content into interactive flashcards for instant post-quiz active recall revision.',
      },
    }
  )
  .get(
    '/:id/submissions',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      try {
        return await container.getSubmissionsUseCase.execute(params.id, auth.user.id, auth.role);
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
        tags: ['Quiz & Flashcards'],
        summary: 'List Quiz Submissions',
        description: 'Returns list of participant attempts for creator review and analytics.',
      },
    }
  )
  .get(
    '/:id/export',
    async ({ headers, params, query, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      try {
        const format = (query.format as 'xlsx' | 'csv') || 'xlsx';
        const result = await container.exportSubmissionsUseCase.execute(
          params.id,
          auth.user.id,
          auth.role,
          format
        );

        set.headers['Content-Type'] = result.mimeType;
        set.headers['Content-Disposition'] = `attachment; filename="${result.filename}"`;
        return result.buffer;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Content UUID' }),
      }),
      query: t.Optional(
        t.Object({
          format: t.Optional(t.Union([t.Literal('xlsx'), t.Literal('csv')])),
        })
      ),
      detail: {
        tags: ['Quiz & Flashcards'],
        summary: 'Export Quiz Submissions to Excel/CSV',
        description:
          'Downloads a formatted Excel (.xlsx) spreadsheet or CSV file containing 1 row per participant attempt with full timestamps.',
      },
    }
  );
