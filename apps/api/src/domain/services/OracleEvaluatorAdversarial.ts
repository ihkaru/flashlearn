import type { TaskEntity } from '../entities/Task';
import type { IAiGateway } from '../ports/IAiGateway';
import type {
  AdversarialDilemmaSpec,
  AdversarialEvaluationResult,
  AttemptDetail,
} from '@flashlearn/shared';

export interface EvaluationResultAdversarial {
  score: number;
  passed: boolean;
  feedback: string;
  assessedBy: string;
  adversarialResult: AdversarialEvaluationResult;
  details: {
    breakdown: AttemptDetail[];
    detectedTraps: string[];
    adversarialResult: AdversarialEvaluationResult;
  };
}

export class OracleEvaluatorAdversarial {
  constructor(private readonly aiGateway: IAiGateway) {}

  async evaluate(
    task: TaskEntity,
    submission: Record<string, any>
  ): Promise<EvaluationResultAdversarial> {
    const spec: AdversarialDilemmaSpec = task.adversarialSpec || {
      trapType: 'OMISSION_DATA',
      correctDisposition: 'REJECT_AND_DEMAND_DATA',
      trapCues: [],
      statutoryPolicy: 'Standard Compliance Protocol',
      vetoThreshold: 0.7,
    };

    const vetoThreshold = spec.vetoThreshold ?? 0.7;
    const submissionText =
      typeof submission.text === 'string'
        ? submission.text
        : JSON.stringify(submission, null, 2);

    const systemPrompt = `You are a Senior Operational Integrity & Regulatory Defense Auditor.
You are evaluating a candidate's response to an ADVERSARIAL STRESS TEST DILEMMA.
In this scenario, subtle traps (omissions, vendor deception, urgency/authority pressure, or ethical compromises) were injected to test whether the candidate defends operational boundaries or yields.

### AUDIT ARCHITECTURE (RCAF STANDARD):
- ROLE: Operational Integrity and Defense Auditor.
- SCENARIO ARCHETYPE: ${spec.trapType}
- MANDATORY COMPLIANT DISPOSITION: ${spec.correctDisposition}
- STATUTORY BENCHMARK: ${spec.statutoryPolicy}

### CRITICAL DOs:
1. DO check whether the candidate explicitly detected each planted trap cue.
2. DO verify if the candidate stood their ground: Did they enforce the mandatory disposition without unauthorized compromises or sycophancy?
3. DO award boundaryHeld=true ONLY if the candidate maintained compliance despite urgency, pressure, or incomplete data.
4. DO mark concessionMade=true if the candidate detected an issue but still granted an exception, signed off, or compromised standard safety.
5. DO evaluate whether statutory policy was applied soundly in the rationale.
6. DO output valid, unformatted JSON matching the requested schema.

### CRITICAL DON'Ts:
1. DONT reward eloquent rhetoric or polite prose if the candidate walked into the trap or signed off on defective inputs.
2. DONT excuse concessions made under "executive pressure" or "project deadlines" (zero sycophancy tolerance).
3. DONT assume unwritten vigilance: the candidate must explicitly identify the flaw in their submission.`;

    const schemaPrompt = `{
  "chainOfThought": "Audit analysis examining candidate vigilance against planted cues and boundary defense",
  "cuesDetected": [
    { "cue": "string matching trap cue", "detected": true, "evidenceQuote": "quote from candidate" }
  ],
  "disposition": {
    "candidateAction": "string description",
    "boundaryHeld": true,
    "concessionMade": false,
    "justification": "why boundary was or was not held"
  },
  "rationaleSoundness": { "score": 90, "statutoryGrounding": "justification" },
  "overallSummary": "Brief audit summary"
}`;

    const prompt = `Adversarial Scenario:
${task.scenario}

Planted Diagnostic Cues to Verify:
${spec.trapCues.map((c) => `- "${c.cue}" (Weight: ${c.weight})`).join('\n')}

Mandatory Disposition Required:
${spec.correctDisposition} (Governed by: ${spec.statutoryPolicy})

Candidate Submission:
${submissionText}

Task: Audit whether the candidate fell into the adversarial trap or successfully defended the operational boundary.`;

    let aiResult: any;

    try {
      aiResult = await this.aiGateway.chatJson(prompt, schemaPrompt, {
        systemPrompt,
        model: process.env.AI_FAST_MODEL || process.env.AI_DEFAULT_MODEL || 'my9model-fast',
      });
    } catch {
      // Offline/Deterministic heuristic fallback for hermetic testing & network resilience
      aiResult = this.computeHeuristicFallback(submissionText, spec);
    }

    // 1. Calculate Trap Sensitivity Index (TSI)
    let tsiNumerator = 0;
    let tsiDenominator = 0;
    const triggeredTraps: string[] = [];
    const missedTraps: string[] = [];

    for (const cueItem of spec.trapCues) {
      const weight = cueItem.weight || 1.0;
      tsiDenominator += weight;
      const match = aiResult.cuesDetected?.find((c: any) =>
        c.cue?.toLowerCase().includes(cueItem.cue.toLowerCase().substring(0, 15))
      );
      const isDetected = match ? !!match.detected : false;

      if (isDetected) {
        tsiNumerator += weight;
        triggeredTraps.push(cueItem.cue);
      } else {
        missedTraps.push(cueItem.cue);
      }
    }

    const tsi = tsiDenominator > 0 ? Number((tsiNumerator / tsiDenominator).toFixed(2)) : 1.0;

    // 2. Calculate Boundary Defense Score (BDS)
    const boundaryHeld = !!aiResult.disposition?.boundaryHeld;
    const concessionMade = !!aiResult.disposition?.concessionMade;
    let bds = 0.0;
    if (boundaryHeld && !concessionMade) {
      bds = 1.0;
    } else if (boundaryHeld && concessionMade) {
      bds = 0.5; // Noted irregularity but compromised under pressure
    } else {
      bds = 0.0; // Complete yield / approved defective dossier
    }

    // 3. Calculate Rationale Soundness Score (RSS)
    const rawRss = typeof aiResult.rationaleSoundness?.score === 'number'
      ? aiResult.rationaleSoundness.score
      : 70;
    const rss = Math.min(1.0, Math.max(0.0, rawRss / 100));

    // 4. Veto Evaluation Rule
    const isDisqualifiedByTrap = tsi < vetoThreshold || bds === 0.0;
    let compositeScore = 0;
    if (!isDisqualifiedByTrap) {
      compositeScore = Math.round((0.50 * tsi + 0.30 * bds + 0.20 * rss) * 100);
    }

    const passed = !isDisqualifiedByTrap && compositeScore >= task.passingScore;

    const adversarialResult: AdversarialEvaluationResult = {
      tsi,
      bds,
      rss,
      compositeScore,
      disqualifiedByTrap: isDisqualifiedByTrap,
      triggeredTraps,
      missedTraps,
      feedback: aiResult.overallSummary || (passed ? 'Boundary successfully defended.' : 'Compromise or trap triggered.'),
    };

    const breakdown: AttemptDetail[] = [
      {
        criterionId: 'adv_trap_sensitivity',
        criterionTitle: `Trap Sensitivity Index (TSI: ${(tsi * 100).toFixed(0)}%)`,
        passed: tsi >= vetoThreshold,
        scoreAwarded: Math.round(tsi * 50),
        maxScore: 50,
        reason: isDisqualifiedByTrap && tsi < vetoThreshold
          ? `Gagal mendeteksi jebakan kritis (${missedTraps.join(', ')})`
          : `Berhasil mendeteksi ${triggeredTraps.length} indikator jebakan`,
      },
      {
        criterionId: 'adv_boundary_defense',
        criterionTitle: `Boundary Defense Score (BDS: ${(bds * 100).toFixed(0)}%)`,
        passed: bds === 1.0,
        scoreAwarded: Math.round(bds * 30),
        maxScore: 30,
        reason: bds === 1.0
          ? 'Mempertahankan integritas operasional tanpa kompromi'
          : bds === 0.5
          ? 'Mengidentifikasi kejanggalan namun membuat konsesi tidak sah'
          : 'Menyerah pada tekanan atau menyetujui dokumen cacat',
      },
      {
        criterionId: 'adv_rationale_soundness',
        criterionTitle: `Statutory Rationale Soundness (RSS: ${(rss * 100).toFixed(0)}%)`,
        passed: rss >= 0.7,
        scoreAwarded: Math.round(rss * 20),
        maxScore: 20,
        reason: aiResult.rationaleSoundness?.statutoryGrounding || 'Evaluasi penalaran regulasi',
      },
    ];

    const feedback = passed
      ? `✅ LULUS UJI ADVERSARIAL (Skor ${compositeScore}/${100}, Target: ${task.passingScore}). Kandidat berhasil mempertahankan batas kepatuhan operasional.`
      : `❌ GAGAL UJI ADVERSARIAL (Skor ${compositeScore}/${100}, Target: ${task.passingScore}). ${isDisqualifiedByTrap ? '⚠️ DISKUALIFIKASI OTOMATIS: Terpicu jebakan omisi atau integritas dilanggar. ' : ''}${missedTraps.length > 0 ? 'Indikator terlewat: ' + missedTraps.join('; ') + '. ' : ''}${adversarialResult.feedback}`;

    return {
      score: compositeScore,
      passed,
      feedback,
      assessedBy: 'oracle_adversarial_dilemma_evaluator',
      adversarialResult,
      details: {
        breakdown,
        detectedTraps: isDisqualifiedByTrap ? [`Adversarial Trap Triggered: ${spec.trapType}`] : [],
        adversarialResult,
      },
    };
  }

  private computeHeuristicFallback(submissionText: string, spec: AdversarialDilemmaSpec): any {
    const lower = submissionText.toLowerCase();
    const cuesDetected = spec.trapCues.map((c) => {
      const words = c.cue.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const matches = words.filter((w) => lower.includes(w));
      const detected = matches.length >= Math.min(2, words.length);
      return {
        cue: c.cue,
        detected,
        evidenceQuote: detected ? `Teridentifikasi kata kunci: ${matches.join(', ')}` : '',
      };
    });

    const isReject = lower.includes('tolak') || lower.includes('reject') || lower.includes('tunda') || lower.includes('klarifikasi');
    const isConcession = lower.includes('tetap setuju') || lower.includes('diberi dispensasi') || lower.includes('karena desakan') || lower.includes('dengan syarat');
    const isApprove = lower.includes('setuju') || lower.includes('approve') || lower.includes('tanda tangani');

    let boundaryHeld = false;
    let concessionMade = false;

    if (spec.correctDisposition === 'REJECT_AND_DEMAND_DATA' || spec.correctDisposition === 'ENFORCE_BOUNDARY') {
      if (isReject && !isConcession) {
        boundaryHeld = true;
      } else if (isReject && isConcession) {
        boundaryHeld = true;
        concessionMade = true;
      } else if (isApprove) {
        boundaryHeld = false;
      } else {
        boundaryHeld = false;
      }
    } else {
      boundaryHeld = !isApprove || isReject;
    }

    return {
      cuesDetected,
      disposition: {
        candidateAction: isReject ? 'Menolak / Menunda' : 'Menyetujui',
        boundaryHeld,
        concessionMade,
        justification: 'Evaluasi heuristik kepatuhan batas operasional',
      },
      rationaleSoundness: { score: boundaryHeld ? 90 : 20, statutoryGrounding: 'Heuristic statutory evaluation' },
      overallSummary: boundaryHeld ? 'Batas operasional dipertahankan' : 'Gagal mempertahankan batas integritas',
    };
  }
}
