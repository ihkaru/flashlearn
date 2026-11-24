import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';
import {
  assertWorkspaceOwner,
  assertWorkspaceReadable,
  isWorkspaceOwner,
  requirePermission,
} from '../middlewares/workspace-guard';

function serializeTaskForCaller(task: any, includeOracleSecrets: boolean) {
  const raw = typeof task.toJSON === 'function' ? task.toJSON() : { ...(task.props || task) };
  if (includeOracleSecrets) return raw;
  const { oracleData: _o, adversarialSpec: _a, ...safe } = raw;
  return safe;
}

export const taskController = new Elysia({ prefix: '/api/v1/tasks' })
  .get(
    '/',
    async ({ headers, query, set }) => {
      const competencyId = query.competencyId;
      if (!competencyId) {
        set.status = 400;
        return { error: 'competencyId query parameter is required' };
      }
      const comp = await container.competencyRepository.findById(competencyId);
      if (!comp) {
        set.status = 404;
        return { error: 'Competency not found' };
      }
      const auth = await resolveAuth(headers);
      const access = await assertWorkspaceReadable(comp.workspaceId, auth);
      if (!access.ok) {
        set.status = access.status;
        return { error: access.error };
      }
      const owner = await isWorkspaceOwner(comp.workspaceId, auth);
      const tasks = await container.taskRepository.listByCompetency(competencyId);
      return tasks.map((t: any) => serializeTaskForCaller(t, owner));
    },
    {
      query: t.Object({
        competencyId: t.String(),
      }),
      detail: {
        tags: ['Task Bank & Oracle'],
        summary: 'List Tasks by Competency',
      },
    }
  )
  .get(
    '/:id',
    async ({ headers, params, set }) => {
      const task = await container.taskRepository.findById(params.id);
      if (!task) {
        set.status = 404;
        return { error: 'Task not found' };
      }
      const comp = await container.competencyRepository.findById(task.competencyId);
      if (!comp) {
        set.status = 404;
        return { error: 'Competency not found' };
      }
      const auth = await resolveAuth(headers);
      const access = await assertWorkspaceReadable(comp.workspaceId, auth);
      if (!access.ok) {
        set.status = access.status;
        return { error: access.error };
      }
      const owner = await isWorkspaceOwner(comp.workspaceId, auth);
      return serializeTaskForCaller(task, owner);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Task Bank & Oracle'],
        summary: 'Get Task by ID',
      },
    }
  )
  .post(
    '/',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Creating tasks is restricted to creators and superadmins' };
      }
      const perm = requirePermission(auth, 'tasks:write');
      if (!perm.ok) {
        set.status = perm.status;
        return { error: perm.error };
      }
      const comp = await container.competencyRepository.findById(body.competencyId);
      if (!comp) {
        set.status = 404;
        return { error: 'Competency not found' };
      }
      const ownership = await assertWorkspaceOwner(comp.workspaceId, auth);
      if (!ownership.ok) {
        set.status = ownership.status;
        return { error: ownership.error };
      }

      try {
        const task = await container.createTaskUseCase.execute(body);
        set.status = 201;
        return typeof (task as any).toJSON === 'function' ? (task as any).toJSON() : (task as any).props || task;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        competencyId: t.String(),
        title: t.String({ minLength: 3 }),
        scenario: t.String({ minLength: 10 }),
        taskType: t.Union([
          t.Literal('calculation'),
          t.Literal('case_study'),
          t.Literal('document_draft'),
          t.Literal('checklist'),
          t.Literal('adversarial_dilemma'),
        ]),
        oracleData: t.Any(),
        adversarialSpec: t.Optional(t.Any()),
        rubricCriteria: t.Array(
          t.Object({
            id: t.String(),
            title: t.String(),
            weight: t.Integer({ minimum: 1 }),
            description: t.String(),
          })
        ),
        passingScore: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
      }),
      detail: {
        tags: ['Task Bank & Oracle'],
        summary: 'Create Task with Oracle Rubric',
      },
    }
  )
  .post(
    '/:id/submit',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required to submit task attempts' };
      }

      try {
        const submission = body.submission || body.submissionData || body;
        return await container.evaluateAttemptUseCase.execute(auth.user.id, {
          taskId: params.id,
          submission,
          isUnaided: body.isUnaided,
          aiHintsUsedCount: body.aiHintsUsedCount,
          isPractice: body.isPractice,
          conversationAudit: (body as any).conversationAudit,
        });
      } catch (err: any) {
        const msg = String(err?.message || err);
        set.status = msg.includes('AI_EVALUATOR_UNAVAILABLE') ? 503 : 400;
        return { error: msg };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        submission: t.Optional(t.Record(t.String(), t.Any())),
        submissionData: t.Optional(t.Record(t.String(), t.Any())),
        studentAnswerText: t.Optional(t.String()),
        isUnaided: t.Optional(t.Boolean()),
        aiHintsUsedCount: t.Optional(t.Integer({ minimum: 0 })),
        isPractice: t.Optional(t.Boolean()),
        conversationAudit: t.Optional(t.Any()),
      }),
      detail: {
        tags: ['Task Bank & Oracle'],
        summary: 'Submit Task for Multi-Tier Oracle Evaluation',
        description: 'Evaluates candidate submission against Oracle (Class A deterministic formula/checklist, Class B contrastive benchmark AI-judge). Unlocks downstream DAG nodes and generates instant 3D Flashcards on mistakes.',
      },
    }
  )
  .get(
    '/:id/attempts',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const task = await container.taskRepository.findById(params.id);
      if (!task) {
        set.status = 404;
        return { error: 'Task not found' };
      }
      const comp = await container.competencyRepository.findById(task.competencyId);
      const owner = comp
        ? await isWorkspaceOwner(comp.workspaceId, auth)
        : auth.role === 'superadmin';

      const attempts = await container.attemptRepository.listByTask(params.id);
      if (owner) return attempts;
      return attempts.filter((a: any) => a.userId === auth.user!.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['Task Bank & Oracle'],
        summary: 'List Attempts for Task',
      },
    }
  )
  .post(
    '/:id/socratic-hint',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Sign in required to consult Socratic Tutor' };
      }

      try {
        return await container.askSocraticTutorUseCase.execute(params.id, body);
      } catch (err: any) {
        const msg = String(err?.message || err);
        set.status = msg.includes('AI_TUTOR_UNAVAILABLE') || msg.includes('AI_GATEWAY_') ? 503 : 400;
        return { error: msg };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        question: t.String({ minLength: 3 }),
        conversationHistory: t.Optional(
          t.Array(
            t.Object({
              role: t.Union([t.Literal('user'), t.Literal('assistant')]),
              text: t.String(),
            })
          )
        ),
      }),
      detail: {
        tags: ['Task Bank & Oracle'],
        summary: 'Ask Socratic AI Tutor for Grounded In-Task Guidance',
        description: 'Provides pedagogical, reflective inquiry anchored strictly in the Corpus of Record while guarding Oracle solutions.',
      },
    }
  );
