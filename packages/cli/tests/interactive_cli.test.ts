import { describe, expect, it, spyOn } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../src/index';
import { ExitCode } from '../src/core/envelope';

const VALID_UILA_MANIFEST = {
  schemaVersion: 'uila-v2',
  estimatedMinutes: 5,
  learningObjective: 'Memahami interferensi gelombang lewat percobaan ketuk dua titik air.',
  uila: {
    groundingDecision: {
      mode: 'experiential_anchor_bridge',
      priorKnowledgeAssumed: 'none',
      setupCostSeconds: 20,
      rationale: 'Ketukan air membangun jangkar visual pola saling menguatkan dan meniadakan dalam 20 detik.',
    },
    block1_anomaly: {
      groundState: 'Partikel biasa bertumbukan seperti bola biliar.',
      oldWay: 'Menganggap dua sumber energi selalu saling menjumlahkan intensitasnya.',
      breakdownPoint: 'Pada skala gelombang, dua sumber bisa menghasilkan titik gelap yang justru saling meniadakan.',
      slideIndex: 0,
    },
    block2_grounding: {
      anchoringLab: {
        labId: 'ripple-tap-lab',
        title: 'Ketuk Dua Titik di Permukaan Air',
        instructionPrompt: 'Ketuk dua titik di permukaan air dan amati tempat riak bertemu.',
        ahaObservation: 'Puncak bertemu puncak saling menguatkan; puncak bertemu lembah saling meniadakan.',
        timeToAhaSeconds: 20,
        tier: 'native_primitive',
        nativeKind: 'wave_field_tapper',
        nativeConfig: {
          kind: 'wave_field_tapper',
          surfaceLabel: 'Permukaan Air Gelas',
          minTapsForAha: 2,
          constructiveLabel: 'Saling Menguatkan (Konstruktif)',
          destructiveLabel: 'Saling Meniadakan (Destruktif)',
        },
      },
      bridgingChain: [
        {
          stepTitle: 'Dari Riak Gelas ke Interferensi Gelombang',
          bridgeScenario: 'Tinggi riak di gelas berpadanan dengan amplitudo fase gelombang.',
          invariantPreserved: 'Superposisi linear: resultan adalah jumlah aljabar dua gelombang beserta tandanya.',
          structuralMapping: [
            {
              anchorElement: 'Puncak + Lembah air jadi datar',
              targetConcept: 'Interferensi Destruktif',
              whyItMatches: 'Fase berlawanan saling meniadakan amplitudo.',
            },
          ],
        },
      ],
      analogyBreakpoint: {
        whereItBreaks: 'Air membutuhkan medium molekul fisik untuk merambat.',
        realMechanismInstead: 'Gelombang elektromagnetik dan fungsi gelombang kuantum tidak memerlukan medium air/eter.',
      },
      slideIndex: 1,
    },
    block3_coreMechanics: {
      invariantProperty: 'Superposisi menjumlahkan amplitudo bertanda (fase), bukan sekadar intensitas positif.',
      variableComponents: ['Amplitudo', 'Beda Fase', 'Panjang Gelombang'],
      contrastingCases: [
        {
          beginnerMisconception: 'Dua sumber cahaya selalu membuat layar lebih terang di semua titik.',
          physicalReality: 'Di titik beda fase 180 derajat, dua gelombang justru menghasilkan pita gelap.',
        },
      ],
    },
    block4_notationContract: {
      formulaOrCode: 'psi_total = psi_1 + psi_2',
      minimalFormalization: 'Tanda plus menjumlahkan nilai bertanda (+ puncak, - lembah) di titik yang sama.',
      termsDeconstruction: [
        { symbol: 'psi_1, psi_2', physicalMeaning: 'Tinggi riak dari sumber 1 dan sumber 2' },
      ],
    },
    block5_stressTest: {
      probeType: 'prediction_what_if',
      prompt: 'Jika puncak gelombang A (+2) bertemu lembah gelombang B (-2) pada satu titik, apa hasilnya?',
      options: [
        {
          optionId: 'a',
          text: 'Resultan menjadi 0 (saling meniadakan sementara di titik itu).',
          isCorrect: true,
          causalRationale: 'Penjumlahan aljabar (+2) + (-2) = 0 sesuai prinsip superposisi.',
        },
        {
          optionId: 'b',
          text: 'Resultan menjadi 4 karena energi selalu bertambah.',
          isCorrect: false,
          diagnosticAxis: 'conceptGap',
          causalRationale: 'Mengabaikan tanda fase berlawanan antara puncak dan lembah.',
        },
        {
          optionId: 'c',
          text: 'Kedua gelombang berhenti total dan menghilang selamanya.',
          isCorrect: false,
          diagnosticAxis: 'reasoningBug',
          causalRationale: 'Setelah melewati titik pertemuan, tiap gelombang tetap melaju seperti semula.',
        },
      ],
      hintLadder: {
        level0Reflective: 'Ingat apa yang terjadi saat puncak riak bertemu lembah riak.',
        level1Directional: 'Gunakan penjumlahan bertanda positif dan negatif.',
        level2Constraint: 'Hitung (+2) + (-2) pada titik pertemuan.',
        level3WorkedExample: 'psi_total = (+2) + (-2) = 0, artinya terjadi interferensi destruktif.',
      },
      groundTruth: 'Resultan sesaat di titik pertemuan adalah 0.',
    },
  },
};

describe('Phase 08 Interactive CLI & Curriculum Package Importer', () => {
  it('validates interactive module + deck + local MediaVault image paths in --dry-run mode', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-cli-int-'));
    try {
      mkdirSync(join(dir, 'images'));
      writeFileSync(join(dir, 'images', '01-ripple.png'), Buffer.from([137, 80, 78, 71]));
      const manifestPath = join(dir, 'uila.json');
      const deckPath = join(dir, 'index.html');
      writeFileSync(manifestPath, JSON.stringify(VALID_UILA_MANIFEST));
      writeFileSync(
        deckPath,
        `<!doctype html><html lang="id"><head><title>Wave</title></head><body>
          <section class="slide active" data-slide-id="cover"><img src="images/01-ripple.png" /></section>
          <section class="slide" data-slide-id="bridge"><h2>Bridge</h2></section>
        </body></html>`
      );

      let stdout = '';
      let stderr = '';
      const outSpy = spyOn(process.stdout, 'write').mockImplementation((c: any) => {
        stdout += String(c);
        return true;
      });
      const errSpy = spyOn(process.stderr, 'write').mockImplementation((c: any) => {
        stderr += String(c);
        return true;
      });

      const code = await runCli([
        'content',
        'import-interactive',
        '--workspace-id=ws-demo',
        '--title=Interferensi Gelombang',
        '--slug=interferensi-gelombang',
        `--manifest=${manifestPath}`,
        `--deck=${deckPath}`,
        '--upload-media',
        '--dry-run',
      ]);

      outSpy.mockRestore();
      errSpy.mockRestore();

      expect(stderr).toBe('');
      expect(code).toBe(ExitCode.SUCCESS);
      const env = JSON.parse(stdout);
      expect(env.data.dryRun).toBe(true);
      expect(env.data.groundingMode).toBe('experiential_anchor_bridge');
      expect(env.data.deckSlideCount).toBe(2);
      expect(env.data.mediaUrls[0]).toContain('01-ripple.png');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects invalid interactive manifest lacking analogyBreakpoint with VALIDATION_ERROR', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-cli-bad-'));
    try {
      const broken = structuredClone(VALID_UILA_MANIFEST);
      delete (broken.uila.block2_grounding as any).analogyBreakpoint;
      const manifestPath = join(dir, 'broken.json');
      writeFileSync(manifestPath, JSON.stringify(broken));

      let stderr = '';
      const errSpy = spyOn(process.stderr, 'write').mockImplementation((c: any) => {
        stderr += String(c);
        return true;
      });
      const code = await runCli([
        'content',
        'import-interactive',
        '--workspace-id=ws-demo',
        '--title=Broken',
        `--manifest=${manifestPath}`,
        '--dry-run',
      ]);
      errSpy.mockRestore();

      expect(code).toBe(ExitCode.VALIDATION_ERROR);
      expect(stderr).toContain('INTERACTIVE_VALIDATION_FAILED');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('validates atomic workspace import-curriculum directory package in --dry-run mode', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-cli-pkg-'));
    try {
      writeFileSync(join(dir, 'uila-wave.json'), JSON.stringify(VALID_UILA_MANIFEST));
      writeFileSync(
        join(dir, 'curriculum-package.json'),
        JSON.stringify({
          workspaceId: 'ws-physics',
          modules: [
            {
              title: 'Interferensi Gelombang',
              slug: 'interferensi-gelombang',
              manifestFile: 'uila-wave.json',
            },
          ],
        })
      );

      let stdout = '';
      const outSpy = spyOn(process.stdout, 'write').mockImplementation((c: any) => {
        stdout += String(c);
        return true;
      });
      const code = await runCli(['domain', 'import-curriculum', `--dir=${dir}`, '--dry-run']);
      outSpy.mockRestore();

      expect(code).toBe(ExitCode.SUCCESS);
      const parsed = JSON.parse(stdout);
      expect(parsed.data.dryRun).toBe(true);
      expect(parsed.data.modulesImported).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
