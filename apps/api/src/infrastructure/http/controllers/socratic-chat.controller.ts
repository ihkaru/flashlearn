import { Elysia, t } from 'elysia';
import { createHash } from 'node:crypto';
import type { BaseContainer } from '../../di/base.container';
import { container } from '../../di/container';

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function createSocraticChatController(container: BaseContainer) {
  return new Elysia({ prefix: '/api/v1/socratic' })
    // Get session by ID
    .get(
      '/session/:id',
      async ({ params, error }) => {
        const session = await container.socraticChatRepository.findSessionById(params.id);
        if (!session) {
          return error(404, { error: 'Socratic chat session not found' });
        }
        return session;
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    )
    // Get active session for user
    .get(
      '/active',
      async ({ query, error }) => {
        if (!query.userId) {
          return error(400, { error: 'userId is required' });
        }
        const session = await container.socraticChatRepository.findActiveSession(
          query.userId,
          query.taskId || null
        );
        return session || { active: false };
      },
      {
        query: t.Object({
          userId: t.String(),
          taskId: t.Optional(t.String()),
        }),
      }
    )
    // Append turn to Socratic session
    .post(
      '/turn',
      async ({ body, error }) => {
        let session = body.sessionId
          ? await container.socraticChatRepository.findSessionById(body.sessionId)
          : null;

        if (!session) {
          session = await container.socraticChatRepository.createSession({
            userId: body.userId,
            workspaceId: body.workspaceId,
            domainId: body.domainId ?? null,
            taskId: body.taskId ?? null,
          });
        }

        const currentTurnCount = session.turnCount || 0;

        // 1. Compute Learner Turn Hash
        const learnerTurnIndex = currentTurnCount + 1;
        const learnerHash = sha256Hex(
          `${session.id}:${learnerTurnIndex}:learner:${body.userMessage}:${session.merkleRoot ?? 'GENESIS'}`
        );

        const learnerTurn = await container.socraticChatRepository.appendTurn({
          sessionId: session.id,
          turnIndex: learnerTurnIndex,
          sender: 'learner',
          message: body.userMessage,
          turnHash: learnerHash,
          antiSpoilerBlocked: false,
          citedChunkIds: [],
        });

        // 2. Generate Socratic Guidance Response
        let tutorMessage = '';
        let citedChunkIds: string[] = [];
        let antiSpoilerBlocked = false;

        if (body.taskId) {
          try {
            const socraticResult = await container.askSocraticTutorUseCase.execute(body.taskId, {
              userQuery: body.userMessage,
              previousHints: [],
            });
            tutorMessage = socraticResult.reflectiveQuestion;
            if (socraticResult.relevantPasal) {
              tutorMessage += `\n\n📌 *Rujukan Resmi:* ${socraticResult.relevantPasal}`;
            }
            if (socraticResult.antiSpoilerBlocked) {
              antiSpoilerBlocked = true;
            }
          } catch (err: any) {
            tutorMessage =
              'Mari telaah kembali prinsip dasar pada modul terkait. Bagaimana klausul regulasi mendefinisikan tanggung jawab ini?';
          }
        } else {
          tutorMessage =
            'Pertanyaan bagus. Untuk memahami kewenangan ini, perhatikan bagaimana regulasi menetapkan batasan peran dan akuntabilitas penanggung jawab.';
        }

        // 3. Compute Tutor Turn Hash & Merkle Root
        const tutorTurnIndex = learnerTurnIndex + 1;
        const tutorHash = sha256Hex(
          `${session.id}:${tutorTurnIndex}:socratic_tutor:${tutorMessage}:${learnerHash}`
        );

        const tutorTurn = await container.socraticChatRepository.appendTurn({
          sessionId: session.id,
          turnIndex: tutorTurnIndex,
          sender: 'socratic_tutor',
          message: tutorMessage,
          turnHash: tutorHash,
          antiSpoilerBlocked,
          citedChunkIds,
        });

        // Compute new Merkle root for the transcript pair
        const newMerkleRoot = sha256Hex(`${learnerHash}:${tutorHash}`);
        await container.socraticChatRepository.updateSessionMerkleRoot(
          session.id,
          newMerkleRoot,
          tutorTurnIndex
        );

        session.merkleRoot = newMerkleRoot;
        session.turnCount = tutorTurnIndex;

        return {
          session,
          learnerTurn,
          tutorTurn,
          merkleRoot: newMerkleRoot,
        };
      },
      {
        body: t.Object({
          sessionId: t.Optional(t.String()),
          userId: t.String(),
          workspaceId: t.String(),
          domainId: t.Optional(t.String()),
          taskId: t.Optional(t.String()),
          userMessage: t.String({ minLength: 1 }),
        }),
      }
    );
}

export const socraticChatController = createSocraticChatController(container);
