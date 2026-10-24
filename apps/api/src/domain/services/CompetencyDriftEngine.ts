import type { CompetencyDriftStatus } from '@flashlearn/shared';

export interface CompetencyDriftEvaluation {
  retrievability: number;
  driftStatus: CompetencyDriftStatus;
  daysElapsed: number;
  daysUntilWarning: number;
  daysUntilExpiration: number;
  isWarning: boolean;
  isExpired: boolean;
}

export class CompetencyDriftEngine {
  private readonly decayFactor = 0.19;
  private readonly warningThreshold = 0.85;
  private readonly expirationThreshold = 0.7;

  /**
   * Computes operational retrievability R(t) using the DSR Power Forgetting Curve:
   * R(t) = (1 + 0.19 * t / S)^(-0.5)
   */
  computeRetrievability(daysElapsed: number, stability: number): number {
    const s = Math.max(0.1, stability);
    const t = Math.max(0, daysElapsed);
    const r = Math.pow(1 + (this.decayFactor * t) / s, -0.5);
    return Math.round(r * 10000) / 10000;
  }

  /**
   * Determines operational competency drift status based on current retrievability.
   */
  determineDriftStatus(retrievability: number): CompetencyDriftStatus {
    if (retrievability >= this.warningThreshold) return 'active';
    if (retrievability >= this.expirationThreshold) return 'drift_warning';
    return 'provisionally_expired';
  }

  /**
   * Calculates time in days required for retrievability to decay to a given target threshold.
   * t = (S / 0.19) * (R^(-2) - 1)
   */
  calculateDaysToThreshold(targetR: number, stability: number): number {
    const s = Math.max(0.1, stability);
    const r = Math.min(0.9999, Math.max(0.01, targetR));
    const days = (s / this.decayFactor) * (Math.pow(r, -2) - 1);
    return Math.max(0, Math.round(days * 10) / 10);
  }

  /**
   * Evaluates complete drift state for a given elapsed time and memory stability.
   */
  evaluateDrift(daysElapsed: number, stability: number): CompetencyDriftEvaluation {
    const retrievability = this.computeRetrievability(daysElapsed, stability);
    const driftStatus = this.determineDriftStatus(retrievability);

    const totalDaysToWarning = this.calculateDaysToThreshold(this.warningThreshold, stability);
    const totalDaysToExpiration = this.calculateDaysToThreshold(this.expirationThreshold, stability);

    const daysUntilWarning = Math.max(0, Math.round((totalDaysToWarning - daysElapsed) * 10) / 10);
    const daysUntilExpiration = Math.max(
      0,
      Math.round((totalDaysToExpiration - daysElapsed) * 10) / 10
    );

    return {
      retrievability,
      driftStatus,
      daysElapsed: Math.round(daysElapsed * 10) / 10,
      daysUntilWarning,
      daysUntilExpiration,
      isWarning: driftStatus === 'drift_warning',
      isExpired: driftStatus === 'provisionally_expired',
    };
  }

  /**
   * Updates memory stability S upon revalidation challenge.
   * - On pass: stretches stability inversely to retrievability at test time (desirable difficulty).
   * - On fail: stability collapses, reflecting lapse of operational competence.
   */
  updateStability(
    currentS: number,
    currentD: number,
    retrievabilityAtTest: number,
    passed: boolean
  ): number {
    const s = Math.max(0.1, currentS);
    const d = Math.min(10, Math.max(1, currentD));
    const r = Math.min(1.0, Math.max(0.01, retrievabilityAtTest));

    if (passed) {
      // Stability expansion: S' = S * (1 + 1.6 * D^(-0.3) * S^(-0.15) * e^(2.0 * (1 - R)))
      const boost = 1 + 1.6 * Math.pow(d, -0.3) * Math.pow(s, -0.15) * Math.exp(2.0 * (1 - r));
      const newS = s * boost;
      return Math.round(newS * 100) / 100;
    } else {
      // Lapse collapse: S' = max(1.0, min(3.0, S * 0.15 * D^(-0.2)))
      const collapsed = Math.max(1.0, Math.min(3.0, s * 0.15 * Math.pow(d, -0.2)));
      return Math.round(collapsed * 100) / 100;
    }
  }
}
