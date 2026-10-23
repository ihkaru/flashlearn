export interface SM2ReviewInput {
  currentRepetition: number;
  currentIntervalDays: number;
  currentEaseFactor: number; // e.g. 250 for 2.5
  quality: number; // 0 (blackout) to 5 (perfect recall)
}

export interface SM2ReviewOutput {
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
  nextDue: Date;
}

export class SpacedRepetitionScheduler {
  calculateNextReview(input: SM2ReviewInput): SM2ReviewOutput {
    const q = Math.max(0, Math.min(5, input.quality));
    let ef = input.currentEaseFactor;

    // EF calculation: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)) * 100
    const delta = (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)) * 100;
    ef = Math.max(130, Math.round(ef + delta)); // Minimum ease factor 1.30 (130)

    let repetitionCount = input.currentRepetition;
    let intervalDays = 1;

    if (q < 3) {
      // Failed recall
      repetitionCount = 0;
      intervalDays = 1;
    } else {
      // Successful recall
      if (repetitionCount === 0) {
        intervalDays = 1;
      } else if (repetitionCount === 1) {
        intervalDays = 3;
      } else {
        intervalDays = Math.round(input.currentIntervalDays * (ef / 100));
      }
      repetitionCount += 1;
    }

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + intervalDays);

    return {
      repetitionCount,
      intervalDays,
      easeFactor: ef,
      nextDue,
    };
  }
}
