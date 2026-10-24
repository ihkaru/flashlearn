import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const credentialController = new Elysia({ prefix: '/api/v1/credentials' })
  .post(
    '/issue',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      try {
        const credential = await container.issueVerifiableCredentialUseCase.execute({
          gateId: body.gateId,
          userId: body.userId,
        });
        return { success: true, credential };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        gateId: t.String(),
        userId: t.String(),
      }),
      detail: {
        tags: ['Cryptographic Verifiable Credentials'],
        summary: 'Issue W3C VC 2.0 / OpenBadges 3.0 with Ed25519 DataIntegrityProof',
      },
    }
  )
  .post(
    '/verify',
    async ({ body, set }) => {
      try {
        const result = await container.verifyVerifiableCredentialUseCase.execute(
          body.credential,
          { publicKeyPem: body.publicKeyPem }
        );
        return result;
      } catch (err: any) {
        set.status = 400;
        return { valid: false, error: err.message };
      }
    },
    {
      body: t.Object({
        credential: t.Any(),
        publicKeyPem: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Cryptographic Verifiable Credentials'],
        summary: 'Mathematically verify Ed25519 signature on W3C Verifiable Credential',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const record = await container.credentialRepository.findCredentialById(params.id);
        if (!record) {
          set.status = 404;
          return { error: 'Credential not found' };
        }
        return record;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Cryptographic Verifiable Credentials'],
        summary: 'Retrieve Issued Verifiable Credential Record by ID',
      },
    }
  );
