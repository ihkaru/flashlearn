import type { LearnerContentProgress } from '@flashlearn/shared';

const SESSION_KEY_STORAGE = 'fl_learner_session_v1';
const PROGRESS_PREFIX = 'fl_progress_v1_';

export function getLearnerSessionKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    let key = window.localStorage.getItem(SESSION_KEY_STORAGE);
    if (!key || key.length < 8) {
      const rand =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      key = `fls_${rand}`;
      window.localStorage.setItem(SESSION_KEY_STORAGE, key);
    }
    return key;
  } catch (err) {
    console.debug('[learnerSession] storage unavailable', err);
    return '';
  }
}

export function readLocalProgress(contentId: string): LearnerContentProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PROGRESS_PREFIX}${contentId}`);
    if (!raw) return null;
    return JSON.parse(raw) as LearnerContentProgress;
  } catch (err) {
    console.debug('[learnerSession] read progress failed', err);
    return null;
  }
}

export function writeLocalProgress(contentId: string, progress: LearnerContentProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${PROGRESS_PREFIX}${contentId}`, JSON.stringify(progress));
  } catch (err) {
    console.debug('[learnerSession] write progress failed', err);
  }
}
