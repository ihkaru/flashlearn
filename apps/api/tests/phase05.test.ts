import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { SpacedFlashcardEntity } from '../src/domain/entities/SpacedFlashcard';
import { SpacedRepetitionScheduler } from '../src/domain/services/SpacedRepetitionScheduler';

describe('Phase 05: Reactive Staleness Engine & Spaced Retention Flashcards', () => {
  let workspaceId: string;
  let learnerId: string;
  let sourceId: string;
  let testSourceCode: string;
  let compNode: any;
  let taskLegacy: any;
  let gateId: string;
  let flashcardId: string;

  beforeAll(async () => {
    const admin = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!admin) throw new Error('Admin user not found');
    learnerId = admin.id;

    const testWs = await container.workspaceRepository.create({
      name: `Hermetic Phase 05 Test Workspace ${Date.now()}`,
      slug: `phase-05-test-${Date.now()}`,
      creatorId: learnerId,
      isPublic: false,
    });
    workspaceId = testWs.id;

    testSourceCode = `PERPRES-16-TEST-${Date.now()}`;
    const ingestRes = await container.ingestSourceUseCase.execute({
      workspaceId,
      title: 'Peraturan Presiden Nomor 16 Tahun 2018 (Legacy Source)',
      code: testSourceCode,
      version: '1.0',
      owner: 'LKPP RI',
      effectiveDate: new Date('2018-07-01'),
      rawText: `Pasal 51: Tender Gagal dapat dilakukan evaluasi ulang atau tender ulang.
Pasal 52: Pengadaan Langsung untuk Barang/Jasa Lainnya bernilai paling banyak Rp 200.000.000.`,
    });
    sourceId = ingestRes.source.id;

    // Create linked competency
    let existingComp = await container.competencyRepository.findByCode(workspaceId, 'LEGACY-HPS-99');
    if (!existingComp) {
      existingComp = await container.createCompetencyNodeUseCase.execute({
        workspaceId,
        code: 'LEGACY-HPS-99',
        title: 'Ambang Batas Pengadaan Langsung 2018',
        description: 'Aturan lama batas Rp 200 juta sebelum Perpres revisi',
        oracleClass: 'A',
        riskLevel: 'low',
      });
    }
    compNode = existingComp;

    // Create a task for this competency
    taskLegacy = await container.createTaskUseCase.execute({
      competencyId: compNode.id,
      title: 'Batas Nilai Pengadaan Langsung 2018',
      scenario: 'Hitung nilai maksimum pengadaan langsung barang sesuai Perpres 16/2018.',
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: {
          max_pengadaan: { expectedValue: 200000000, tolerance: 0 },
        },
      },
      rubricCriteria: [
        { id: 'crit_calc', title: 'Perhitungan Nilai', weight: 100, description: 'Sesuai nominal' },
      ],
      passingScore: 80,
    });

    // Create a Gate Level 1 (or find existing)
    let existingGate = await container.gateRepository.findByWorkspaceAndLevel(workspaceId, 1);
    if (!existingGate) {
      existingGate = await container.createGateUseCase.execute({
        workspaceId,
        level: 1,
        title: 'Level 1: Staf Pengadaan Dampingan',
        description: 'Wewenang pengerjaan pengadaan langsung dengan review',
        requirements: [
          { competencyId: compNode.id, minimumScore: 80, requiresHumanApproval: false },
        ],
      });
    }
    gateId = existingGate.id;
  });

  test('Creates and calculates SM-2 spaced repetition intervals on learner practice', async () => {
    // 1. Create a spaced flashcard for learner
    const card = await container.spacedFlashcardRepository.create({
      userId: learnerId,
      competencyId: compNode.id,
      front: 'Berapa batas nilai pengadaan langsung barang menurut Perpres 16/2018?',
      back: 'Paling banyak Rp 200.000.000 (Dua Ratus Juta Rupiah)',
      category: 'threshold_limits',
    });

    expect(card).toBeInstanceOf(SpacedFlashcardEntity);
    expect(card.repetitionCount).toBe(0);
    expect(card.repetitionIntervalDays).toBe(1);
    flashcardId = card.id;

    // 2. Practice with high recall quality (quality = 5)
    const after1 = await container.practiceSpacedCardUseCase.execute({
      cardId: flashcardId,
      userId: learnerId,
      quality: 5,
    });

    expect(after1.repetitionCount).toBe(1);
    expect(after1.repetitionIntervalDays).toBe(1);

    // 3. Second practice with quality = 5 -> should jump to 3 days
    const after2 = await container.practiceSpacedCardUseCase.execute({
      cardId: flashcardId,
      userId: learnerId,
      quality: 5,
    });

    expect(after2.repetitionCount).toBe(2);
    expect(after2.repetitionIntervalDays).toBe(3);

    // 4. Blackout / Failed recall (quality = 1) -> resets interval back to 1 day and repetition count to 0
    const failedRecall = await container.practiceSpacedCardUseCase.execute({
      cardId: flashcardId,
      userId: learnerId,
      quality: 1,
    });

    expect(failedRecall.repetitionCount).toBe(0);
    expect(failedRecall.repetitionIntervalDays).toBe(1);
  });

  test('Learner earns active Gate passport for Legacy Competency via verified attempt', async () => {
    // Pass taskLegacy accurately
    const evalRes = await container.evaluateAttemptUseCase.execute(learnerId, {
      taskId: taskLegacy.id,
      submission: { max_pengadaan: 200000000 },
    });
    expect(evalRes.passed).toBe(true);

    const result = await container.evaluateAndGrantGateUseCase.execute(learnerId, gateId, learnerId);
    expect(result.granted).toBe(true);
    expect(result.grant?.status).toBe('active');
  });

  test('Reactive Staleness Engine: Superseding Source invalidates masteries and suspends Gate passport', async () => {
    // Supersede the source (simulating release of Perpres 12/2021)
    const report = await container.supersedeSourceUseCase.execute({
      sourceId,
      actorId: learnerId,
      reason: 'Digantikan oleh Perpres Nomor 12 Tahun 2021 tentang Perubahan Pengadaan.',
    });

    expect(report.sourceId).toBe(sourceId);
    expect(report.sourceCode).toBe(testSourceCode);
    expect(report.invalidatedMasteriesCount).toBeGreaterThan(0);
    expect(report.suspendedGateGrantsCount).toBeGreaterThan(0);

    // Verify source status in DB
    const updatedSource = await container.sourceRepository.findById(sourceId);
    expect(updatedSource?.status).toBe('superseded');

    // Verify learner mastery status is now 'stale'
    const mastery = await container.masteryRepository.findByUserAndCompetency(learnerId, compNode.id);
    expect(mastery?.status).toBe('stale');

    // Verify Gate grant status is suspended to 'provisional'
    const grant = await container.gateRepository.findGrantByUserAndGate(learnerId, gateId);
    expect(grant?.status).toBe('provisional');
    expect(grant?.revocationReason).toContain('Perpres Nomor 12 Tahun 2021');

    // Verify Audit Logs recorded the staleness cascade
    const logs = await container.auditLogRepository.listByWorkspace(workspaceId);
    const staleLog = logs.find((l) => l.action === 'STALENESS_TRIGGERED');
    expect(staleLog).toBeDefined();
    expect(staleLog?.payload.staleCompetenciesCount).toBeGreaterThan(0);
  });
});
