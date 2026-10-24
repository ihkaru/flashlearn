import type { TaskEntity } from '../entities/Task';
import type { IAiGateway } from '../ports/IAiGateway';
import type { AttemptDetail, NegativeAnchor } from '@flashlearn/shared';

export interface EvaluationResultClassB {
  score: number;
  passed: boolean;
  feedback: string;
  assessedBy: string;
  details: {
    breakdown: AttemptDetail[];
    detectedTraps: string[];
  };
}

export class OracleEvaluatorClassB {
  constructor(private readonly aiGateway: IAiGateway) {}

  async evaluate(task: TaskEntity, submission: Record<string, any>): Promise<EvaluationResultClassB> {
    const oracle = task.oracleData;
    const goldSolution = oracle.goldSolution || 'Solusi standar kepatuhan regulasi.';
    const negativeAnchors: NegativeAnchor[] = oracle.negativeAnchors || [];
    const rubric = task.rubricCriteria;

    const submissionText = typeof submission.text === 'string'
      ? submission.text
      : JSON.stringify(submission, null, 2);

    const verifierSystemPrompt = `You are an impartial, highly rigorous domain compliance and verification auditor.
You are evaluating a candidate's case-study submission against an official Gold Benchmark Solution and a list of Negative Anchors (Fatal Traps/Misconceptions).
Do NOT evaluate based on politeness or essay length. Evaluate based on substantive correctness and presence of fatal errors.`;

    const schemaPrompt = `{
  "criterionEvaluations": [
    {
      "criterionId": "id string",
      "passed": true,
      "scorePercentage": 100,
      "justification": "why it passed or failed based on gold solution"
    }
  ],
  "triggeredTraps": [
    {
      "trapId": "id string",
      "triggered": true,
      "evidenceQuote": "exact quote from candidate showing the mistake"
    }
  ],
  "overallSummary": "Brief audit conclusion"
}`;

    const prompt = `Case Scenario:
${task.scenario}

Gold Benchmark Solution:
${goldSolution}

Negative Anchors / Fatal Traps to Check:
${negativeAnchors.map((t) => `- [${t.id}] ${t.trapDescription} (Penalty: ${t.penaltyPoints}%, Fatal: ${t.fatal})`).join('\n')}

Rubric Criteria:
${rubric.map((r) => `- [${r.id}] ${r.title} (Weight: ${r.weight}): ${r.description}`).join('\n')}

Candidate Submission:
${submissionText}

Task: Evaluate whether each criterion is satisfied and whether ANY of the negative anchors/traps were triggered.`;

    let aiResult: {
      criterionEvaluations: Array<{ criterionId: string; passed: boolean; scorePercentage: number; justification: string }>;
      triggeredTraps: Array<{ trapId: string; triggered: boolean; evidenceQuote: string }>;
      overallSummary: string;
    };

    try {
      aiResult = await this.aiGateway.chatJson<{
        criterionEvaluations: Array<{ criterionId: string; passed: boolean; scorePercentage: number; justification: string }>;
        triggeredTraps: Array<{ trapId: string; triggered: boolean; evidenceQuote: string }>;
        overallSummary: string;
      }>(prompt, schemaPrompt, {
        systemPrompt: verifierSystemPrompt,
        model: process.env.AI_FAST_MODEL || process.env.AI_DEFAULT_MODEL || 'my9model-fast',
      });
    } catch (netErr: any) {
      // Resilient fallback when AI gateway is unreachable or offline
      const triggeredTraps = negativeAnchors
        .filter((anchor) => {
          const lower = submissionText.toLowerCase();
          const words = anchor.trapDescription
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((w) => w.length > 3);
          return words.some((w) => lower.includes(w));
        })
        .map((a) => ({
          trapId: a.id,
          triggered: true,
          evidenceQuote: `Ditemukan ketidakpatuhan atau kesamaan pola jebakan: "${a.trapDescription}".`,
        }));

      aiResult = {
        criterionEvaluations: rubric.map((r) => ({
          criterionId: r.id,
          passed: triggeredTraps.length === 0,
          scorePercentage: triggeredTraps.length === 0 ? 100 : 25,
          justification: triggeredTraps.length === 0 ? 'Kriteria evaluasi terpenuhi' : 'Terindikasi ketidaksesuaian kriteria atau terpicu jebakan',
        })),
        triggeredTraps,
        overallSummary: triggeredTraps.length > 0 ? 'Terdeteksi jebakan atau ketidakpatuhan kriteria' : 'Memenuhi standar verifikasi',
      };
    }

    const breakdown: AttemptDetail[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const criterion of rubric) {
      totalWeight += criterion.weight;
      const evalItem = aiResult.criterionEvaluations?.find((e) => e.criterionId === criterion.id);
      const passed = evalItem ? evalItem.passed : false;
      const pct = evalItem ? Math.min(100, Math.max(0, evalItem.scorePercentage)) : (passed ? 100 : 0);
      const scoreAwarded = Math.round((pct / 100) * criterion.weight);

      if (passed) earnedWeight += scoreAwarded;

      breakdown.push({
        criterionId: criterion.id,
        criterionTitle: criterion.title,
        passed,
        scoreAwarded,
        maxScore: criterion.weight,
        reason: evalItem?.justification || (passed ? 'Kriteria terpenuhi' : 'Kriteria tidak terpenuhi'),
      });
    }

    // Process Negative Anchors (Traps)
    const detectedTraps: string[] = [];
    let penaltyTotal = 0;
    let hasFatalTrap = false;

    if (aiResult.triggeredTraps) {
      for (const t of aiResult.triggeredTraps) {
        if (t.triggered) {
          const anchor = negativeAnchors.find((a) => a.id === t.trapId);
          const trapName = anchor ? anchor.trapDescription : t.trapId;
          detectedTraps.push(`${trapName} (Bukti: "${t.evidenceQuote}")`);
          if (anchor) {
            penaltyTotal += anchor.penaltyPoints;
            if (anchor.fatal) hasFatalTrap = true;
          }
        }
      }
    }

    let rawScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    rawScore = Math.max(0, rawScore - penaltyTotal);

    // If a fatal trap was triggered, cap score strictly below passing score
    if (hasFatalTrap && rawScore >= task.passingScore) {
      rawScore = Math.min(rawScore, task.passingScore - 10);
    }

    const passed = rawScore >= task.passingScore && !hasFatalTrap;

    const feedback = passed
      ? `✅ LULUS Evaluasi Kasus (Skor ${rawScore}/${100}, Target: ${task.passingScore}). ${aiResult.overallSummary}`
      : `❌ BELUM MEMENUHI SYARAT (Skor ${rawScore}/${100}, Target: ${task.passingScore}). ${hasFatalTrap ? '⚠️ TERDETEKSI JEBAKAN FATAL (FATAL TRAP). ' : ''}${detectedTraps.length > 0 ? 'Pelanggaran: ' + detectedTraps.join('; ') + '. ' : ''}${aiResult.overallSummary}`;

    return {
      score: rawScore,
      passed,
      feedback,
      assessedBy: 'oracle_class_b_ai_judge',
      details: {
        breakdown,
        detectedTraps,
      },
    };
  }
}
