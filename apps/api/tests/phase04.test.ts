import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { GateEntity } from '../src/domain/entities/Gate';
import { UserGateGrantEntity } from '../src/domain/entities/UserGateGrant';
import { GateAuthorizationEngine } from '../src/domain/services/GateAuthorizationEngine';

describe('Phase 04: Progressive Authorization Gates & Human Reviewer Workflow', () => {
  let workspaceId: string;
  let learnerId: string;
  let reviewerId: string;
  let compNodeA: any;
  let compNodeC: any;
  let taskC: any;
  let gateLevel0: GateEntity;
  let gateLevel3: GateEntity;

  beforeAll(async () => {
    const workspaces = await container.workspaceRepository.listAll();
    if (workspaces.length === 0) throw new Error('No workspace found');
    workspaceId = workspaces[0].id;

    // Learner: admin user
    const admin = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!admin) throw new Error('Admin user not found');
    learnerId = admin.id;

    // Reviewer: second superadmin or creator
    let expert = await container.userRepository.findByEmail('admin@dvlpid.my.id');
    if (!expert) {
      expert = await container.userRepository.create({
        email: 'admin@dvlpid.my.id',
        name: 'Senior Procurement Auditor (Expert)',
        role: 'superadmin',
      });
    }
    reviewerId = expert.id;

    // Setup or reuse Class A Competency
    compNodeA = await container.competencyRepository.findByCode(workspaceId, 'HPS-CALC-01');
    if (!compNodeA) {
      compNodeA = await container.createCompetencyNodeUseCase.execute({
        workspaceId,
        code: 'HPS-CALC-01',
        title: 'Kalkulasi HPS & Pajak Terstandar',
        description: 'Perhitungan deterministik batas keuntungan dan PPN 11%',
        oracleClass: 'A',
        riskLevel: 'low',
      });
    }

    // Setup Class C Competency (High risk judgment)
    compNodeC = await container.competencyRepository.findByCode(workspaceId, 'PPK-NEGOT-03');
    if (!compNodeC) {
      compNodeC = await container.createCompetencyNodeUseCase.execute({
        workspaceId,
        code: 'PPK-NEGOT-03',
        title: 'Negosiasi Teknis & Klarifikasi Dokumen Rahasia',
        description: 'Penilaian pertimbangan diskresi PPK dalam negosiasi pengadaan bernilai strategis',
        oracleClass: 'C',
        riskLevel: 'high',
      });
    }

    // Setup Class C Task
    taskC = await container.createTaskUseCase.execute({
      competencyId: compNodeC.id,
      title: 'Diskresi Penyesuaian Spesifikasi Teknis Darurat Bencana',
      scenario: 'Dalam kondisi darurat bencana alam, PPK harus mengambil keputusan cepat memilih penyedia tunggal dengan deviasi teknis 15% dari standar normal.',
      taskType: 'case_study',
      oracleData: {
        expertGuidance: 'Keputusan harus didukung Berita Acara Kedaruratan dan persetujuan tertulis KPA.',
      },
      rubricCriteria: [
        { id: 'crit_legalitas_darurat', title: 'Justifikasi Hukum Darurat', weight: 40, description: 'Kepatuhan klausul keadaan darurat' },
        { id: 'crit_kewajaran_harga', title: 'Analisis Kewajaran Biaya', weight: 30, description: 'Audit pasca pelaksanaan' },
        { id: 'crit_mitigasi_akuntabilitas', title: 'Mitigasi Risiko APIP', weight: 30, description: 'Pelibatan BPKP / Inspektorat' },
      ],
      passingScore: 80,
    });
  });

  test('Creates Gate Level 0 (Observation) and Gate Level 3 (High-Risk Independent)', async () => {
    let existing0 = await container.gateRepository.findByWorkspaceAndLevel(workspaceId, 0);
    if (!existing0) {
      existing0 = await container.createGateUseCase.execute({
        workspaceId,
        level: 0,
        title: 'Level 0: Pengamat Pengadaan (Observasi)',
        description: 'Hak akses membaca berkas lelang dan observasi pengadaan',
        requirements: [
          { competencyId: compNodeA.id, minimumScore: 80, requiresHumanApproval: false },
        ],
      });
    }
    gateLevel0 = existing0;

    let existing3 = await container.gateRepository.findByWorkspaceAndLevel(workspaceId, 3);
    if (!existing3) {
      existing3 = await container.createGateUseCase.execute({
        workspaceId,
        level: 3,
        title: 'Level 3: Pejabat Pembuat Komitmen Penuh (Mandiri Risiko Tinggi)',
        description: 'Kewenangan otorisasi kontrak dan penetapan pemenang lelang strategis',
        requirements: [
          { competencyId: compNodeC.id, minimumScore: 85, requiresHumanApproval: true },
        ],
      });
    }
    gateLevel3 = existing3;

    expect(gateLevel0.level).toBe(0);
    expect(gateLevel3.level).toBe(3);
    expect(gateLevel3.isHighRisk()).toBe(true);
  });

  test('Learner earns Gate Level 0 passport when Class A competency is mastered', async () => {
    // Ensure learner mastered compNodeA
    await container.masteryRepository.upsertStatus(learnerId, compNodeA.id, 'mastered');

    const result = await container.evaluateAndGrantGateUseCase.execute(learnerId, gateLevel0.id, learnerId);
    expect(result.granted).toBe(true);
    expect(result.grant).toBeInstanceOf(UserGateGrantEntity);
    expect(result.grant?.status).toBe('active');
  });

  test('Learner submission for Class C enters pending expert review queue and cannot self-pass', async () => {
    const candidateEssay = {
      text: 'Saya memutuskan langsung menandatangani kontrak darurat karena waktu mendesak dan spesifikasi bisa disesuaikan belakangan.',
    };

    const res = await container.evaluateAttemptUseCase.execute(learnerId, {
      taskId: taskC.id,
      submission: candidateEssay,
    });

    expect(res.attempt.oracleClassUsed).toBe('C');
    expect(res.attempt.assessedBy).toBe('pending_expert_review');
    expect(res.passed).toBe(false);

    // Verify it is present in pending queue
    const pendingList = await container.listPendingClassCReviewsUseCase.execute();
    const found = pendingList.find((p) => p.attempt.id === res.attempt.id);
    expect(found).toBeDefined();
    expect(found?.taskTitle).toBe(taskC.title);
  });

  test('INVARIANT: Gate Level 3 strictly blocks learner when Class C lacks Human Expert sign-off', async () => {
    const result = await container.evaluateAndGrantGateUseCase.execute(learnerId, gateLevel3.id, learnerId);
    expect(result.granted).toBe(false);
    expect(result.eligibility.eligible).toBe(false);
    expect(result.eligibility.missingCompetencies.length).toBeGreaterThan(0);
    expect(result.eligibility.missingCompetencies[0].requiresHumanApproval).toBe(true);
  });

  test('Self-assessment violation: Learner is forbidden from grading their own Class C attempt', async () => {
    const pending = await container.attemptRepository.listPendingClassC();
    const learnerAttempt = pending.find((p) => p.userId === learnerId);
    expect(learnerAttempt).toBeDefined();

    await expect(
      container.reviewClassCAttemptUseCase.execute(learnerId, {
        attemptId: learnerAttempt!.id,
        passed: true,
        rubricScores: [{ criterionId: 'crit_legalitas_darurat', scoreAwarded: 40, maxScore: 40, feedback: 'Bagus' }],
        expertNotes: 'Self approved',
      })
    ).rejects.toThrow('Self-assessment violation');
  });

  test('Senior Expert verifies Class C attempt, signs off, and unlocks Gate Level 3 Passport with Audit Trail', async () => {
    const pending = await container.attemptRepository.listPendingClassC();
    const learnerAttempt = pending.find((p) => p.userId === learnerId);
    expect(learnerAttempt).toBeDefined();

    // Human Expert conducts official audit evaluation
    const evaluatedAttempt = await container.reviewClassCAttemptUseCase.execute(reviewerId, {
      attemptId: learnerAttempt!.id,
      passed: true,
      rubricScores: [
        { criterionId: 'crit_legalitas_darurat', scoreAwarded: 40, maxScore: 40, feedback: 'Dasar hukum darurat terverifikasi valid' },
        { criterionId: 'crit_kewajaran_harga', scoreAwarded: 28, maxScore: 30, feedback: 'Kewajaran harga didukung reviu HPS' },
        { criterionId: 'crit_mitigasi_akuntabilitas', scoreAwarded: 27, maxScore: 30, feedback: 'Pelibatan BPKP tercantum dalam BAP' },
      ],
      expertNotes: 'Kandidat menunjukkan pertimbangan diskresi yang matang dan akuntabel sesuai Perpres 12/2021.',
    });

    expect(evaluatedAttempt.passed).toBe(true);
    expect(evaluatedAttempt.assessedBy).toBe(`human_expert:${reviewerId}`);
    expect(evaluatedAttempt.score).toBe(95);

    // Verify Mastery Ledger updated to mastered
    const mastery = await container.masteryRepository.findByUserAndCompetency(learnerId, compNodeC.id);
    expect(mastery?.isMastered()).toBe(true);

    // Now re-evaluate Gate Level 3
    const gateResult = await container.evaluateAndGrantGateUseCase.execute(learnerId, gateLevel3.id, reviewerId);
    expect(gateResult.granted).toBe(true);
    expect(gateResult.grant?.status).toBe('active');
    expect(gateResult.grant?.evidenceSnapshot.gateLevel).toBe(3);

    // Verify Append-Only Audit Logs exist
    const auditLogs = await container.auditLogRepository.listByWorkspace(workspaceId);
    const gateGrantLog = auditLogs.find((l) => l.action === 'GATE_GRANT' && l.payload.gateLevel === 3);
    const expertReviewLog = auditLogs.find((l) => l.action === 'CLASS_C_EXPERT_VERIFICATION');

    expect(gateGrantLog).toBeDefined();
    expect(expertReviewLog).toBeDefined();
    expect(expertReviewLog?.actorId).toBe(reviewerId);
  });
});
