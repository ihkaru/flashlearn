import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const gateController = new Elysia({ prefix: '/api/v1/gates' })
  .post(
    '/',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { success: false, error: 'Only workspace admins can create authorization gates' };
      }

      try {
        const gate = await container.createGateUseCase.execute({
          workspaceId: body.workspaceId,
          level: body.level as any,
          title: body.title,
          description: body.description,
          requirements: body.requirements,
        });

        return { success: true, data: gate };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        workspaceId: t.String(),
        level: t.Number({ minimum: 0, maximum: 3 }),
        title: t.String(),
        description: t.String(),
        requirements: t.Optional(
          t.Array(
            t.Object({
              competencyId: t.String(),
              minimumScore: t.Number({ minimum: 0, maximum: 100 }),
              requiresHumanApproval: t.Boolean(),
            })
          )
        ),
      }),
    }
  )
  .get(
    '/workspace/:workspaceId',
    async ({ params, set }) => {
      try {
        const gates = await container.gateRepository.listByWorkspace(params.workspaceId);
        return { success: true, data: gates };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ workspaceId: t.String() }),
    }
  )
  .post(
    '/:gateId/grant',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { success: false, error: 'Authentication required' };
      }

      try {
        const result = await container.evaluateAndGrantGateUseCase.execute(
          auth.user.id,
          params.gateId,
          auth.user.id
        );

        if (!result.granted) {
          set.status = 422;
          return {
            success: false,
            error: 'Kriteria kenaikan wewenang belum terpenuhi',
            details: result.eligibility,
          };
        }

        return { success: true, data: result.grant, eligibility: result.eligibility };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ gateId: t.String() }),
    }
  )
  .get('/passports', async ({ headers, set }) => {
    const auth = await resolveAuth(headers);
    if (!auth.user) {
      set.status = 401;
      return { success: false, error: 'Authentication required' };
    }
    const grants = await container.gateRepository.listGrantsByUser(auth.user.id);
    return { success: true, data: grants };
  })
  .get(
    '/verify/:grantId',
    async ({ params, set }) => {
      try {
        const passport = await container.verifyPublicPassportUseCase.execute(params.grantId);
        return { success: true, data: passport };
      } catch (err: any) {
        set.status = 404;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ grantId: t.String() }),
      detail: {
        tags: ['Progressive Authorization Gates'],
        summary: 'Public Verification Endpoint for Digital Authority Passport',
        description: 'Open endpoint to verify passport authenticity, validity, and scope of authority without authentication.',
      },
    }
  );
