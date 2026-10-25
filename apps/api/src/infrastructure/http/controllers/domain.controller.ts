import { Elysia, t } from 'elysia';
import type { BaseContainer } from '../../di/base.container';
import { container } from '../../di/container';

export function createDomainController(container: BaseContainer) {
  return new Elysia({ prefix: '/api/v1/domains' })
    // List domains in workspace
    .get(
      '/workspace/:workspaceId',
      async ({ params }) => {
        const domainEntities = await container.domainRepository.listByWorkspace(params.workspaceId);
        return {
          workspaceId: params.workspaceId,
          total: domainEntities.length,
          domains: domainEntities.map((d) => d.toJSON()),
        };
      },
      {
        params: t.Object({
          workspaceId: t.String({ description: 'Workspace UUID' }),
        }),
      }
    )
    // Get single domain
    .get(
      '/:id',
      async ({ params, error }) => {
        const domainEntity = await container.domainRepository.findById(params.id);
        if (!domainEntity) {
          return error(404, { error: 'Domain not found' });
        }
        return domainEntity.toJSON();
      },
      {
        params: t.Object({
          id: t.String({ description: 'Domain UUID' }),
        }),
      }
    )
    // Create new domain
    .post(
      '/',
      async ({ body }) => {
        const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const created = await container.domainRepository.create({
          workspaceId: body.workspaceId,
          code: body.code,
          name: body.name,
          slug,
          description: body.description,
          targetRole: body.targetRole,
          responsibilityScope: body.responsibilityScope,
          legalAuthorityLevel: body.legalAuthorityLevel ?? 1,
          minPassingScore: body.minPassingScore ?? 80,
          icon: body.icon,
          coverImage: body.coverImage,
          status: body.status ?? 'active',
        });
        return created.toJSON();
      },
      {
        body: t.Object({
          workspaceId: t.String(),
          code: t.String({ minLength: 2 }),
          name: t.String({ minLength: 2 }),
          slug: t.Optional(t.String()),
          description: t.Optional(t.String()),
          targetRole: t.String({ minLength: 2 }),
          responsibilityScope: t.String({ minLength: 5 }),
          legalAuthorityLevel: t.Optional(t.Integer({ minimum: 1, maximum: 3 })),
          minPassingScore: t.Optional(t.Integer({ minimum: 50, maximum: 100 })),
          icon: t.Optional(t.String()),
          coverImage: t.Optional(t.String()),
          status: t.Optional(t.Union([t.Literal('draft'), t.Literal('active'), t.Literal('archived')])),
        }),
      }
    )
    // Update domain
    .patch(
      '/:id',
      async ({ params, body }) => {
        const updated = await container.domainRepository.update(params.id, body);
        return updated.toJSON();
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          code: t.Optional(t.String()),
          name: t.Optional(t.String()),
          slug: t.Optional(t.String()),
          description: t.Optional(t.String()),
          targetRole: t.Optional(t.String()),
          responsibilityScope: t.Optional(t.String()),
          legalAuthorityLevel: t.Optional(t.Integer({ minimum: 1, maximum: 3 })),
          minPassingScore: t.Optional(t.Integer()),
          icon: t.Optional(t.String()),
          coverImage: t.Optional(t.String()),
          status: t.Optional(t.Union([t.Literal('draft'), t.Literal('active'), t.Literal('archived')])),
        }),
      }
    )
    // Delete domain
    .delete(
      '/:id',
      async ({ params }) => {
        await container.domainRepository.delete(params.id);
        return { success: true, deletedId: params.id };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    );
}

export const domainController = createDomainController(container);
