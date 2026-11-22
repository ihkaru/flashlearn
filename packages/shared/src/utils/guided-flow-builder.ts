import type {
  DiagnosticEvaluationResult,
  GuidedLearningStep,
  InteractiveModulePayload,
  LossVector,
  UilaStressTestBlock,
} from '../types/interactive';

/**
 * Compiles an InteractiveModulePayload into a calm, linear sequence of
 * single-focus steps so learners only follow one clear instruction at a time.
 */
export function buildGuidedLearningSteps(
  payload: InteractiveModulePayload
): GuidedLearningStep[] {
  const { uila } = payload;
  const mode = uila.groundingDecision.mode;
  const rawSteps: Array<Omit<GuidedLearningStep, 'stepNumber' | 'totalSteps'>> = [];

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

  rawSteps.push({
    id: 'step-mechanics',
    kind: 'mechanics',
    title: 'Aturan Inti & Jebakan Umum',
    actionPrompt: 'Bandingkan intuisi keliru yang sering terjadi dengan mekanisme nyatanya.',
    requiresInteraction: false,
    slideIndex: uila.block3_coreMechanics.slideIndex,
  });

  rawSteps.push({
    id: 'step-notation',
    kind: 'notation',
    title: 'Ringkasan Simbol & Contoh',
    actionPrompt: 'Baca simbol sebagai singkatan praktis dari mekanisme yang sudah kamu pahami.',
    requiresInteraction: false,
    slideIndex: uila.block4_notationContract.slideIndex,
  });

  rawSteps.push({
    id: 'step-stress-test',
    kind: 'stress_test',
    title: 'Uji Pemahaman Singkat',
    actionPrompt: 'Pilih prediksi yang paling masuk akal berdasarkan aturan inti tadi.',
    requiresInteraction: true,
  });

  rawSteps.push({
    id: 'step-summary',
    kind: 'summary',
    title: 'Selesai & Rangkuman',
    actionPrompt: 'Pemahaman inti tersimpan. Kamu bisa lanjut ke topik berikutnya atau istirahat.',
    requiresInteraction: false,
  });

  const totalSteps = rawSteps.length;
  return rawSteps.map((step, idx) => ({
    ...step,
    stepNumber: idx + 1,
    totalSteps,
  }));
}

/**
 * Deterministic <1ms client/server diagnostic evaluator modeled on HGD 5-axis Loss.
 */
export function evaluateDiagnosticChoice(
  probe: UilaStressTestBlock,
  selectedOptionId: string,
  currentTheta = 0.2,
  learningRate = 0.35
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

  if (selectedOption.isCorrect) {
    const nextTheta = Math.min(1, Number((currentTheta + learningRate * (1 - currentTheta) + 0.25).toFixed(3)));
    return {
      isCorrect: true,
      lossScore: 0,
      lossVector,
      selectedOption,
      nextTheta,
      mastered: true,
    };
  }

  const axis = selectedOption.diagnosticAxis || 'conceptGap';
  lossVector[axis] = 0.85;
  const lossScore = 0.85;
  const nextTheta = Math.max(0.05, Number((currentTheta - 0.05).toFixed(3)));

  return {
    isCorrect: false,
    lossScore,
    lossVector,
    selectedOption,
    nextTheta,
    mastered: false,
  };
}
