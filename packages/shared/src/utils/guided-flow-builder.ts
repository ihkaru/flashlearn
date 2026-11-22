import type {
  CalibrationOutcome,
  ConfidenceLevel,
} from '../types/elastic-pedagogy';
import type {
  DiagnosticEvaluationResult,
  GuidedLearningStep,
  InteractiveModulePayload,
  LossVector,
  UilaStressTestBlock,
} from '../types/interactive';

/**
 * Compiles an InteractiveModulePayload into a calm, linear sequence of
 * single-focus steps adapted to its knowledgeProfile (2-minute micro_know up
 * to deep bridging_understand, procedural_do, or ill_structured_case).
 */
export function buildGuidedLearningSteps(
  payload: InteractiveModulePayload
): GuidedLearningStep[] {
  const { uila } = payload;
  const profile = payload.knowledgeProfile || 'bridging_understand';
  const mode = uila.groundingDecision?.mode || 'direct_formalism';
  const rawSteps: Array<Omit<GuidedLearningStep, 'stepNumber' | 'totalSteps'>> = [];

  if (profile === 'micro_know' && payload.microKnow) {
    rawSteps.push({
      id: 'step-micro-core',
      kind: 'micro_core',
      title: 'Gagasan Inti',
      actionPrompt: 'Pahami poin utama ini dengan santai dalam kurang dari 1 menit.',
      requiresInteraction: false,
      slideIndex: payload.microKnow.slideIndex ?? 0,
    });
    rawSteps.push({
      id: 'step-micro-examples',
      kind: 'micro_examples',
      title: 'Contoh Nyata',
      actionPrompt: 'Lihat bagaimana konsep ini muncul dalam situasi konkret.',
      requiresInteraction: false,
      slideIndex:
        payload.microKnow.slideIndex !== undefined ? payload.microKnow.slideIndex + 1 : 1,
    });
    rawSteps.push({
      id: 'step-stress-test',
      kind: 'stress_test',
      title: 'Cek Cepat',
      actionPrompt: 'Pilih jawaban yang paling tepat beserta tingkat keyakinanmu.',
      requiresInteraction: true,
      preferCollapsedDeck: true,
      slideIndex: uila.block5_stressTest.slideIndex,
    });
    rawSteps.push({
      id: 'step-summary',
      kind: 'summary',
      title: 'Selesai & Rangkuman',
      actionPrompt: 'Ringkasan tersimpan. Lanjut ke sesi berikutnya kapan pun siap.',
      requiresInteraction: false,
      slideIndex: payload.summarySlideIndex,
    });
  } else {
    rawSteps.push({
      id: 'step-anomaly',
      kind: 'anomaly',
      title: 'Masalah Nyata',
      actionPrompt: 'Pahami dulu kenapa cara biasa tidak lagi memadai di situasi ini.',
      requiresInteraction: false,
      slideIndex: uila.block1_anomaly.slideIndex ?? 0,
    });

    if (mode === 'experiential_anchor_bridge' && uila.block2_grounding.anchoringLab) {
      rawSteps.push({
        id: 'step-anchoring',
        kind: 'anchoring_lab',
        title: uila.block2_grounding.anchoringLab.title || 'Coba Langsung',
        actionPrompt: uila.block2_grounding.anchoringLab.instructionPrompt,
        requiresInteraction: true,
        preferCollapsedDeck: true,
        slideIndex: uila.block2_grounding.slideIndex ?? 1,
      });
      rawSteps.push({
        id: 'step-bridging',
        kind: 'bridging',
        title: 'Jembatan ke Konsep Inti',
        actionPrompt: 'Hubungkan apa yang baru kamu rasakan ke konsep aslinya, termasuk batas analoginya.',
        requiresInteraction: false,
        slideIndex:
          uila.block2_grounding.slideIndex !== undefined ? uila.block2_grounding.slideIndex + 1 : 2,
      });
    } else if (mode === 'direct_analogy') {
      rawSteps.push({
        id: 'step-bridging',
        kind: 'bridging',
        title: 'Gambaran Intuitif & Batasnya',
        actionPrompt: 'Lihat padanan yang sudah akrab di keseharian dan di mana padanan ini berhenti berlaku.',
        requiresInteraction: false,
        slideIndex: uila.block2_grounding.slideIndex ?? 1,
      });
    } else if (mode === 'thought_experiment') {
      rawSteps.push({
        id: 'step-thought-experiment',
        kind: 'thought_experiment',
        title: 'Eksperimen Pikiran',
        actionPrompt: 'Ikuti skenario langkah demi langkah karena skalanya melampaui pengalaman fisik langsung.',
        requiresInteraction: false,
        slideIndex: uila.block2_grounding.slideIndex ?? 1,
      });
    }

    if (payload.hingeCheck) {
      rawSteps.push({
        id: 'step-hinge-check',
        kind: 'hinge_check',
        title: 'Cek Singkat Tengah Jalan',
        actionPrompt: 'Pastikan konsep dasarnya sudah klik sebelum lanjut ke aturan formal.',
        requiresInteraction: true,
        preferCollapsedDeck: true,
        slideIndex: payload.hingeCheck.slideIndex,
      });
    }

    rawSteps.push({
      id: 'step-mechanics',
      kind: 'mechanics',
      title: 'Aturan Inti & Jebakan Umum',
      actionPrompt: 'Bandingkan intuisi keliru yang sering terjadi dengan mekanisme nyatanya.',
      requiresInteraction: false,
      slideIndex: uila.block3_coreMechanics.slideIndex,
    });

    if (profile === 'ill_structured_case' && payload.illStructuredCase) {
      rawSteps.push({
        id: 'step-ill-structured-case',
        kind: 'ill_structured_case',
        title: payload.illStructuredCase.dilemmaTitle || 'Silang Sumber & Sudut Pandang',
        actionPrompt: 'Bandingkan beberapa sudut pandang dan kriteria evaluasinya sebelum memutuskan.',
        requiresInteraction: false,
        slideIndex: payload.illStructuredCase.slideIndex,
      });
    } else {
      rawSteps.push({
        id: 'step-notation',
        kind: 'notation',
        title: 'Ringkasan Simbol & Contoh',
        actionPrompt: 'Baca simbol sebagai singkatan praktis dari mekanisme yang sudah kamu pahami.',
        requiresInteraction: false,
        slideIndex: uila.block4_notationContract.slideIndex,
      });
    }

    if (payload.erroneousExample) {
      rawSteps.push({
        id: 'step-erroneous-example',
        kind: 'erroneous_example',
        title: payload.erroneousExample.title || 'Temukan & Perbaiki Kesalahan',
        actionPrompt: 'Cari langkah yang keliru pada contoh ini lalu pilih perbaikannya.',
        requiresInteraction: true,
        preferCollapsedDeck: true,
        slideIndex: payload.erroneousExample.slideIndex,
      });
    }

    rawSteps.push({
      id: 'step-stress-test',
      kind: 'stress_test',
      title: 'Uji Pemahaman Singkat',
      actionPrompt: 'Pilih prediksi yang paling masuk akal berdasarkan aturan inti tadi.',
      requiresInteraction: true,
      preferCollapsedDeck: true,
      slideIndex: uila.block5_stressTest.slideIndex,
    });

    if (payload.explainBack) {
      rawSteps.push({
        id: 'step-explain-back',
        kind: 'explain_back',
        title: 'Jelaskan Balik',
        actionPrompt: 'Kunci pemahamanmu dengan memastikan alasan sebab-akibatnya benar-benar jelas.',
        requiresInteraction: true,
        preferCollapsedDeck: true,
        slideIndex: payload.explainBack.slideIndex,
      });
    }

    rawSteps.push({
      id: 'step-summary',
      kind: 'summary',
      title: 'Selesai & Rangkuman',
      actionPrompt: 'Pemahaman inti tersimpan. Kamu bisa lanjut ke topik berikutnya atau istirahat.',
      requiresInteraction: false,
      slideIndex: payload.summarySlideIndex,
    });
  }

  const totalSteps = rawSteps.length;
  return rawSteps.map((step, idx) => ({
    ...step,
    stepNumber: idx + 1,
    totalSteps,
  }));
}

function classifyCalibration(
  isCorrect: boolean,
  confidence?: ConfidenceLevel
): {
  outcome?: CalibrationOutcome;
  note?: string;
  requiresConsolidation?: boolean;
} {
  if (!confidence) return {};
  if (isCorrect) {
    if (confidence === 'sure') {
      return {
        outcome: 'calibrated_mastery',
        note: 'Tepat dan terkalibrasi baik: keyakinanmu selaras dengan mekanisme nyatanya.',
        requiresConsolidation: false,
      };
    }
    if (confidence === 'unsure') {
      return {
        outcome: 'cautious_correct',
        note: 'Jawabanmu benar meski masih ragu. Baca ulang alasan kausalnya agar makin mantap.',
        requiresConsolidation: false,
      };
    }
    return {
      outcome: 'lucky_guess',
      note: 'Tebakanmu tepat, tetapi tandai alasan intinya baik-baik agar bukan sekadar kebetulan.',
      requiresConsolidation: true,
    };
  }
  if (confidence === 'sure') {
    return {
      outcome: 'overconfident_misconception',
      note: 'Perhatian: kamu sangat yakin pada intuisi yang keliru. Ini titik miskonsepsi penting untuk diluruskan.',
      requiresConsolidation: true,
    };
  }
  return {
    outcome: 'aware_gap',
    note: 'Bagus bahwa kamu sadar masih ragu; gunakan petunjuk bertahap di bawah untuk membedah sebabnya.',
    requiresConsolidation: false,
  };
}

/**
 * Deterministic <1ms client/server diagnostic evaluator modeled on HGD 5-axis Loss
 * with optional Confidence Calibration (education-agent-skills Domain 20).
 */
export function evaluateDiagnosticChoice(
  probe: UilaStressTestBlock,
  selectedOptionId: string,
  currentTheta = 0.2,
  learningRate = 0.35,
  confidenceLevel?: ConfidenceLevel
): DiagnosticEvaluationResult {
  const selectedOption = probe.options.find((o) => o.optionId === selectedOptionId);
  if (!selectedOption) {
    throw new Error(`Invalid optionId "${selectedOptionId}" for stress test probe`);
  }

  const lossVector: LossVector = {
    conceptGap: 0,
    missingPrerequisite: 0,
    notationBreakdown: 0,
    methodChoice: 0,
    reasoningBug: 0,
  };

  const calibration = classifyCalibration(selectedOption.isCorrect, confidenceLevel);

  if (selectedOption.isCorrect) {
    const confidenceBonus =
      confidenceLevel === 'guessing' ? 0.08 : confidenceLevel === 'unsure' ? 0.16 : 0.25;
    const nextTheta = Math.min(
      1,
      Number((currentTheta + learningRate * (1 - currentTheta) + confidenceBonus).toFixed(3))
    );
    return {
      isCorrect: true,
      lossScore: 0,
      lossVector,
      selectedOption,
      nextTheta,
      mastered: true,
      confidenceLevel,
      calibrationOutcome: calibration.outcome,
      calibrationNote: calibration.note,
      requiresConsolidation: calibration.requiresConsolidation,
    };
  }

  const axis = selectedOption.diagnosticAxis || 'conceptGap';
  const penalty = confidenceLevel === 'sure' ? 0.95 : 0.85;
  lossVector[axis] = penalty;
  const thetaDrop = confidenceLevel === 'sure' ? 0.08 : 0.05;
  const nextTheta = Math.max(0.05, Number((currentTheta - thetaDrop).toFixed(3)));

  return {
    isCorrect: false,
    lossScore: penalty,
    lossVector,
    selectedOption,
    nextTheta,
    mastered: false,
    confidenceLevel,
    calibrationOutcome: calibration.outcome,
    calibrationNote: calibration.note,
    requiresConsolidation: calibration.requiresConsolidation,
  };
}
