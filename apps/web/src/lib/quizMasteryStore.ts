import type { FlashcardItem, QuizQuestion } from '@flashlearn/shared';

export type ConfidenceLevel = 'sure' | 'unsure' | 'guess';
export type MasteryStatus = 'mastered' | 'review';
export type MasteryFilter = 'all' | 'unmastered' | 'review';

export interface QuestionMasteryEntry {
  status: MasteryStatus;
  attempts: number;
  lastConfidence?: ConfidenceLevel;
  updatedAt: number;
}

export type QuizMasteryMap = Record<string, QuestionMasteryEntry>;

export type DrillQuestion = QuizQuestion & {
  topic?: string;
  sourceRef?: string;
};

export type DrillFlashcard = FlashcardItem & {
  topic?: string;
  sourceRef?: string;
};

export interface DrillSelectionOptions {
  size: number | 'all';
  topic: string;
  masteryFilter: MasteryFilter;
  shuffle: boolean;
  masteryMap: QuizMasteryMap;
}

const STORAGE_PREFIX = 'fl_quiz_mastery_v1:';

export function getMasteryMap(contentId: string): QuizMasteryMap {
  if (typeof localStorage === 'undefined' || !contentId) return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${contentId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as QuizMasteryMap) : {};
  } catch {
    return {};
  }
}

export function recordQuestionMastery(
  contentId: string,
  questionId: string,
  isCorrect: boolean,
  confidence?: ConfidenceLevel
): QuizMasteryMap {
  const current = getMasteryMap(contentId);
  const prev = current[questionId];
  const updated: QuizMasteryMap = {
    ...current,
    [questionId]: {
      status: isCorrect ? 'mastered' : 'review',
      attempts: (prev?.attempts ?? 0) + 1,
      lastConfidence: confidence ?? prev?.lastConfidence,
      updatedAt: Date.now(),
    },
  };
  if (typeof localStorage !== 'undefined' && contentId) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${contentId}`, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }
  return updated;
}

export function extractDistinctTopics(items: Array<{ topic?: string }>): string[] {
  const seen = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const t = items[i]?.topic?.trim();
    if (t) seen.add(t);
  }
  return Array.from(seen);
}

export function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function selectDrillQuestions<T extends { id: string; questionId?: string; topic?: string }>(
  items: T[],
  opts: DrillSelectionOptions
): T[] {
  const { size, topic, masteryFilter, shuffle, masteryMap } = opts;
  const filtered: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (topic && topic !== 'all' && item.topic?.trim() !== topic) continue;

    if (masteryFilter !== 'all') {
      const key = item.questionId || item.id;
      const entry = masteryMap[key];
      if (masteryFilter === 'unmastered' && entry?.status === 'mastered') continue;
      if (masteryFilter === 'review' && entry?.status !== 'review') continue;
    }
    filtered.push(item);
  }

  const ordered = shuffle ? fisherYatesShuffle(filtered) : filtered;
  if (size === 'all' || size <= 0 || size >= ordered.length) return ordered;
  return ordered.slice(0, size);
}

export function getCalibrationInsight(
  confidence: ConfidenceLevel | null,
  isCorrect: boolean
): string | null {
  if (!confidence) return null;
  if (confidence === 'sure' && !isCorrect) {
    return 'Miskonsepsi terlalu yakin — tinjau kembali konsep dasarnya.';
  }
  if (confidence === 'guess' && isCorrect) {
    return 'Tebakan beruntung — pelajari penjelasannya agar konsep benar-benar melekat.';
  }
  if (confidence === 'unsure' && isCorrect) {
    return 'Pemahaman mulai terbentuk — ulangi lewat Flashcard agar semakin mantap.';
  }
  if (confidence === 'sure' && isCorrect) {
    return 'Kalibrasi akurat — pemahaman pada soal ini sudah solid.';
  }
  return null;
}

export function getDifficultyBadge(d?: string): { text: string; bg: string; fg: string } {
  if (d === 'hard') return { text: 'Sulit', bg: '#fee2e2', fg: '#991b1b' };
  if (d === 'medium') return { text: 'Menengah', bg: '#fef3c7', fg: '#92400e' };
  return { text: 'Mudah', bg: '#dcfce7', fg: '#166534' };
}
