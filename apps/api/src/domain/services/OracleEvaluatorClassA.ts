import type { TaskEntity } from '../entities/Task';
import type { AttemptDetail } from '@flashlearn/shared';

export interface EvaluationResultClassA {
  score: number;
  passed: boolean;
  feedback: string;
  assessedBy: string;
  details: {
    breakdown: AttemptDetail[];
    calculationDiscrepancies: Array<{ field: string; expected: number; received: number; tolerance: number }>;
  };
}

export class OracleEvaluatorClassA {
  private extractFormulaTargets(
    oracle: Record<string, any>
  ): Record<string, { expectedValue: number; tolerance?: number }> {
    if (oracle.expectedFormulas && Object.keys(oracle.expectedFormulas).length > 0) {
      return oracle.expectedFormulas;
    }

    const derived: Record<string, { expectedValue: number; tolerance?: number }> = {};

    // Support top-level expected* numeric keys (e.g. expectedHpsFinal)
    for (const [key, val] of Object.entries(oracle)) {
      if (typeof val === 'number' && /^(expected|target|excess)/i.test(key)) {
        derived[key] = { expectedValue: val };
      }
    }

    // Support seed format oracleData.variables containing expected* numeric targets
    if (oracle.variables && typeof oracle.variables === 'object') {
      const vars = oracle.variables as Record<string, any>;
      for (const [key, val] of Object.entries(vars)) {
        if (typeof val === 'number' && /^(expected|target|excess)/i.test(key)) {
          derived[key] = { expectedValue: val };
        }
      }

      // Prioritize final target if multiple intermediate expected values exist (e.g. TCO pre-tax + PPN + final)
      const finalKey = Object.keys(derived).find((k) => /final$/i.test(k));
      if (finalKey && Object.keys(derived).length > 1) {
        return { [finalKey]: derived[finalKey] };
      }
    }

    return derived;
  }

  private resolveNumericSubmission(
    submission: Record<string, any>,
    field: string,
    singleTarget: boolean
  ): number {
    const direct = submission[field];
    if (direct !== undefined && direct !== null && direct !== '') {
      return typeof direct === 'number' ? direct : parseFloat(String(direct));
    }
    if (singleTarget && submission.calculatedValue !== undefined && submission.calculatedValue !== '') {
      return typeof submission.calculatedValue === 'number'
        ? submission.calculatedValue
        : parseFloat(String(submission.calculatedValue));
    }
    return NaN;
  }

  evaluate(task: TaskEntity, submission: Record<string, any>): EvaluationResultClassA {
    const oracle = task.oracleData || {};
    const formulas = this.extractFormulaTargets(oracle);
    const checklist: string[] = Array.isArray(oracle.requiredChecklistItems)
      ? oracle.requiredChecklistItems
      : Array.isArray(oracle.checklist)
        ? oracle.checklist
        : [];
    const rubric = task.rubricCriteria || [];

    const breakdown: AttemptDetail[] = [];
    const discrepancies: Array<{ field: string; expected: number; received: number; tolerance: number }> = [];

    let totalWeight = 0;
    let earnedWeight = 0;
    const formulaEntries = Object.entries(formulas);
    const isSingleFormula = formulaEntries.length === 1;

    // 1. Evaluate Calculation Formulas (default ±1% relative tolerance)
    for (const [field, config] of formulaEntries) {
      const expected = config.expectedValue;
      const defaultTolerance = Math.max(0.01, Math.abs(expected) * 0.01);
      const tolerance = config.tolerance ?? defaultTolerance;
      const received = this.resolveNumericSubmission(submission, field, isSingleFormula);

      const isNumeric = !isNaN(received);
      const isMatch = isNumeric && Math.abs(received - expected) <= tolerance;

      const criterion = rubric.find((r) => r.id === field) || {
        id: field,
        title: `Kalkulasi ${field}`,
        weight: 40,
        description: `Kesesuaian nilai hitungan ${field}`,
      };

      totalWeight += criterion.weight;

      if (isMatch) {
        earnedWeight += criterion.weight;
        breakdown.push({
          criterionId: criterion.id,
          criterionTitle: criterion.title,
          passed: true,
          scoreAwarded: criterion.weight,
          maxScore: criterion.weight,
          reason: `Perhitungan ${field} tepat (Diterima: ${received}, Target: ${expected} ± ${tolerance})`,
        });
      } else {
        discrepancies.push({
          field,
          expected,
          received: isNumeric ? received : NaN,
          tolerance,
        });
        breakdown.push({
          criterionId: criterion.id,
          criterionTitle: criterion.title,
          passed: false,
          scoreAwarded: 0,
          maxScore: criterion.weight,
          reason: `Selisih hitungan ${field}: Diterima ${isNumeric ? received : 'Non-Angka'}, seharusnya ${expected} (±${tolerance})`,
        });
      }
    }

    // 2. Evaluate Required Checklist Items
    const completedChecklist = Array.isArray(submission.completedChecklist)
      ? new Set<string>(submission.completedChecklist)
      : null;

    for (const item of checklist) {
      const criterion = rubric.find((r) => r.id === item) || {
        id: item,
        title: `Kelengkapan Dokumen / Item: ${item}`,
        weight: 10,
        description: `Kewajiban pemenuhan ${item}`,
      };

      totalWeight += criterion.weight;
      const val = submission[item];
      const isPresent =
        (val !== undefined && val !== null && val !== false && val !== '') ||
        Boolean(completedChecklist?.has(item));

      if (isPresent) {
        earnedWeight += criterion.weight;
        breakdown.push({
          criterionId: criterion.id,
          criterionTitle: criterion.title,
          passed: true,
          scoreAwarded: criterion.weight,
          maxScore: criterion.weight,
          reason: `Item wajib '${item}' terpenuhi`,
        });
      } else {
        breakdown.push({
          criterionId: criterion.id,
          criterionTitle: criterion.title,
          passed: false,
          scoreAwarded: 0,
          maxScore: criterion.weight,
          reason: `Item wajib '${item}' tidak ditemukan atau kosong dalam submission`,
        });
      }
    }

    // Fail-fast: never auto-pass 100% when no deterministic oracle criteria exist
    if (totalWeight === 0) {
      throw new Error(
        `ORACLE_CLASS_A_MISCONFIGURED: Task '${task.id}' (${task.title}) defines no expectedFormulas, numeric target variables, or checklist items for deterministic evaluation.`
      );
    }

    const calculatedScore = Math.round((earnedWeight / totalWeight) * 100);
    const passed = calculatedScore >= task.passingScore;

    const feedback = passed
      ? `LULUS Evaluasi Deterministik (Skor ${calculatedScore}/100, Passing: ${task.passingScore}). Seluruh formula dan checklist wajib sesuai acuan.`
      : `BELUM MEMENUHI SYARAT (Skor ${calculatedScore}/100, Dibutuhkan: ${task.passingScore}). Terdapat ${discrepancies.length} selisih kalkulasi angka dan ${breakdown.filter((b) => !b.passed).length} poin yang belum tuntas.`;

    return {
      score: calculatedScore,
      passed,
      feedback,
      assessedBy: 'oracle_class_a_deterministic',
      details: {
        breakdown,
        calculationDiscrepancies: discrepancies,
      },
    };
  }
}
