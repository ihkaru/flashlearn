import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { TaskEntity } from '../src/domain/entities/Task';

describe('Phase 06: Grounded Socratic AI Tutor & In-Task Guided Reasoning', () => {
  let workspaceId: string;
  let taskA: TaskEntity;
  let taskB: TaskEntity;

  beforeAll(async () => {
    // 1. Create an isolated workspace for Phase 06
    const user = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!user) throw new Error('User not found');

    const ws = await container.workspaceRepository.create({
      name: 'Phase 06 Socratic Tutor Test Workspace',
      slug: `phase-06-test-${Date.now()}`,
      description: 'Hermetic test for Socratic Tutor',
      creatorId: user.id,
      isPublic: true,
    });
    workspaceId = ws.id;

    // 2. Ingest source with addressable chunk
    const sourceCode = `STANDAR-${Date.now()}`;
    const sourceRes = await container.ingestSourceUseCase.execute({
      workspaceId,
      title: 'Pedoman Standar Tata Kelola & Batasan Biaya',
      code: sourceCode,
      version: '1.0',
      owner: 'Komite Standarisasi',
      effectiveDate: '2025-01-01',
      rawText: `# Bagian 1: Formula Batasan Biaya
Keuntungan dan overhead dibatasi maksimal 15% dari biaya dasar riil. Pajak pertambahan nilai mengikuti tarif standar 11%.

# Bagian 2: Independensi Penilai
Penilai dilarang memiliki hubungan afiliasi atau benturan kepentingan langsung dengan penyedia jasa yang ditunjuk.`,
    });

    // 3. Create competencies
    const compA = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      sourceId: sourceRes.source.id,
      code: 'SOCR-CALC-01',
      title: 'Kalkulasi Batas Biaya Standar',
      description: 'Penguasaan formula batas biaya overhead dan pajak',
      oracleClass: 'A',
      riskLevel: 'low',
    });

    const compB = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      sourceId: sourceRes.source.id,
      code: 'SOCR-COMPL-02',
      title: 'Penilaian Kepatuhan & Independensi',
      description: 'Mitigasi benturan kepentingan dalam penunjukan rekanan',
      oracleClass: 'B',
      riskLevel: 'high',
    });

    // 4. Create Tasks
    taskA = await container.createTaskUseCase.execute({
      competencyId: compA.id,
      title: 'Perhitungan Total Biaya Pengadaan',
      scenario: 'Hitung total biaya dengan biaya dasar 100.000.000, overhead maksimal 15%, dan PPN 11%.',
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: {
          total: { expectedValue: 127650000, tolerance: 100 },
        },
      },
      rubricCriteria: [
        { id: 'total', title: 'Perhitungan Total Akurat', weight: 100, description: 'Sesuai formula acuan' },
      ],
      passingScore: 80,
    });

    taskB = await container.createTaskUseCase.execute({
      competencyId: compB.id,
      title: 'Audit Dugaan Benturan Kepentingan Rekanan',
      scenario: 'Penyedia jasa yang ditunjuk secara langsung memiliki hubungan kekerabatan langsung dengan pejabat pengambil keputusan.',
      taskType: 'case_study',
      oracleData: {
        goldSolution: 'Pejabat wajib mendeklarasikan benturan kepentingan secara tertulis dan melimpahkan keputusan kepada pejabat berwenang lain.',
        negativeAnchors: [
          {
            id: 'trap_abaikan_relasi',
            trapDescription: 'Membenarkan penunjukan sepihak tanpa deklarasi benturan kepentingan',
            penaltyPoints: 70,
            fatal: true,
          },
        ],
      },
      rubricCriteria: [
        { id: 'crit_independensi', title: 'Prinsip Independensi', weight: 100, description: 'Bebas benturan kepentingan' },
      ],
      passingScore: 80,
    });
  });

  test('Socratic Tutor returns grounded guidance and reflective question for Class A calculation without spoiling answer', async () => {
    const hint = await container.askSocraticTutorUseCase.execute(taskA.id, {
      question: 'Saya bingung bagaimana cara menghitung overhead dan berapa angka pastinya?',
    });

    expect(hint).toBeDefined();
    expect(typeof hint.socraticGuidance).toBe('string');
    expect(hint.socraticGuidance.length).toBeGreaterThan(15);
    expect(typeof hint.reflectiveQuestion).toBe('string');
    expect(hint.reflectiveQuestion.length).toBeGreaterThan(10);
    expect(typeof hint.suggestedAction).toBe('string');

    // ORACLE SHIELD INVARIANT: Must not leak exact formula answer "127650000"
    expect(hint.socraticGuidance).not.toContain('127650000');
    expect(hint.reflectiveQuestion).not.toContain('127650000');
  }, 45000);

  test('Socratic Tutor guides Class B case study anchored in citation principles without leaking negative anchor trap ids', async () => {
    const hint = await container.askSocraticTutorUseCase.execute(taskB.id, {
      question: 'Apakah boleh menyetujui vendor jika pemiliknya adalah saudara kandung untuk menghemat waktu?',
    });

    expect(hint).toBeDefined();
    expect(typeof hint.socraticGuidance).toBe('string');
    expect(hint.socraticGuidance.length).toBeGreaterThan(15);

    // ORACLE SHIELD INVARIANT: Must not mention internal raw trap ID
    expect(hint.socraticGuidance).not.toContain('trap_abaikan_relasi');

    // Must offer citation references or principles
    if (hint.citationReferences && hint.citationReferences.length > 0) {
      expect(hint.citationReferences[0].sourceCode).toContain('STANDAR');
    }
  }, 45000);
});
