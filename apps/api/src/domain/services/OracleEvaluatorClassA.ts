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
  evaluate(task: TaskEntity, submission: Record<string, any>): EvaluationResultClassA {
    const oracle = task.oracleData;
    const formulas = oracle.expectedFormulas || {};
    const checklist = oracle.requiredChecklistItems || [];
    const rubric = task.rubricCriteria;

    const breakdown: AttemptDetail[] = [];
    const discrepancies: Array<{ field: string; expected: number; received: number; tolerance: number }> = [];

    let totalWeight = 0;
    let earnedWeight = 0;

    // 1. Evaluate Calculation Formulas
    for (const [field, config] of Object.entries(formulas)) {
      const expected = config.expectedValue;
      const tolerance = config.tolerance ?? 0.01;
      const receivedRaw = submission[field];
      const received = typeof receivedRaw === 'number' ? receivedRaw : parseFloat(receivedRaw);

      const isNumeric = !isNaN(received);
      const isMatch = isNumeric && Math.abs(received - expected) <= tolerance;

      const criterion = rubric.find((r) => r.id === field) || {
        id: field,
        title: `Kalkulasi ${field}`,
        weight: 10,
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
          reason: `Selisih hitungan ${field}: Diterima ${isNumeric ? received : 'Non-Angka'}, seharusnya ${expected}`,
        });
      }
    }

    // 2. Evaluate Required Checklist Items
    for (const item of checklist) {
      const criterion = rubric.find((r) => r.id === item) || {
        id: item,
        title: `Kelengkapan Dokumen / Item: ${item}`,
        weight: 10,
        description: `Kewajiban pemenuhan ${item}`,
      };

      totalWeight += criterion.weight;
      const val = submission[item];
      const isPresent = val !== undefined && val !== null && val !== false && val !== '';

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

    const calculatedScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;
    const passed = calculatedScore >= task.passingScore;

    const feedback = passed
      ? `✅ LULUS Evaluasi Deterministik (Skor ${calculatedScore}/${100}, Passing: ${task.passingScore}). Seluruh formula dan checklist wajib sesuai acuan.`
      : `❌ BELUM MEMENUHI SYARAT (Skor ${calculatedScore}/${100}, Dibutuhkan: ${task.passingScore}). Terdapat ${discrepancies.length} selisih kalkulasi angka dan ${breakdown.filter((b) => !b.passed).length} poin yang belum tuntas.`;

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
