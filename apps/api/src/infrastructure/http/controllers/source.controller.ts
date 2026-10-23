import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const sourceController = new Elysia({ prefix: '/api/v1/sources' })
  .get(
    '/',
    async ({ query, set }) => {
      const workspaceId = query.workspaceId;
      if (!workspaceId) {
        set.status = 400;
        return { error: 'workspaceId query parameter is required' };
      }
      return await container.sourceRepository.listByWorkspace(workspaceId);
    },
    {
      query: t.Object({
        workspaceId: t.String({ description: 'Workspace or Domain ID' }),
      }),
      detail: {
        tags: ['Corpus of Record (Sources)'],
        summary: 'List Sources by Workspace',
        description: 'Retrieves all official legal/SOP sources registered under a workspace.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, set }) => {
      const source = await container.sourceRepository.findById(params.id);
      if (!source) {
        set.status = 404;
        return { error: 'Source not found' };
      }
      return source;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Corpus of Record (Sources)'],
        summary: 'Get Source by ID',
      },
    }
  )
  .get(
    '/:id/chunks',
    async ({ params }) => {
      return await container.sourceRepository.listChunksBySourceId(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Corpus of Record (Sources)'],
        summary: 'List Addressable Chunks of a Source',
      },
    }
  )
  .post(
    '/',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Ingesting official sources is restricted to creators and superadmins' };
      }

      try {
        const result = await container.ingestSourceUseCase.execute(body);
        set.status = 201;
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        workspaceId: t.String(),
        title: t.String({ minLength: 3 }),
        code: t.String({ minLength: 3 }),
        version: t.Optional(t.String({ default: '1.0.0' })),
        owner: t.Optional(t.String({ default: 'Official Regulator' })),
        effectiveDate: t.Optional(t.String()),
        rawText: t.String({ minLength: 10 }),
      }),
      detail: {
        tags: ['Corpus of Record (Sources)'],
        summary: 'Ingest and Chunk Source Document',
        description: 'Ingests a legal text or SOP, parsing it into addressable chunks (Pasal/Ayat/Bab) with SHA-256 hashes.',
      },
    }
  )
  .post(
    '/validate-citations',
    async ({ body }) => {
      return await container.validateCitationsUseCase.execute(body.claims);
    },
    {
      body: t.Object({
        claims: t.Array(
          t.Object({
            claimText: t.String(),
            sourceCode: t.String(),
            locationTag: t.String(),
            directQuote: t.String(),
          })
        ),
      }),
      detail: {
        tags: ['Corpus of Record (Sources)'],
        summary: 'Deterministic Citation Verification',
        description: 'Checks claims strictly against stored source chunks. Rejects nonexistent chunks or mismatched verbatim quotes without calling LLMs.',
      },
    }
  )
  .post(
    '/generate-lesson',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Generating verified lessons is restricted to creators and superadmins' };
      }

      try {
        const result = await container.generateVerifiedLessonUseCase.execute(body);
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        workspaceId: t.String(),
        sourceCode: t.String(),
        topic: t.String({ minLength: 3 }),
      }),
      detail: {
        tags: ['Corpus of Record (Sources)'],
        summary: 'Generate Verified Lesson with Dual-Stage Pipeline',
        description: 'Calls AI Gateway to synthesize a lesson with citations, then runs deterministic verification on every claim before returning.',
      },
    }
  )
  .post(
    '/:id/supersede',
    async ({ params, body, headers, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Superseding a source is restricted to creators and superadmins' };
      }

      try {
        const report = await container.supersedeSourceUseCase.execute({
          sourceId: params.id,
          actorId: auth.user.id,
          reason: body?.reason,
        });
        return { success: true, data: report };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Optional(t.Object({ reason: t.Optional(t.String()) })),
      detail: {
        tags: ['Corpus of Record (Sources)'],
        summary: 'Mark Source Superseded and Trigger Staleness Cascade',
        description: 'Cascades staleness to dependent competencies, marks mastery as retest_required, and suspends gate grants.',
      },
    }
  );
