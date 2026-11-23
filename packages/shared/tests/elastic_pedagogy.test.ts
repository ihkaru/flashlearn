import { describe, expect, it } from 'bun:test';
import {
  buildGuidedLearningSteps,
  evaluateDiagnosticChoice,
  validateInteractiveModulePayload,
  type InteractiveModulePayload,
} from '../src';

function createMicroKnowPayload(): InteractiveModulePayload {
  return {
    schemaVersion: 'uila-v2',
    knowledgeProfile: 'micro_know',
    estimatedMinutes: 3,
    learningObjective: 'Mengenali fungsi dasar status HTTP 200, 404, dan 500.',
    unitMeta: {
      unitCode: 'U01',
      unitTitle: 'Pertemuan 1: Dasar Web HTTP',
      unitOrder: 1,
      moduleOrder: 1,
      targetLectureMinutes: 60,
    },
    microKnow: {
      coreIdea: 'Kode status HTTP memberi tahu dalam 3 digit apakah permintaan berhasil, salah alamat, atau gagal di server.',
      whyItMatters: 'Mempercepat diagnosis error tanpa menebak apakah masalah ada di klien atau server.',
      concreteExamples: [
        { label: '200 OK', detail: 'Server menemukan data dan mengirimnya normal.' },
        { label: '404 Not Found', detail: 'URL yang diminta tidak ada di server.' },
      ],
      keyTakeaways: ['2xx = berhasil', '4xx = keliru di sisi klien', '5xx = gagal di sisi server'],
      slideIndex: 0,
    },
    uila: {
      groundingDecision: {
        mode: 'direct_formalism',
        priorKnowledgeAssumed: 'familiar',
        setupCostSeconds: 5,
        rationale: 'Fakta klasifikasi 3 kategori langsung dipahami dalam 2 menit tanpa perlu simulasi.',
      },
      block1_anomaly: { groundState: '', oldWay: '', breakdownPoint: '' },
      block2_grounding: {},
      block3_coreMechanics: { invariantProperty: '', variableComponents: [], contrastingCases: [] },
      block4_notationContract: { formulaOrCode: '', minimalFormalization: '', termsDeconstruction: [] },
      block5_stressTest: {
        probeType: 'prediction_what_if',
        prompt: 'Endpoint salah ketik mengembalikan status 404. Di sisi mana letak penyebab utamanya?',
        options: [
          {
            optionId: 'a',
            text: 'Sisi klien / URL tujuan yang tidak ditemukan di server.',
            isCorrect: true,
            causalRationale: 'Rentang 4xx menunjukkan permintaan klien merujuk sumber yang tidak ada.',
          },
          {
            optionId: 'b',
            text: 'Server mati total karena kelebihan RAM.',
            isCorrect: false,
            diagnosticAxis: 'conceptGap',
            causalRationale: 'Kegagalan internal server berada pada rentang 5xx, bukan 404.',
          },
        ],
        hintLadder: {
          level0Reflective: 'Lihat digit pertama pada angka 404.',
          level1Directional: 'Bedakan arti awalan 4xx dengan 5xx.',
          level2Constraint: '4xx menandakan masalah pada permintaan klien.',
          level3WorkedExample: '404 berarti resource di URL tersebut tidak ditemukan.',
        },
        groundTruth: 'Sisi klien / URL tujuan tidak ditemukan.',
        slideIndex: 2,
      },
    },
    summarySlideIndex: 3,
  };
}

function createProceduralAndIllStructuredBase(): InteractiveModulePayload {
  return {
    schemaVersion: 'uila-v2',
    knowledgeProfile: 'procedural_do',
    estimatedMinutes: 7,
    learningObjective: 'Menemukan dan memperbaiki bug off-by-one pada paginasi offset SQL.',
    hingeCheck: {
      prompt: 'Untuk halaman ke-2 dengan 10 baris per halaman, berapa nilai OFFSET?',
      options: [
        { id: 'h1', text: '10', isCorrect: true, feedback: 'Benar: (2 - 1) * 10 = 10.' },
        { id: 'h2', text: '20', isCorrect: false, feedback: 'OFFSET 20 melompati halaman ke-2.' },
      ],
      remediationCard: 'Ingat halaman 1 dimulai dari OFFSET 0, jadi halaman ke-p selalu mulai di (p - 1) * limit.',
      slideIndex: 2,
    },
    erroneousExample: {
      title: 'Cari Bug Paginasi',
      scenarioPrompt: 'Developer menulis query untuk mengambil halaman ke-p dengan limit L baris.',
      steps: [
        { stepNumber: 1, label: 'Validasi halaman', content: 'page = Math.max(1, inputPage)' },
        { stepNumber: 2, label: 'Hitung offset', content: 'offset = page * limit', isFlawed: true },
        { stepNumber: 3, label: 'Jalankan query', content: 'SELECT * FROM items LIMIT limit OFFSET offset' },
      ],
      flawedStepNumber: 2,
      fixOptions: [
        {
          id: 'fix1',
          text: 'offset = (page - 1) * limit',
          isCorrect: true,
          rationale: 'Halaman 1 mulai dari 0, halaman 2 dari limit, dst.',
        },
        {
          id: 'fix2',
          text: 'offset = page + limit',
          isCorrect: false,
          rationale: 'Penjumlahan tidak menghitung jumlah baris seluruh halaman sebelumnya.',
        },
      ],
      takeaway: 'Selalu uji kasus batas page = 1 untuk memastikan OFFSET = 0.',
      slideIndex: 4,
    },
    explainBack: {
      prompt: 'Mengapa halaman 1 harus memakai OFFSET 0, bukan OFFSET 1?',
      mode: 'select_causal_explanation',
      referenceKeyPoints: ['OFFSET menghitung jumlah baris yang dilewati sebelum mengambil hasil.'],
      choices: [
        {
          id: 'eb1',
          text: 'Karena OFFSET menghitung berapa baris awal yang dilewati; OFFSET 1 akan membuang data pertama.',
          isCorrect: true as any,
          isStrong: true,
          feedback: 'Tepat sekali.',
        },
        {
          id: 'eb2',
          text: 'Karena database hanya menerima angka genap.',
          isStrong: false,
          feedback: 'Keliru: OFFSET menerima bilangan cacah mana pun mulai 0.',
        },
      ],
      slideIndex: 6,
    },
    uila: {
      groundingDecision: {
        mode: 'direct_formalism',
        priorKnowledgeAssumed: 'partial',
        setupCostSeconds: 15,
        rationale: 'Aturan indeks berbasis-0 lebih cepat dikuasai lewat worked + erroneous example.',
      },
      block1_anomaly: {
        groundState: 'Daftar produk dipecah menjadi beberapa halaman berisi 10 item.',
        oldWay: 'Mengalikan langsung nomor halaman dengan jumlah item.',
        breakdownPoint: 'Sepuluh produk pertama menghilang total di halaman 1.',
        slideIndex: 0,
      },
      block2_grounding: {},
      block3_coreMechanics: {
        invariantProperty: 'OFFSET adalah jumlah baris yang dilewati, bukan indeks nomor halaman.',
        variableComponents: ['page (1-based)', 'limit', 'offset (0-based)'],
        contrastingCases: [
          {
            beginnerMisconception: 'Halaman 1 berarti OFFSET 1 atau OFFSET limit.',
            physicalReality: 'Halaman 1 tidak melewati baris apa pun sehingga OFFSET wajib 0.',
          },
        ],
        slideIndex: 3,
      },
      block4_notationContract: {
        formulaOrCode: 'offset = (page - 1) * limit',
        minimalFormalization: 'Kurangi 1 dulu agar halaman pertama melewati 0 baris.',
        termsDeconstruction: [{ symbol: 'page - 1', physicalMeaning: 'Jumlah halaman penuh sebelum halaman aktif' }],
        workedExampleSummary: 'page=3, limit=10 -> melewati 2 halaman (20 baris) -> OFFSET 20.',
      },
      block5_stressTest: {
        probeType: 'prediction_what_if',
        prompt: 'Untuk halaman ke-4 dengan limit 15, berapa OFFSET yang benar?',
        options: [
          { optionId: 'o1', text: '45', isCorrect: true, causalRationale: '(4 - 1) * 15 = 45.' },
          { optionId: 'o2', text: '60', isCorrect: false, diagnosticAxis: 'reasoningBug', causalRationale: 'Lupa mengurangi 1 pada page.' },
          { optionId: 'o3', text: '15', isCorrect: false, diagnosticAxis: 'conceptGap', causalRationale: 'Hanya melewati 1 halaman.' },
        ],
        hintLadder: {
          level0Reflective: 'Berapa halaman penuh sebelum halaman 4?',
          level1Directional: 'Kalikan jumlah halaman sebelumnya dengan 15.',
          level2Constraint: 'Hitung (4 - 1) * 15.',
          level3WorkedExample: '3 * 15 = 45 baris dilewati.',
        },
        groundTruth: '45',
        slideIndex: 5,
      },
    },
    summarySlideIndex: 7,
  };
}

describe('Phase 13 Elastic Pedagogy Profiles & Confidence Calibration', () => {
  it('validates and compiles micro_know into a clean 4-step fast track without forced breakdown/formulas', () => {
    const payload = createMicroKnowPayload();
    const report = validateInteractiveModulePayload(payload);
    expect(report.valid).toBe(true);
    expect(report.strictValid).toBe(true);

    const steps = buildGuidedLearningSteps(payload);
    expect(steps.map((s) => s.kind)).toEqual(['micro_core', 'micro_examples', 'stress_test', 'summary']);
    expect(steps[2].preferCollapsedDeck).toBe(true);
    expect(steps[2].slideIndex).toBe(2);
    expect(steps[3].slideIndex).toBe(3);
  });

  it('compiles procedural_do direct_formalism with hinge_check AFTER mechanics so learners see rules first', () => {
    const payload = createProceduralAndIllStructuredBase();
    const report = validateInteractiveModulePayload(payload);
    expect(report.valid).toBe(true);

    const steps = buildGuidedLearningSteps(payload);
    expect(steps.map((s) => s.kind)).toEqual([
      'anomaly',
      'mechanics',
      'hinge_check',
      'notation',
      'erroneous_example',
      'stress_test',
      'explain_back',
      'summary',
    ]);
    expect(steps.find((s) => s.kind === 'hinge_check')?.preferCollapsedDeck).toBe(true);
    expect(steps.find((s) => s.kind === 'erroneous_example')?.preferCollapsedDeck).toBe(true);
  });

  it('keeps hinge_check BEFORE mechanics when Block 2 grounding exists and supports unbounded 1..N elastic items + slideRange', () => {
    const payload = createProceduralAndIllStructuredBase();
    payload.uila.groundingDecision.mode = 'direct_analogy';
    payload.uila.block2_grounding = {
      physicalObject: 'Tumpukan kartu absensi per 10 lembar',
      analogyBreakpoint: {
        whereItBreaks: 'Kartu fisik mulai dari 1, sedangkan OFFSET menghitung kartu yang dilewati (0).',
        realMechanismInstead: 'Database menghitung skip-count mulai 0.',
      },
      slideIndex: 1,
      slideEndIndex: 2,
    };
    payload.additionalHingeChecks = [
      {
        prompt: 'Untuk halaman ke-3 dengan limit 10, berapa nilai OFFSET?',
        options: [
          { id: 'a', text: '20', isCorrect: true, feedback: 'Benar: (3 - 1) * 10 = 20.' },
          { id: 'b', text: '30', isCorrect: false, feedback: 'Itu melewati 3 halaman penuh.' },
        ],
        remediationCard: 'Kurangi nomor halaman dengan 1 sebelum mengalikan limit.',
      },
    ];
    payload.additionalStressTests = [
      {
        ...payload.uila.block5_stressTest,
        prompt: 'Untuk halaman ke-1 dengan limit 25, berapa nilai OFFSET?',
      },
    ];

    const report = validateInteractiveModulePayload(payload);
    expect(report.valid).toBe(true);

    const steps = buildGuidedLearningSteps(payload);
    expect(steps.map((s) => s.id)).toEqual([
      'step-anomaly',
      'step-bridging',
      'step-hinge-check',
      'step-hinge-check-2',
      'step-mechanics',
      'step-notation',
      'step-erroneous-example',
      'step-stress-test',
      'step-stress-test-2',
      'step-explain-back',
      'step-summary',
    ]);
    expect(steps.find((s) => s.id === 'step-bridging')?.slideRange).toEqual([1, 2]);
    expect(steps.find((s) => s.id === 'step-hinge-check-2')?.itemIndex).toBe(1);
    expect(steps.find((s) => s.id === 'step-stress-test-2')?.itemIndex).toBe(1);
  });

  it('validates ill_structured_case without requiring a rigid math formula contract', () => {
    const payload = createProceduralAndIllStructuredBase();
    payload.knowledgeProfile = 'ill_structured_case';
    delete payload.erroneousExample;
    payload.uila.block4_notationContract = { formulaOrCode: '', minimalFormalization: '', termsDeconstruction: [] };
    payload.illStructuredCase = {
      dilemmaTitle: 'Prioritas Privasi vs Audit Publik',
      contextBrief: 'Instansi diminta membuka data mentah transaksi mikro ke publik.',
      perspectives: [
        {
          actorOrSchool: 'Transparansi Fiskal',
          claim: 'Keterbukaan mencegah korupsi anggaran.',
          supportingEvidence: 'Audit partisipatif menurunkan mark-up.',
          blindSpot: 'Risiko re-identifikasi individu dari data mikro.',
        },
        {
          actorOrSchool: 'Perlindungan Data Pribadi',
          claim: 'Data individu wajib dianonimkan sebelum rilis.',
          supportingEvidence: 'UU PDP mewajibkan minimisasi data.',
          blindSpot: 'Agregasi terlalu kasar menyembunyikan anomali pengadaan.',
        },
      ],
      corroborationQuestion: 'Bagaimana menggabungkan transparansi tanpa melanggar UU PDP?',
      rubricCriteria: [
        {
          criterion: 'Keseimbangan Bukti',
          strongIndicator: 'Menyebut mekanisme anonimisasi + audit agregat.',
          weakIndicator: 'Hanya memihak 1 kubu tanpa mitigasi risiko kubu lain.',
        },
      ],
      slideIndex: 4,
    };

    const report = validateInteractiveModulePayload(payload);
    expect(report.valid).toBe(true);

    const steps = buildGuidedLearningSteps(payload);
    expect(steps.map((s) => s.kind)).toContain('ill_structured_case');
    expect(steps.map((s) => s.kind)).not.toContain('notation');
  });

  it('classifies Confidence Calibration outcomes (overconfident misconception vs lucky guess vs calibrated mastery)', () => {
    const probe = createMicroKnowPayload().uila.block5_stressTest;

    const overconfident = evaluateDiagnosticChoice(probe, 'b', 0.3, 0.35, 'sure');
    expect(overconfident.isCorrect).toBe(false);
    expect(overconfident.calibrationOutcome).toBe('overconfident_misconception');
    expect(overconfident.requiresConsolidation).toBe(true);
    expect(overconfident.lossScore).toBe(0.95);

    const lucky = evaluateDiagnosticChoice(probe, 'a', 0.3, 0.35, 'guessing');
    expect(lucky.isCorrect).toBe(true);
    expect(lucky.calibrationOutcome).toBe('lucky_guess');
    expect(lucky.requiresConsolidation).toBe(true);

    const calibrated = evaluateDiagnosticChoice(probe, 'a', 0.3, 0.35, 'sure');
    expect(calibrated.isCorrect).toBe(true);
    expect(calibrated.calibrationOutcome).toBe('calibrated_mastery');
    expect(calibrated.requiresConsolidation).toBe(false);
    expect(calibrated.nextTheta).toBeGreaterThan(lucky.nextTheta);
  });

  it('flags unexplained acronyms via UNEXPLAINED_ACRONYM_WARNING until defined inline or in glossary', () => {
    const payload = createMicroKnowPayload();
    payload.microKnow!.coreIdea = 'Prosedur FDA dan NURBS sangat ketat.';
    const report1 = validateInteractiveModulePayload(payload);
    const warn1 = report1.issues.find((i) => i.code === 'UNEXPLAINED_ACRONYM_WARNING');
    expect(warn1).toBeDefined();
    expect(warn1?.message).toContain('FDA');
    expect(warn1?.message).toContain('NURBS');

    // Once defined inline or in glossary, warning clears cleanly
    payload.microKnow!.coreIdea = 'Prosedur badan pengawas obat AS (FDA) dan format NURBS sangat ketat.';
    payload.glossary = [{ term: 'NURBS', definition: 'Format file geometri 3D standar studio animasi.', tier: 3 }];
    const report2 = validateInteractiveModulePayload(payload);
    expect(report2.issues.find((i) => i.code === 'UNEXPLAINED_ACRONYM_WARNING')).toBeUndefined();
  });

  it('validates module figures[] contract and treats figure annotations as valid acronym glosses', () => {
    const payload = createMicroKnowPayload();
    payload.microKnow!.coreIdea = 'Lihat pembagian persentase alokasi target (TAPS) pada grafik sumber.';
    payload.figures = [
      {
        id: 'fig-04',
        assetUrl: './assets/fig-04.webp',
        caption: 'Tabel 6 Tangga TAPS',
        altText: 'Tabel alokasi target 6 kolom A sampai F.',
        stepKind: 'micro_core',
        sourcePage: 71,
        annotations: [
          { label: 'TAPS', explanation: 'Target Allocation Percentages — persentase target ideal.' },
        ],
      },
    ];
    const ok = validateInteractiveModulePayload(payload);
    expect(ok.valid).toBe(true);
    expect(ok.issues.find((i) => i.code === 'UNEXPLAINED_ACRONYM_WARNING')).toBeUndefined();

    // Missing caption/altText triggers INVALID_MODULE_FIGURE error
    payload.figures.push({
      id: 'fig-bad',
      assetUrl: './assets/bad.webp',
      caption: '',
      altText: '',
      stepKind: 'micro_core',
    });
    const bad = validateInteractiveModulePayload(payload);
    expect(bad.valid).toBe(false);
    expect(bad.issues.some((i) => i.code === 'INVALID_MODULE_FIGURE')).toBe(true);
  });
});
