import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { TaskEntity } from '../src/domain/entities/Task';
import { AttemptEntity } from '../src/domain/entities/Attempt';

describe('Phase 03: Task Bank & Multi-Tier Oracle Evaluation Engine', () => {
  let workspaceId: string;
  let learnerId: string;
  let compNodeA: any;
  let compNodeB: any;
  let taskA: TaskEntity;
  let taskB: TaskEntity;

  beforeAll(async () => {
    const workspaces = await container.workspaceRepository.listAll();
    if (workspaces.length === 0) throw new Error('No workspace found');
    workspaceId = workspaces[0].id;

    const admin = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!admin) throw new Error('Admin not found');
    learnerId = admin.id;

    // Create or retrieve testing competency nodes
    let existingA = await container.competencyRepository.findByCode(workspaceId, 'HPS-CALC-01');
    if (!existingA) {
      existingA = await container.createCompetencyNodeUseCase.execute({
        workspaceId,
        code: 'HPS-CALC-01',
        title: 'Kalkulasi HPS & Pajak Terstandar',
        description: 'Perhitungan deterministik batas keuntungan dan PPN 11%',
        oracleClass: 'A',
        riskLevel: 'low',
      });
    }
    compNodeA = existingA;

    let existingB = await container.competencyRepository.findByCode(workspaceId, 'HPS-AUDIT-02');
    if (!existingB) {
      existingB = await container.createCompetencyNodeUseCase.execute({
        workspaceId,
        code: 'HPS-AUDIT-02',
        title: 'Penanganan Dugaan Sengketa & Investigasi Audit',
        description: 'Evaluasi kasus sengketa vendor terafiliasi dengan rubrik pakar',
        oracleClass: 'B',
        riskLevel: 'high',
      });
    }
    compNodeB = existingB;
  });

  test('Creates Class A task with deterministic formula and checklist oracle', async () => {
    taskA = await container.createTaskUseCase.execute({
      competencyId: compNodeA.id,
      title: 'Perhitungan HPS Pengadaan 100 Unit Laptop Kantor',
      scenario: 'Hitung HPS dengan dasar biaya riil Rp 1.000.000.000, overhead/laba 10% (Rp 100.000.000), dan PPN 11%.',
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: {
          hps_total: { expectedValue: 1221000000, tolerance: 100 },
          ppn_11_persen: { expectedValue: 121000000, tolerance: 10 },
          overhead_laba: { expectedValue: 100000000, tolerance: 10 },
        },
        requiredChecklistItems: ['lampiran_survei_toko', 'surat_penunjukan_ppk'],
      },
      rubricCriteria: [
        { id: 'hps_total', title: 'Akurasi HPS Total Termasuk PPN', weight: 40, description: 'Sesuai formula HPS' },
        { id: 'ppn_11_persen', title: 'Perhitungan PPN 11%', weight: 20, description: 'Tarif PPN berlaku' },
        { id: 'overhead_laba', title: 'Batas Overhead', weight: 20, description: 'Maksimal 15%' },
        { id: 'lampiran_survei_toko', title: 'Dokumen Survei Pasar', weight: 10, description: 'Bukti survei minimal 3 toko' },
        { id: 'surat_penunjukan_ppk', title: 'SK Tim Penyusun', weight: 10, description: 'SK PPK' },
      ],
      passingScore: 85,
    });

    expect(taskA).toBeInstanceOf(TaskEntity);
    expect(taskA.taskType).toBe('calculation');
    expect(taskA.passingScore).toBe(85);
  });

  test('Class A Evaluator deterministically rejects wrong calculations and generates 3D flashcards', async () => {
    // Incorrect calculation submission
    const badSubmission = {
      hps_total: 1000000000, // WRONG (forgot PPN and overhead)
      ppn_11_persen: 50000000,  // WRONG
      overhead_laba: 100000000, // CORRECT
      lampiran_survei_toko: true,
      // surat_penunjukan_ppk missing (WRONG)
    };

    const res = await container.evaluateAttemptUseCase.execute(learnerId, {
      taskId: taskA.id,
      submission: badSubmission,
    });

    expect(res.passed).toBe(false);
    expect(res.attempt.score).toBeLessThan(85);
    expect(res.attempt.assessedBy).toBe('oracle_class_a_deterministic');
    expect(res.generatedFlashcards.length).toBeGreaterThan(0);

    const flashcard = res.generatedFlashcards[0];
    expect(flashcard.front).toContain('hps_total');
    expect(flashcard.back).toContain('1221000000');
  });

  test('Class A Evaluator passes accurate submission and updates mastery ledger', async () => {
    const perfectSubmission = {
      hps_total: 1221000000,
      ppn_11_persen: 121000000,
      overhead_laba: 100000000,
      lampiran_survei_toko: true,
      surat_penunjukan_ppk: true,
    };

    const res = await container.evaluateAttemptUseCase.execute(learnerId, {
      taskId: taskA.id,
      submission: perfectSubmission,
    });

    expect(res.passed).toBe(true);
    expect(res.attempt.score).toBe(100);
    expect(res.attempt.assessedBy).toBe('oracle_class_a_deterministic');

    // Verify Mastery Record updated in DB
    const mastery = await container.masteryRepository.findByUserAndCompetency(learnerId, compNodeA.id);
    expect(mastery?.isMastered()).toBe(true);
    expect(mastery?.verifiedAttemptId).toBe(res.attempt.id);
  });

  test('Creates Class B task with Gold Solution and Negative Anchors (Traps)', async () => {
    taskB = await container.createTaskUseCase.execute({
      competencyId: compNodeB.id,
      title: 'Studi Kasus Sengketa Penunjukan Vendor Tunggal',
      scenario: 'Terjadi tender gagal dua kali. PPK bermaksud melakukan penunjukan langsung kepada PT Maju Bersama, namun terdapat laporan bahwa direktur PT Maju Bersama adalah saudara kandung PPK.',
      taskType: 'case_study',
      oracleData: {
        goldSolution: 'PPK wajib mendeklarasikan potensi benturan kepentingan (conflict of interest) dan melimpahkan kewenangan penunjukan kepada Kuasa Pengguna Anggaran (KPA) atau menunjuk PPK Pengganti serta meminta reviu APIP.',
        negativeAnchors: [
          {
            id: 'trap_nepotisme',
            trapDescription: 'Menyetujui penunjukan langsung tanpa mendeklarasikan benturan kepentingan atau tanpa PPK pengganti',
            penaltyPoints: 60,
            fatal: true,
          },
          {
            id: 'trap_tanpa_apip',
            trapDescription: 'Melakukan penunjukan langsung tanpa meminta probity audit / reviu APIP pengawas internal',
            penaltyPoints: 25,
            fatal: false,
          },
        ],
        keyTakeaways: [
          'Benturan kepentingan wajib dideklarasikan secara tertulis.',
          'Penunjukan langsung tender gagal wajib disertai audit probity APIP.',
        ],
      },
      rubricCriteria: [
        { id: 'crit_mitigasi_konflik', title: 'Mitigasi Benturan Kepentingan', weight: 50, description: 'Langkah pencegahan nepotisme' },
        { id: 'crit_dasar_hukum', title: 'Kepatuhan Regulasi Tender Gagal', weight: 30, description: 'Sesuai Perpres 12/2021' },
        { id: 'crit_pelibatan_apip', title: 'Pelibatan Pengawas Internal APIP', weight: 20, description: 'Reviu audit sebelum kontrak' },
      ],
      passingScore: 80,
    });

    expect(taskB).toBeInstanceOf(TaskEntity);
    expect(taskB.oracleData.negativeAnchors.length).toBe(2);
  });

  test('Class B AI Judge Evaluator detects fatal trap and penalizes submission', async () => {
    const biasedSubmission = {
      text: 'Karena tender sudah gagal dua kali, maka penunjukan langsung kepada PT Maju Bersama sah secara hukum untuk mengejar target waktu. Hubungan keluarga direktur tidak perlu dipersoalkan karena harga mereka paling murah.',
    };

    const res = await container.evaluateAttemptUseCase.execute(learnerId, {
      taskId: taskB.id,
      submission: biasedSubmission,
    });

    expect(res.attempt.assessedBy).toBe('oracle_class_b_ai_judge');
    expect(res.passed).toBe(false);
    expect(res.attempt.feedback).toContain('FATAL TRAP');
    expect(res.generatedFlashcards.length).toBeGreaterThan(0);
  }, 45000);
});
