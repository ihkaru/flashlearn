import type { InterRaterReliabilityResult } from '@flashlearn/shared';

export interface RaterScorecard {
  reviewerId: string;
  totalScore: number;
  rubricScores: Record<string, number>;
}

export class MultiRaterConsensusEngine {
  /**
   * Calculates inter-rater reliability metrics (Po, Cohen's Kappa, Gwet's AC1, Gwet's AC2)
   * and evaluates whether consensus is achieved or arbiter escalation is required.
   */
  calculateReliability(
    card1: RaterScorecard,
    card2: RaterScorecard,
    options: {
      maxDelta?: number;
      minAcThreshold?: number;
      scaleMin?: number;
      scaleMax?: number;
    } = {}
  ): InterRaterReliabilityResult {
    const maxDelta = options.maxDelta ?? 15.0;
    const minAcThreshold = options.minAcThreshold ?? 0.8;

    const criteriaKeys = Array.from(
      new Set([...Object.keys(card1.rubricScores), ...Object.keys(card2.rubricScores)])
    );

    const n = criteriaKeys.length;
    if (n === 0) {
      const scoreDelta = Math.abs(card1.totalScore - card2.totalScore);
      const hasConsensus = scoreDelta <= maxDelta;
      return {
        observedAgreement: 1.0,
        gwetAC1: 1.0,
        gwetAC2: 1.0,
        cohenKappa: 1.0,
        scoreDelta,
        hasConsensus,
        requiresArbiter: !hasConsensus,
        finalScore: hasConsensus ? Math.round((card1.totalScore + card2.totalScore) / 2) : undefined,
      };
    }

    const r1 = criteriaKeys.map((k) => card1.rubricScores[k] ?? 0);
    const r2 = criteriaKeys.map((k) => card2.rubricScores[k] ?? 0);

    // 1. Observed Raw Agreement Po
    let exactMatches = 0;
    for (let i = 0; i < n; i++) {
      if (r1[i] === r2[i]) exactMatches++;
    }
    const po = exactMatches / n;

    // Distinct categories across both raters
    const allCategories = Array.from(new Set([...r1, ...r2])).sort((a, b) => a - b);
    const kCount = allCategories.length;

    // Marginal proportions
    const p1: Record<number, number> = {};
    const p2: Record<number, number> = {};
    const pi: Record<number, number> = {};

    for (const cat of allCategories) {
      const count1 = r1.filter((v) => v === cat).length;
      const count2 = r2.filter((v) => v === cat).length;
      p1[cat] = count1 / n;
      p2[cat] = count2 / n;
      pi[cat] = (p1[cat] + p2[cat]) / 2;
    }

    // 2. Cohen's Kappa
    let peCohen = 0;
    for (const cat of allCategories) {
      peCohen += p1[cat] * p2[cat];
    }
    const cohenKappa =
      Math.abs(1 - peCohen) < 1e-9 ? (po === 1 ? 1.0 : 0.0) : (po - peCohen) / (1 - peCohen);

    // 3. Gwet's AC1 (Categorical)
    let sumPi = 0;
    for (const cat of allCategories) {
      sumPi += pi[cat] * (1 - pi[cat]);
    }
    const peGwet = kCount > 1 ? sumPi / (kCount - 1) : 0;
    const gwetAC1 = Math.abs(1 - peGwet) < 1e-9 ? 1.0 : (po - peGwet) / (1 - peGwet);

    // 4. Gwet's AC2 (Ordinal with quadratic weights)
    const isPercentageScale = allCategories.some((v) => v > 10);
    const minVal = options.scaleMin ?? (isPercentageScale ? 0 : (allCategories[0] ?? 1));
    const maxVal =
      options.scaleMax ?? (isPercentageScale ? 100 : (allCategories[allCategories.length - 1] ?? 5));
    const range = maxVal - minVal || 1;

    const weight = (a: number, b: number) => 1 - Math.pow((a - b) / range, 2);

    let poWeighted = 0;
    for (let i = 0; i < n; i++) {
      poWeighted += weight(r1[i], r2[i]);
    }
    poWeighted = poWeighted / n;

    let peWeighted = 0;
    for (const catA of allCategories) {
      for (const catB of allCategories) {
        const w = weight(catA, catB);
        if (kCount > 1) {
          peWeighted += w * (pi[catA] * (1 - pi[catB])) / (kCount - 1);
        } else {
          peWeighted += w * pi[catA] * pi[catB];
        }
      }
    }
    const gwetAC2 =
      Math.abs(1 - peWeighted) < 1e-9 ? 1.0 : (poWeighted - peWeighted) / (1 - peWeighted);

    // 5. Score Delta & Consensus Decision
    const scoreDelta = Math.abs(card1.totalScore - card2.totalScore);
    const hasConsensus =
      scoreDelta <= maxDelta &&
      (gwetAC1 >= minAcThreshold || gwetAC2 >= minAcThreshold || poWeighted >= 0.9);
    const requiresArbiter = !hasConsensus;

    const finalScore = hasConsensus
      ? Math.round((card1.totalScore + card2.totalScore) / 2)
      : undefined;

    return {
      observedAgreement: Math.round(po * 10000) / 10000,
      gwetAC1: Math.round(gwetAC1 * 10000) / 10000,
      gwetAC2: Math.round(gwetAC2 * 10000) / 10000,
      cohenKappa: Math.round(cohenKappa * 10000) / 10000,
      scoreDelta: Math.round(scoreDelta * 100) / 100,
      hasConsensus,
      requiresArbiter,
      finalScore,
    };
  }

  /**
   * Reconciles disputed ratings through Chief Arbiter review.
   * Finds closest concordant pair between R1, R2, and Arbiter to eliminate outlier hawk/dove bias.
   */
  resolveArbitration(
    s1: number,
    s2: number,
    sArbiter: number
  ): { finalScore: number; resolvedMethod: string; concordantPair: [number, number] } {
    const d1A = Math.abs(s1 - sArbiter);
    const d2A = Math.abs(s2 - sArbiter);
    const d12 = Math.abs(s1 - s2);

    if (d1A <= d2A && d1A <= d12) {
      return {
        finalScore: Math.round((s1 + sArbiter) / 2),
        resolvedMethod: 'CONCORDANT_PAIR_R1_ARBITER',
        concordantPair: [s1, sArbiter],
      };
    } else if (d2A <= d1A && d2A <= d12) {
      return {
        finalScore: Math.round((s2 + sArbiter) / 2),
        resolvedMethod: 'CONCORDANT_PAIR_R2_ARBITER',
        concordantPair: [s2, sArbiter],
      };
    } else {
      return {
        finalScore: Math.round((s1 + s2) / 2),
        resolvedMethod: 'CONCORDANT_PAIR_ORIGINAL',
        concordantPair: [s1, s2],
      };
    }
  }
}
