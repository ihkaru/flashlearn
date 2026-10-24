import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { TaskEntity } from '../src/domain/entities/Task';
import type { AdversarialDilemmaSpec } from '@flashlearn/shared';

describe('Phase 11: Adversarial Dilemma & Stress Testing Engine (Simulation & Integrity Traps)', () => {
  let workspaceId: string;
  let learnerId: string;
  let compNode: any;
  let adversarialTask: TaskEntity;

  const testSpec: AdversarialDilemmaSpec = {
    trapType: 'OMISSION_DATA',
    correctDisposition: 'REJECT_AND_DEMAND_DATA',
    trapCues: [
      { cue: 'Sertifikat laik fungsi gedung belum terlampir', weight: 0.5 },
      { cue: 'Kapasitas pendingin server tidak mencantumkan spesifikasi BTU', weight: 0.5 },
    ],
    statutoryPolicy: 'Perpres 16/2018 Pasal 51 ayat 2 (Kelaikan Dokumen Teknis)',
    vetoThreshold: 0.7,
  };

  beforeAll(async () => {
    const workspaces = await container.workspaceRepository.listAll();
    if (workspaces.length === 0) throw new Error('No workspace found');
    workspaceId = workspaces[0].id;

    const user = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!user) throw new Error('User not found');
    learnerId = user.id;

    let existingComp = await container.competencyRepository.findByCode(workspaceId, 'ADV-STRESS-01');
    if (!existingComp) {
      existingComp = await container.createCompetencyNodeUseCase.execute({
        workspaceId,
        code: 'ADV-STRESS-01',
        title: 'Verifikasi Integritas Pengadaan Fasilitas Kritis',
        description: 'Pengujian stres terhadap dilema omisi data spesifikasi teknis dan tekanan waktu',
        oracleClass: 'B',
        riskLevel: 'high',
      });
    }
    compNode = existingComp;
  });

  test('Creates Adversarial Dilemma task with full specification', async () => {
    adversarialTask = await container.createTaskUseCase.execute({
      competencyId: compNode.id,
      title: 'Audit Cepat Pengadaan Infrastruktur Data Center Darurat',
      scenario:
        'Vendor menyerahkan proposal data center darurat senilai Rp 8 Miliar. Pimpinan proyek mendesak persetujuan hari ini juga agar anggaran tidak hangus. Namun, pada berkas lampiran, sertifikat laik fungsi gedung belum terlampir dan kapasitas pendingin server tidak mencantumkan spesifikasi BTU teknis.',
      taskType: 'adversarial_dilemma',
      oracleData: {},
      adversarialSpec: testSpec,
      rubricCriteria: [
        { id: 'crit_vigilance', title: 'Kewaspadaan Omisi Teknis', weight: 40, description: 'Mendeteksi berkas yang tidak lengkap' },
        { id: 'crit_defense', title: 'Pertahanan Batas Kepatuhan', weight: 40, description: 'Menolak kompromi di bawah tekanan pimpinan' },
        { id: 'crit_statutory', title: 'Justifikasi Regulasi', weight: 20, description: 'Penerapan dasar hukum Perpres 16/2018' },
      ],
      passingScore: 85,
    });

    expect(adversarialTask).toBeDefined();
    expect(adversarialTask.taskType).toBe('adversarial_dilemma');
    expect(adversarialTask.isAdversarialDilemma()).toBe(true);
    expect(adversarialTask.adversarialSpec?.trapType).toBe('OMISSION_DATA');
    expect(adversarialTask.adversarialSpec?.trapCues.length).toBe(2);
  });

  test('CASE 1 (Trap Triggered - Automatic Disqualification): Learner misses missing clearance and signs off', async () => {
    // Learner acts sycophantically and approves without noticing the missing certificates
    const response = await container.evaluateAttemptUseCase.execute(learnerId, {
      taskId: adversarialTask.id,
      submission: {
        text: 'Saya menyetujui (approve) pengadaan data center ini karena desakan pimpinan dan agar penyerapan anggaran tepat waktu. Dokumen dianggap sudah lengkap secara substansial.',
      },
    });

    expect(response.passed).toBe(false);
    expect(response.attempt.score).toBe(0); // Veto rule sets score to 0
    expect(response.attempt.feedback).toContain('GAGAL UJI ADVERSARIAL');
    expect(response.attempt.feedback).toContain('DISKUALIFIKASI OTOMATIS');
    
    const advResult = response.attempt.details?.adversarialResult;
    expect(advResult).toBeDefined();
    expect(advResult?.disqualifiedByTrap).toBe(true);
    expect(advResult?.bds).toBe(0.0);
    expect(advResult?.tsi).toBeLessThan(0.7);
  }, 45000);

  test('CASE 2 (Sycophancy Compromise): Learner spots missing data but yields under executive pressure', async () => {
    // Learner notes the issue, but compromises ("tetap setuju dengan syarat dispensasi")
    const response = await container.evaluateAttemptUseCase.execute(learnerId, {
      taskId: adversarialTask.id,
      submission: {
        text: 'Saya melihat sertifikat laik fungsi gedung belum terlampir dan spesifikasi pendingin server tidak mencantumkan BTU. Namun karena desakan batas waktu pimpinan, saya tetap setuju dengan syarat sertifikat disusulkan bulan depan.',
      },
    });

    expect(response.passed).toBe(false);
    const advResult = response.attempt.details?.adversarialResult;
    expect(advResult).toBeDefined();
    // Candidate made unauthorized concession (BDS <= 0.5)
    expect(advResult?.bds).toBeLessThanOrEqual(0.5);
    expect(response.attempt.score).toBeLessThan(adversarialTask.passingScore);
  }, 45000);

  test('CASE 3 (Exemplary Operational Defense): Learner detects all cues, holds boundary, and rejects sign-off', async () => {
    // Learner resolutely defends compliance boundary and requests necessary data
    const response = await container.evaluateAttemptUseCase.execute(learnerId, {
      taskId: adversarialTask.id,
      submission: {
        text: 'Saya secara tegas menolak menandatangani persetujuan pengadaan saat ini dan menunda proses sampai klarifikasi teknis dipenuhi. Berdasarkan verifikasi berkas: 1) Sertifikat laik fungsi gedung belum terlampir; 2) Kapasitas pendingin server tidak mencantumkan spesifikasi BTU. Sesuai Perpres 16/2018 Pasal 51 ayat 2, kelaikan teknis adalah syarat mutlak yang tidak dapat dikompromikan meskipun ada desakan batas waktu anggaran. Kami menuntut pemenuhan data sebelum audit dilanjutkan.',
      },
    });

    expect(response.passed).toBe(true);
    expect(response.attempt.score).toBeGreaterThanOrEqual(85);
    expect(response.attempt.feedback).toContain('LULUS UJI ADVERSARIAL');
    
    const advResult = response.attempt.details?.adversarialResult;
    expect(advResult).toBeDefined();
    expect(advResult?.disqualifiedByTrap).toBe(false);
    expect(advResult?.tsi).toBe(1.0);
    expect(advResult?.bds).toBe(1.0);
    expect(advResult?.rss).toBeGreaterThanOrEqual(0.7);
  }, 45000);
});
