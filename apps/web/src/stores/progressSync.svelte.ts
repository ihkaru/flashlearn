import type { LearnerContentProgress } from '@flashlearn/shared';

/**
 * Shared Svelte 5 reactive progress bus so Home ("Lanjutkan Belajar") and
 * Workspace unit progress reflect completed/updated modules immediately
 * without requiring a hard page reload under Framework7's cached page stack.
 */
class ProgressSyncStore {
  version = $state(0);
  latestByContentId = $state<Record<string, LearnerContentProgress>>({});

  notifySaved(snapshot: LearnerContentProgress) {
    this.latestByContentId = {
      ...this.latestByContentId,
      [snapshot.contentId]: snapshot,
    };
    this.version += 1;
  }
}

export interface ProgressSnapshotInput {
  contentId: string;
  sessionKey: string;
  currentStepIndex: number;
  totalSteps: number;
  currentSlideIndex: number;
  completedStepIds: string[];
  anchoringCompleted: boolean;
  diagnosticAttempts: number;
  lastLossScore: number | null;
  lossVector: LearnerContentProgress['lossVector'];
  thetaMastery: number;
  isCompleted: boolean;
}

export function buildProgressSnapshot(input: ProgressSnapshotInput): LearnerContentProgress {
  return {
    ...input,
    dailyActivityLog: {},
    updatedAt: new Date().toISOString(),
  };
}

export function toSaveProgressPayload(
  snapshot: LearnerContentProgress,
  extra: { incrementStepsToday?: number; incrementProbesToday?: number } = {}
) {
  return {
    sessionKey: snapshot.sessionKey || undefined,
    currentStepIndex: snapshot.currentStepIndex,
    totalSteps: snapshot.totalSteps,
    currentSlideIndex: snapshot.currentSlideIndex,
    completedStepIds: snapshot.completedStepIds,
    anchoringCompleted: snapshot.anchoringCompleted,
    diagnosticAttempts: snapshot.diagnosticAttempts,
    lastLossScore: snapshot.lastLossScore,
    lossVector: snapshot.lossVector,
    thetaMastery: snapshot.thetaMastery,
    isCompleted: snapshot.isCompleted,
    incrementStepsToday: extra.incrementStepsToday,
    incrementProbesToday: extra.incrementProbesToday,
  };
}

export const progressSync = new ProgressSyncStore();
