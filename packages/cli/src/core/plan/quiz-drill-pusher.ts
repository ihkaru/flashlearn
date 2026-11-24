import type { PlanModuleEntry, QuizQuestion } from '@flashlearn/shared';
import type { ApiClient } from '../client';

export interface QuizDrillPushOptions {
  workspaceId: string;
  domainId?: string;
  mod: PlanModuleEntry;
  parsed: Record<string, any>;
  dryRun: boolean;
}

export interface QuizDrillDryRunResult {
  slug: string;
  unitCode: string;
  dryRun: true;
  contentType: 'quiz';
  questionCount: number;
  topicsCount: number;
  warnings: string[];
}

export interface QuizDrillLiveResult {
  contentId: string;
  action: 'created' | 'updated';
  contentType: 'quiz';
  questionCount: number;
  topicsCount: number;
}

export function isQuizDrillModule(mod: PlanModuleEntry, parsed: unknown): boolean {
  if (mod.contentType === 'quiz') return true;
  if (!parsed || typeof parsed !== 'object') return false;
  const obj = parsed as Record<string, unknown>;
  return obj.schemaVersion === 'quiz-drill-v1' || Array.isArray(obj.questions);
}

export function validateQuizDrillQuestions(rawQuestions: unknown, slug: string): QuizQuestion[] {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error(`Quiz module '${slug}' must contain a non-empty 'questions' array.`);
  }

  return rawQuestions.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Quiz '${slug}' question[${idx}] must be an object.`);
    }
    const q = item as Record<string, any>;
    if (typeof q.id !== 'string' || !q.id.trim()) {
      throw new Error(`Quiz '${slug}' question[${idx}] is missing a non-empty 'id'.`);
    }
    if (typeof q.question !== 'string' || !q.question.trim()) {
      throw new Error(`Quiz '${slug}' question[${idx}] (${q.id}) is missing a non-empty 'question'.`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Quiz '${slug}' question[${idx}] (${q.id}) must have at least 2 options.`);
    }
    const hasCorrect = q.options.some((opt: any) => opt && opt.isCorrect === true);
    if (!hasCorrect) {
      throw new Error(
        `Quiz '${slug}' question[${idx}] (${q.id}) must have at least 1 option with isCorrect: true.`
      );
    }
    if (typeof q.explanation !== 'string' || !q.explanation.trim()) {
      throw new Error(`Quiz '${slug}' question[${idx}] (${q.id}) is missing a non-empty 'explanation'.`);
    }

    return {
      id: q.id,
      question: q.question,
      options: q.options.map((opt: any) => ({
        id: String(opt.id),
        text: String(opt.text),
        isCorrect: Boolean(opt.isCorrect),
      })),
      explanation: q.explanation,
      ...(typeof q.hint === 'string' ? { hint: q.hint } : {}),
      ...(q.difficulty ? { difficulty: q.difficulty } : {}),
      ...(typeof q.topic === 'string' ? { topic: q.topic } : {}),
      ...(typeof q.sourceRef === 'string' ? { sourceRef: q.sourceRef } : {}),
    };
  });
}

export async function pushQuizDrillModule(
  client: ApiClient,
  opts: QuizDrillPushOptions
): Promise<QuizDrillDryRunResult | QuizDrillLiveResult> {
  const { workspaceId, domainId, mod, parsed, dryRun } = opts;
  const questions = validateQuizDrillQuestions(parsed.questions, mod.slug);
  const topicsCount = new Set(
    questions.map((q) => q.topic?.trim()).filter((t): t is string => Boolean(t))
  ).size;

  if (dryRun) {
    return {
      slug: mod.slug,
      unitCode: mod.unitCode,
      dryRun: true,
      contentType: 'quiz',
      questionCount: questions.length,
      topicsCount,
      warnings: [],
    };
  }

  const remoteList = await client
    .request<any[]>(`/api/v1/contents/workspace/${workspaceId}`)
    .catch(() => []);
  const activeRemote = (Array.isArray(remoteList) ? remoteList : []).filter(
    (c) => !c.deletedAt && c.status !== 'deleted'
  );
  const existing = activeRemote.find((c) => c.slug === mod.slug);

  const sharedFields = {
    type: 'quiz' as const,
    domainId,
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : mod.title,
    slug: mod.slug,
    summary:
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary
        : mod.notes || `Latihan interaktif ${questions.length} soal.`,
    readingTimeMinutes:
      typeof parsed.readingTimeMinutes === 'number'
        ? parsed.readingTimeMinutes
        : mod.estimatedMinutes,
    questions,
    isPublished: true,
  };

  if (existing?.id) {
    const updated = await client.request<any>(`/api/v1/contents/${existing.id}`, {
      method: 'PUT',
      body: sharedFields,
    });
    return {
      contentId: updated?.id || existing.id,
      action: 'updated',
      contentType: 'quiz',
      questionCount: questions.length,
      topicsCount,
    };
  }

  const created = await client.request<any>('/api/v1/contents', {
    method: 'POST',
    body: {
      workspaceId,
      ...sharedFields,
    },
  });

  return {
    contentId: created?.id,
    action: 'created',
    contentType: 'quiz',
    questionCount: questions.length,
    topicsCount,
  };
}
