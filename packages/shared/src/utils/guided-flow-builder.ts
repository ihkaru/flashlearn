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

function buildSlideRange(start?: number, end?: number): [number, number] | undefined {
  if (typeof start === 'number' && typeof end === 'number' && end > start) {
    return [start, end];
  }
  return undefined;
}

/**
 * Compiles an InteractiveModulePayload into a calm, linear sequence of
 * single-focus steps adapted to its knowledgeProfile (2-minute micro_know up
 * to deep bridging_understand, procedural_do, or ill_structured_case), with
 * unbounded 1..N support for labs, checkpoints, erroneous examples, and stress tests.
 */
export function buildGuidedLearningSteps(
  payload: InteractiveModulePayload
): GuidedLearningStep[] {
  const { uila } = payload;
  const profile = payload.knowledgeProfile || 'bridging_understand';
  const mode = uila.groundingDecision?.mode || 'direct_formalism';
  const rawSteps: Array<Omit<GuidedLearningStep, 'stepNumber' | 'totalSteps'>> = [];

  const allHingeChecks = [
    ...(payload.hingeCheck ? [payload.hingeCheck] : []),
    ...(payload.additionalHingeChecks || []),
  ];
  const allErroneousExamples = [
    ...(payload.erroneousExample ? [payload.erroneousExample] : []),
    ...(payload.additionalErroneousExamples || []),
  ];
  const allStressTests = [
    uila.block5_stressTest,
    ...(payload.additionalStressTests || []),
  ];

  const pushHingeSteps = () => {
    allHingeChecks.forEach((hc, idx) => {
      rawSteps.push({
        id: idx === 0 ? 'step-hinge-check' : `step-hinge-check-${idx + 1}`,
        kind: 'hinge_check',
        itemIndex: idx,
        title: allHingeChecks.length > 1 ? `Cek Singkat Tengah Jalan (${idx + 1}/${allHingeChecks.length})` : 'Cek Singkat Tengah Jalan',
        actionPrompt: 'Pastikan konsep intinya sudah klik sebelum melanjutkan.',
        requiresInteraction: true,
        preferCollapsedDeck: true,
        slideIndex: hc.slideIndex,
        slideRange: buildSlideRange(hc.slideIndex, hc.slideEndIndex),
      });
    });
  };

  if (profile === 'micro_know' && payload.microKnow) {
    rawSteps.push({
      id: 'step-micro-core',
      kind: 'micro_core',
      title: 'Gagasan Inti',
      actionPrompt: 'Pahami poin utama ini dengan santai dalam kurang dari 1 menit.',
      requiresInteraction: false,
      slideIndex: payload.microKnow.slideIndex ?? 0,
      slideRange: buildSlideRange(payload.microKnow.slideIndex ?? 0, payload.microKnow.slideEndIndex),
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
    allStressTests.forEach((probe, idx) => {
      rawSteps.push({
        id: idx === 0 ? 'step-stress-test' : `step-stress-test-${idx + 1}`,
        kind: 'stress_test',
        itemIndex: idx,
        title: allStressTests.length > 1 ? `Cek Cepat (${idx + 1}/${allStressTests.length})` : 'Cek Cepat',
        actionPrompt: 'Pilih jawaban yang paling tepat beserta tingkat keyakinanmu.',
        requiresInteraction: true,
        preferCollapsedDeck: true,
        slideIndex: probe.slideIndex,
        slideRange: buildSlideRange(probe.slideIndex, probe.slideEndIndex),
      });
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
      slideRange: buildSlideRange(uila.block1_anomaly.slideIndex ?? 0, uila.block1_anomaly.slideEndIndex),
    });

    const hasBlock2Grounding =
      (mode === 'experiential_anchor_bridge' && Boolean(uila.block2_grounding.anchoringLab)) ||
      mode === 'direct_analogy' ||
      mode === 'thought_experiment';

    if (mode === 'experiential_anchor_bridge' && uila.block2_grounding.anchoringLab) {
      const allLabs = [
        uila.block2_grounding.anchoringLab,
        ...(payload.additionalAnchoringLabs || []),
      ];
      allLabs.forEach((lab, idx) => {
        const startSlide = lab.slideIndex ?? (idx === 0 ? (uila.block2_grounding.slideIndex ?? 1) : undefined);
        rawSteps.push({
          id: idx === 0 ? 'step-anchoring' : `step-anchoring-${idx + 1}`,
          kind: 'anchoring_lab',
          itemIndex: idx,
          title: lab.title || (allLabs.length > 1 ? `Coba Langsung (${idx + 1}/${allLabs.length})` : 'Coba Langsung'),
          actionPrompt: lab.instructionPrompt,
          requiresInteraction: true,
          preferCollapsedDeck: true,
          slideIndex: startSlide,
          slideRange: buildSlideRange(startSlide, lab.slideEndIndex),
        });
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
        slideRange: buildSlideRange(uila.block2_grounding.slideIndex ?? 1, uila.block2_grounding.slideEndIndex),
      });
    } else if (mode === 'thought_experiment') {
      rawSteps.push({
        id: 'step-thought-experiment',
        kind: 'thought_experiment',
        title: 'Eksperimen Pikiran',
        actionPrompt: 'Ikuti skenario langkah demi langkah karena skalanya melampaui pengalaman fisik langsung.',
        requiresInteraction: false,
        slideIndex: uila.block2_grounding.slideIndex ?? 1,
        slideRange: buildSlideRange(uila.block2_grounding.slideIndex ?? 1, uila.block2_grounding.slideEndIndex),
      });
    } else if ((payload.additionalAnchoringLabs || []).length > 0) {
      (payload.additionalAnchoringLabs || []).forEach((lab, idx) => {
        rawSteps.push({
          id: `step-anchoring-${idx + 2}`,
          kind: 'anchoring_lab',
          itemIndex: idx + 1,
          title: lab.title || `Eksplorasi Interaktif ${idx + 1}`,
          actionPrompt: lab.instructionPrompt,
          requiresInteraction: true,
          preferCollapsedDeck: true,
          slideIndex: lab.slideIndex,
          slideRange: buildSlideRange(lab.slideIndex, lab.slideEndIndex),
        });
      });
    }

    // Only place hinge_check before mechanics when Block 2 already grounded the concept;
    // in direct_formalism, learners must see core mechanics & diagrams BEFORE the hinge checkpoint.
    if (hasBlock2Grounding) {
      pushHingeSteps();
    }

    rawSteps.push({
      id: 'step-mechanics',
      kind: 'mechanics',
      title: 'Aturan Inti & Jebakan Umum',
      actionPrompt: 'Bandingkan intuisi keliru yang sering terjadi dengan mekanisme nyatanya.',
      requiresInteraction: false,
      slideIndex: uila.block3_coreMechanics.slideIndex,
      slideRange: buildSlideRange(uila.block3_coreMechanics.slideIndex, uila.block3_coreMechanics.slideEndIndex),
    });

    if (!hasBlock2Grounding) {
      pushHingeSteps();
    }

    if (profile === 'ill_structured_case' && payload.illStructuredCase) {
      rawSteps.push({
        id: 'step-ill-structured-case',
        kind: 'ill_structured_case',
        title: payload.illStructuredCase.dilemmaTitle || 'Silang Sumber & Sudut Pandang',
        actionPrompt: 'Bandingkan beberapa sudut pandang dan kriteria evaluasinya sebelum memutuskan.',
        requiresInteraction: false,
        slideIndex: payload.illStructuredCase.slideIndex,
        slideRange: buildSlideRange(payload.illStructuredCase.slideIndex, payload.illStructuredCase.slideEndIndex),
      });
    } else {
      rawSteps.push({
        id: 'step-notation',
        kind: 'notation',
        title: 'Ringkasan Simbol & Contoh',
        actionPrompt: 'Baca simbol sebagai singkatan praktis dari mekanisme yang sudah kamu pahami.',
        requiresInteraction: false,
        slideIndex: uila.block4_notationContract.slideIndex,
        slideRange: buildSlideRange(uila.block4_notationContract.slideIndex, uila.block4_notationContract.slideEndIndex),
      });
    }

    allErroneousExamples.forEach((ex, idx) => {
      rawSteps.push({
        id: idx === 0 ? 'step-erroneous-example' : `step-erroneous-example-${idx + 1}`,
        kind: 'erroneous_example',
        itemIndex: idx,
        title: ex.title || (allErroneousExamples.length > 1 ? `Temukan & Perbaiki Kesalahan (${idx + 1}/${allErroneousExamples.length})` : 'Temukan & Perbaiki Kesalahan'),
        actionPrompt: 'Cari langkah yang keliru pada contoh ini lalu pilih perbaikannya.',
        requiresInteraction: true,
        preferCollapsedDeck: true,
        slideIndex: ex.slideIndex,
        slideRange: buildSlideRange(ex.slideIndex, ex.slideEndIndex),
      });
    });

    allStressTests.forEach((probe, idx) => {
      rawSteps.push({
        id: idx === 0 ? 'step-stress-test' : `step-stress-test-${idx + 1}`,
        kind: 'stress_test',
        itemIndex: idx,
        title: allStressTests.length > 1 ? `Uji Pemahaman Singkat (${idx + 1}/${allStressTests.length})` : 'Uji Pemahaman Singkat',
        actionPrompt: 'Pilih prediksi yang paling masuk akal berdasarkan aturan inti tadi.',
        requiresInteraction: true,
        preferCollapsedDeck: true,
        slideIndex: probe.slideIndex,
        slideRange: buildSlideRange(probe.slideIndex, probe.slideEndIndex),
      });
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
        slideRange: buildSlideRange(payload.explainBack.slideIndex, payload.explainBack.slideEndIndex),
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
