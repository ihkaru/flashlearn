import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const spacedController = new Elysia({ prefix: '/api/v1/spaced' })
  .get('/due', async ({ headers, set }) => {
    const auth = await resolveAuth(headers);
    if (!auth.user) {
      set.status = 401;
      return { success: false, error: 'Authentication required' };
    }
    const cards = await container.getDueSpacedCardsUseCase.execute(auth.user.id);
    return { success: true, data: cards };
  })
  .post(
    '/:id/practice',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { success: false, error: 'Authentication required' };
      }

      try {
        const card = await container.practiceSpacedCardUseCase.execute({
          cardId: params.id,
          userId: auth.user.id,
          quality: body.quality,
        });

        return { success: true, data: card };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        quality: t.Number({ minimum: 0, maximum: 5 }),
      }),
    }
  );
