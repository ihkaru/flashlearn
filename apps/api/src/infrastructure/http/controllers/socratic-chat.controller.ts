import { Elysia, t } from 'elysia';
import { createHash } from 'node:crypto';
import type { Container } from '../../di/container';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function buildContextualSystemPrompt(context?: {
  phase?: string;
  workspaceName?: string;
  taskTitle?: string;
  scenario?: string;
  competencyCode?: string;
  competencyTitle?: string;
}): string {
  const phase = context?.phase || 'general';
  return `You are FlashLearn's grounded Socratic Learning Coach.
Active phase: ${phase}.
Workspace: ${context?.workspaceName || 'General'}.
Competency: ${context?.competencyCode ? `${context.competencyCode} - ` : ''}${context?.competencyTitle || 'N/A'}.
Task: ${context?.taskTitle || 'N/A'}.
${context?.scenario ? `Scenario:\n${context.scenario}\n` : ''}
Rules:
1. Respond concisely in Indonesian unless the learner asks in English.
2. Guide reasoning through Socratic questions, structured principles, and operational risk analysis.
3. NEVER leak direct exam answers, raw oracle numbers, or bypass procedural compliance.`;
}

export function createSocraticChatController(appContainer: Container) {
  return new Elysia({ prefix: '/api/v1/socratic' })
    .get(
      '/session/:id',
      async ({ params, set }) => {
        const session = await appContainer.socraticChatRepository.findSessionById(params.id);
        if (!session) {
          set.status = 404;
          return { error: 'Socratic chat session not found' };
        }
        return session;
      },
      {
        params: t.Object({ id: t.String() }),
      }
    )
    .get(
      '/active',
      async ({ query, set }) => {
        if (!query.userId) {
          set.status = 400;
          return { error: 'userId is required' };
        }
        const session = await appContainer.socraticChatRepository.findActiveSession(
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
    .post(
      '/turn',
      async ({ body, set }) => {
        let session = body.sessionId
          ? await appContainer.socraticChatRepository.findSessionById(body.sessionId)
          : null;

        if (!session) {
          session = await appContainer.socraticChatRepository.createSession({
            userId: body.userId,
            workspaceId: body.workspaceId,
            domainId: body.domainId ?? null,
            taskId: body.taskId ?? null,
          });
        }

        const priorHistory = (session.turns || []).slice(-8).map((turn) => ({
          role: (turn.sender === 'learner' ? 'user' : 'assistant') as 'user' | 'assistant',
          text: turn.message,
        }));

        const currentTurnCount = session.turnCount || 0;
        const learnerTurnIndex = currentTurnCount + 1;
        const learnerHash = sha256Hex(
          `${session.id}:${learnerTurnIndex}:learner:${body.userMessage}:${session.merkleRoot ?? 'GENESIS'}`
        );

        const learnerTurn = await appContainer.socraticChatRepository.appendTurn({
          sessionId: session.id,
          turnIndex: learnerTurnIndex,
          sender: 'learner',
          message: body.userMessage,
          turnHash: learnerHash,
          antiSpoilerBlocked: false,
          citedChunkIds: [],
        });

        let tutorMessage = '';
        const citedChunkIds: string[] = [];

        try {
          if (body.taskId) {
            const socraticResult = await appContainer.askSocraticTutorUseCase.execute(body.taskId, {
              question: body.userMessage,
              conversationHistory: priorHistory,
            });
            tutorMessage = socraticResult.socraticGuidance;
            if (socraticResult.reflectiveQuestion) {
              tutorMessage += `\n\nPertanyaan Reflektif:\n${socraticResult.reflectiveQuestion}`;
            }
            if (socraticResult.citationReferences?.length) {
              const refs = socraticResult.citationReferences
                .map((c) => `- ${c.sourceCode} (${c.locationTag}): ${c.relevantPrinciple}`)
                .join('\n');
              tutorMessage += `\n\nRujukan Resmi:\n${refs}`;
            }
            if (socraticResult.suggestedAction) {
              tutorMessage += `\n\nLangkah Lanjut: ${socraticResult.suggestedAction}`;
            }
          } else {
            tutorMessage = await appContainer.aiGateway.chat(body.userMessage, {
              systemPrompt: buildContextualSystemPrompt(),
              messages: priorHistory.map((m) => ({ role: m.role, content: m.text })),
              model: process.env.AI_SMART_MODEL || process.env.AI_DEFAULT_MODEL || 'my9model-free',
            });
          }
        } catch (err: any) {
          set.status = 503;
          return {
            error: `AI_TUTOR_UNAVAILABLE: ${err?.message || 'Gagal menghubungi AI Gateway'}`,
          };
        }

        const tutorTurnIndex = learnerTurnIndex + 1;
        const tutorHash = sha256Hex(
          `${session.id}:${tutorTurnIndex}:socratic_tutor:${tutorMessage}:${learnerHash}`
        );

        const tutorTurn = await appContainer.socraticChatRepository.appendTurn({
          sessionId: session.id,
          turnIndex: tutorTurnIndex,
          sender: 'socratic_tutor',
          message: tutorMessage,
          turnHash: tutorHash,
          antiSpoilerBlocked: false,
          citedChunkIds,
        });

        const newMerkleRoot = sha256Hex(`${learnerHash}:${tutorHash}`);
        await appContainer.socraticChatRepository.updateSessionMerkleRoot(
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
    )
    .post(
      '/chat',
      async ({ headers, body, set }) => {
        const auth = await resolveAuth(headers);
        if (!auth.user) {
          set.status = 401;
          return { error: 'Unauthorized: Sign in required to consult AI Tutor' };
        }

        try {
          const history = (body.conversationHistory || []).slice(-8).map((m) => ({
            role: m.role,
            content: m.text,
          }));
          const reply = await appContainer.aiGateway.chat(body.message, {
            systemPrompt: buildContextualSystemPrompt(body.context),
            messages: history,
            model: process.env.AI_SMART_MODEL || process.env.AI_DEFAULT_MODEL || 'my9model-free',
          });
          return {
            reply,
            model: process.env.AI_SMART_MODEL || process.env.AI_DEFAULT_MODEL || 'my9model-free',
          };
        } catch (err: any) {
          set.status = 503;
          return { error: `AI_TUTOR_UNAVAILABLE: ${err?.message || String(err)}` };
        }
      },
      {
        body: t.Object({
          message: t.String({ minLength: 1 }),
          conversationHistory: t.Optional(
            t.Array(
              t.Object({
                role: t.Union([t.Literal('user'), t.Literal('assistant')]),
                text: t.String(),
              })
            )
          ),
          context: t.Optional(
            t.Object({
              phase: t.Optional(t.String()),
              workspaceName: t.Optional(t.String()),
              taskTitle: t.Optional(t.String()),
              scenario: t.Optional(t.String()),
              competencyCode: t.Optional(t.String()),
              competencyTitle: t.Optional(t.String()),
            })
          ),
        }),
      }
    )
    .post(
      '/stream',
      async ({ headers, body, set }) => {
        const auth = await resolveAuth(headers);
        if (!auth.user) {
          set.status = 401;
          return { error: 'Unauthorized: Sign in required to stream AI Tutor' };
        }

        const aiGateway = appContainer.aiGateway;
        if (!aiGateway.chatStream) {
          set.status = 501;
          return { error: 'AI_STREAM_UNSUPPORTED: Configured AI Gateway does not implement streaming' };
        }

        const history = (body.conversationHistory || []).slice(-8).map((m) => ({
          role: m.role,
          content: m.text,
        }));
        const streamIter = aiGateway.chatStream(body.message, {
          systemPrompt: buildContextualSystemPrompt(body.context),
          messages: history,
          model: process.env.AI_SMART_MODEL || process.env.AI_DEFAULT_MODEL || 'my9model-free',
        });

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamIter) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } catch (err: any) {
              controller.enqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify({ error: err?.message || String(err) })}\n\n`
                )
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',
          },
        });
      },
      {
        body: t.Object({
          message: t.String({ minLength: 1 }),
          conversationHistory: t.Optional(
            t.Array(
              t.Object({
                role: t.Union([t.Literal('user'), t.Literal('assistant')]),
                text: t.String(),
              })
            )
          ),
          context: t.Optional(
            t.Object({
              phase: t.Optional(t.String()),
              workspaceName: t.Optional(t.String()),
              taskTitle: t.Optional(t.String()),
              scenario: t.Optional(t.String()),
              competencyCode: t.Optional(t.String()),
              competencyTitle: t.Optional(t.String()),
            })
          ),
        }),
      }
    );
}

export const socraticChatController = createSocraticChatController(container);
