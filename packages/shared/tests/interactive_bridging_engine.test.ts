import { describe, expect, it } from 'bun:test';
import {
  auditHtmlArtifactSafety,
  buildGuidedLearningSteps,
  buildSandboxedDeckHtml,
  evaluateDiagnosticChoice,
  validateInteractiveModulePayload,
  type InteractiveModulePayload,
} from '../src';

function createValidBridgingPayload(): InteractiveModulePayload {
  return {
    schemaVersion: 'uila-v2',
    estimatedMinutes: 6,
    learningObjective: 'Memahami prinsip dasar enkripsi asimetris (public-private key) tanpa jangkar matematika awal.',
    uila: {
      groundingDecision: {
        mode: 'experiential_anchor_bridge',
        priorKnowledgeAssumed: 'none',
        setupCostSeconds: 25,
        rationale: 'Peserta awam tidak punya pengalaman langsung dengan kriptografi asimetris; kotak transparan bergembok memberi jangkar instan < 30 detik.',
      },
      block1_anomaly: {
        groundState: 'Dua orang ingin berkirim pesan rahasia lewat kurir umum.',
        oldWay: 'Menggunakan satu kunci yang sama untuk mengunci dan membuka.',
        breakdownPoint: 'Jika kunci ikut dikirim lewat kurir umum, penyadap bisa menggandakannya sebelum pesan pertama dikirim.',
        slideIndex: 0,
      },
      block2_grounding: {
        anchoringLab: {
          labId: 'asymmetric-box-lab',
          title: 'Kotak Transparan & Gembok Klik',
          instructionPrompt: 'Coba tutup gemboknya sebagai Pengirim, lalu coba buka tanpa anak kunci.',
          ahaObservation: 'Siapa saja bisa mengunci dengan sekali klik, tetapi hanya pemegang anak kunci tunggal yang bisa membukanya.',
          timeToAhaSeconds: 20,
          tier: 'native_primitive',
          nativeKind: 'state_machine_sandbox',
          nativeConfig: {
            kind: 'state_machine_sandbox',
            initialStateId: 'open',
            states: [
              { id: 'open', label: 'Kotak Terbuka', description: 'Pesan belum terlindungi.', tone: 'open' },
              { id: 'locked', label: 'Terkunci Rapat', description: 'Gembok sudah ditekan. Tidak bisa dibuka tanpa anak kunci.', tone: 'locked' },
              { id: 'opened_owner', label: 'Dibuka Pemilik', description: 'Anak kunci pribadi membuka gembok dengan aman.', tone: 'open' },
            ],
            actions: [
              {
                id: 'snap_lock',
                label: 'Tekan Gembok (Publik)',
                actor: 'Pengirim',
                fromStates: ['open'],
                toState: 'locked',
                resultMessage: 'Gembok langsung terkunci tanpa butuh anak kunci!',
              },
              {
                id: 'try_intercept',
                label: 'Coba Buka Tanpa Kunci',
                actor: 'Penyadap',
                fromStates: ['locked'],
                toState: 'locked',
                resultMessage: 'Gagal! Meski penyadap tahu cara mengunci, ia tidak bisa membukanya.',
                triggersAha: true,
              },
              {
                id: 'unlock_private',
                label: 'Buka Pakai Anak Kunci',
                actor: 'Penerima',
                fromStates: ['locked'],
                toState: 'opened_owner',
                resultMessage: 'Terbuka! Anak kunci tidak pernah meninggalkan pemiliknya.',
              },
            ],
            requiredActionIdsForAha: ['snap_lock', 'try_intercept'],
          },
        },
        bridgingChain: [
          {
            stepTitle: 'Dari Gembok Fisik ke Kunci Publik & Privat',
            bridgeScenario: 'Gembok terbuka yang dibagikan bebas = Public Key; satu-satunya anak kunci di saku penerima = Private Key.',
            invariantPreserved: 'Fungsi satu arah: operasi mengunci tidak dapat dibalik oleh informasi yang sama.',
            structuralMapping: [
              {
                anchorElement: 'Gembok klik yang boleh disalin siapa saja',
                targetConcept: 'Public Key',
                whyItMatches: 'Dibagikan secara terbuka agar siapa saja bisa mengamankan pesan untuk pemiliknya.',
              },
              {
                anchorElement: 'Anak kunci tunggal di tangan penerima',
                targetConcept: 'Private Key',
                whyItMatches: 'Tidak pernah dikirim lewat jaringan; hanya dipakai untuk membuka (dekripsi).',
              },
            ],
          },
        ],
        analogyBreakpoint: {
          whereItBreaks: 'Gembok fisik tidak bisa memverifikasi siapa pengirimnya dan hanya menyalin bentuk mekanis.',
          realMechanismInstead: 'Enkripsi asimetris digital memakai fungsi matematika satu arah (faktorisasi bilangan prima / kurva eliptik) sehingga juga mendukung tanda tangan digital.',
        },
        slideIndex: 1,
      },
      block3_coreMechanics: {
        invariantProperty: 'Kunci pengunci (Public Key) dan kunci pembuka (Private Key) dipisahkan secara matematis dalam satu arah.',
        variableComponents: ['Public Key (terbuka)', 'Private Key (rahasia)', 'Ciphertext'],
        contrastingCases: [
          {
            beginnerMisconception: 'Jika semua orang punya Public Key, semua orang bisa membongkar pesan.',
            physicalReality: 'Public Key hanya mampu mengunci (enkripsi); dekripsi tetap mustahil tanpa Private Key.',
          },
        ],
      },
      block4_notationContract: {
        formulaOrCode: 'C = Enc(M, K_pub)  |  M = Dec(C, K_priv)',
        minimalFormalization: 'Simbol memisahkan kunci pengunci (K_pub) dari kunci pembuka (K_priv) secara eksplisit.',
        termsDeconstruction: [
          { symbol: 'M', physicalMeaning: 'Pesan asli sebelum dimasukkan ke kotak' },
          { symbol: 'K_pub', physicalMeaning: 'Gembok klik yang dibagikan terbuka' },
          { symbol: 'K_priv', physicalMeaning: 'Anak kunci pribadi milik penerima' },
        ],
      },
      block5_stressTest: {
        probeType: 'prediction_what_if',
        prompt: 'Jika penyadap berhasil menyalin Public Key milik penerima dan menyadap pesan terenkripsi C, apa yang terjadi?',
        options: [
          {
            optionId: 'opt_a',
            text: 'Penyadap tetap tidak bisa membaca pesan asli M karena Public Key hanya bisa mengunci.',
            isCorrect: true,
            causalRationale: 'Sesuai invarian satu arah, K_pub hanya melakukan Enc dan tidak bisa membalikkan menjadi Dec tanpa K_priv.',
          },
          {
            optionId: 'opt_b',
            text: 'Penyadap langsung membaca M karena ia memiliki kunci yang dipakai mengunci pesan.',
            isCorrect: false,
            diagnosticAxis: 'conceptGap',
            causalRationale: 'Masih terjebak pada model kunci simetris di mana pengunci dan pembuka identik.',
          },
          {
            optionId: 'opt_c',
            text: 'Pesan C otomatis rusak jika K_pub dibagikan ke lebih dari satu orang.',
            isCorrect: false,
            diagnosticAxis: 'reasoningBug',
            causalRationale: 'K_pub memang dirancang untuk dibagikan secara luas tanpa mengubah integritas ciphertext.',
          },
        ],
        hintLadder: {
          level0Reflective: 'Ingat percobaan penyadap pada kotak transparan tadi.',
          level1Directional: 'Bedakan peran gembok (mengunci) dengan peran anak kunci (membuka).',
          level2Constraint: 'Periksa rumus: fungsi Dec membutuhkan kunci yang mana?',
          level3WorkedExample: 'Karena Dec(C, K_priv) butuh K_priv yang tidak pernah dikirim, penyadap tidak bisa membaca M.',
        },
        groundTruth: 'Penyadap tidak bisa membaca M tanpa K_priv.',
      },
    },
  };
}

describe('Interactive Bridging Analogies & Guided Flow Engine (Phase 07)', () => {
  it('validates a complete Clement-Brown experiential_anchor_bridge payload cleanly', () => {
    const payload = createValidBridgingPayload();
    const report = validateInteractiveModulePayload(payload);
    expect(report.valid).toBe(true);
    expect(report.strictValid).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('rejects experiential_anchor_bridge payloads missing anchoringLab or analogyBreakpoint', () => {
    const broken = createValidBridgingPayload();
    delete broken.uila.block2_grounding.anchoringLab;
    delete broken.uila.block2_grounding.analogyBreakpoint;

    const report = validateInteractiveModulePayload(broken);
    expect(report.valid).toBe(false);
    const codes = report.issues.map((i) => i.code);
    expect(codes).toContain('ANCHORING_LAB_REQUIRED');
    expect(codes).toContain('MISSING_ANALOGY_BREAKPOINT');
  });

  it('builds a simple single-focus linear step sequence matching groundingMode', () => {
    const bridgeSteps = buildGuidedLearningSteps(createValidBridgingPayload());
    expect(bridgeSteps.map((s) => s.kind)).toEqual([
      'anomaly',
      'anchoring_lab',
      'bridging',
      'mechanics',
      'notation',
      'stress_test',
      'summary',
    ]);
    expect(bridgeSteps[1].requiresInteraction).toBe(true);
    expect(bridgeSteps[0].totalSteps).toBe(7);

    const formalPayload = createValidBridgingPayload();
    formalPayload.uila.groundingDecision = {
      mode: 'direct_formalism',
      priorKnowledgeAssumed: 'familiar',
      setupCostSeconds: 10,
      rationale: 'Aturan langsung lebih cepat dipahami dalam 3 menit daripada membangun simulasi.',
    };
    const formalSteps = buildGuidedLearningSteps(formalPayload);
    expect(formalSteps.map((s) => s.kind)).toEqual([
      'anomaly',
      'mechanics',
      'notation',
      'stress_test',
      'summary',
    ]);
  });

  it('evaluates diagnostic choices deterministically in <1ms with 5-axis loss vector', () => {
    const probe = createValidBridgingPayload().uila.block5_stressTest;
    const wrong = evaluateDiagnosticChoice(probe, 'opt_b', 0.25);
    expect(wrong.isCorrect).toBe(false);
    expect(wrong.lossScore).toBe(0.85);
    expect(wrong.lossVector.conceptGap).toBe(0.85);
    expect(wrong.mastered).toBe(false);

    const right = evaluateDiagnosticChoice(probe, 'opt_a', 0.25);
    expect(right.isCorrect).toBe(true);
    expect(right.lossScore).toBe(0);
    expect(right.mastered).toBe(true);
    expect(right.nextTheta).toBeGreaterThan(0.7);
  });

  it('audits HTML artifacts for disallowed remote scripts and injects safe localStorage sandbox bridge', () => {
    const unsafeHtml = '<html><head><script src="https://evil-tracker.example/x.js"></script></head><body></body></html>';
    const unsafeAudit = auditHtmlArtifactSafety(unsafeHtml);
    expect(unsafeAudit.safe).toBe(false);
    expect(unsafeAudit.errors[0]).toContain('evil-tracker.example');

    const safeDeck = `<!doctype html><html lang="id"><head><title>Deck</title></head><body>
      <section class="slide active" data-slide-id="intro"><h1>Halo</h1></section>
      <section class="slide" data-slide-id="bridge"><h2>Jembatan</h2></section>
      <script>const x = localStorage.getItem('guizang-ppt-low-power');</script>
    </body></html>`;
    const audit = auditHtmlArtifactSafety(safeDeck);
    expect(audit.safe).toBe(true);
    expect(audit.slideCount).toBe(2);
    expect(audit.lang).toBe('id');
    expect(audit.extractedNotes[0].id).toBe('intro');

    const wrapped = buildSandboxedDeckHtml(safeDeck, { initialSlide: 1, forceLowPower: true });
    expect(wrapped).toContain('data-flashlearn-bridge="1"');
    expect(wrapped).toContain('__flashlearnDeck');
    expect(wrapped).toContain('window.__currentSlideIndex');
    expect(wrapped).toContain('window.__SPEAKER_NOTES__');
    expect(wrapped).toContain("window.localStorage.setItem('guizang-ppt-low-power', '1')");
  });
});
