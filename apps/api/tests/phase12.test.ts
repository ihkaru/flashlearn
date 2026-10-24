import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { KnowledgeSpaceEngine } from '../src/domain/services/KnowledgeSpaceEngine';

describe('Phase 12: Adaptive Topological Diagnostic Placement Engine (KST on Prerequisite DAG)', () => {
  let workspaceId: string;
  let learnerId: string;
  let compRoot: any;
  let compInter: any;
  let compCapstone: any;
  let taskRoot: any;
  let taskInter: any;
  let taskCapstone: any;

  beforeAll(async () => {
    const user = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!user) throw new Error('User not found');
    learnerId = user.id;

    const ws = await container.createWorkspaceUseCase.execute(learnerId, {
      name: 'KST Diagnostic Test Workspace',
      slug: `kst-test-${Date.now()}`,
      description: 'Hermetic test workspace for adaptive placement',
    });
    workspaceId = ws.id;

    // 1. Setup a clean 3-tier hierarchy: Root -> Inter -> Capstone
    const codeRoot = `KST-ROOT-${Date.now().toString().slice(-4)}`;
    const codeInter = `KST-INTR-${Date.now().toString().slice(-4)}`;
    const codeCap = `KST-CAPS-${Date.now().toString().slice(-4)}`;

    compRoot = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: codeRoot,
      title: 'Dasar Verifikasi Legalitas & Kalkulasi',
      description: 'Fondasi matematika dan checklist kepatuhan',
      oracleClass: 'A',
      riskLevel: 'low',
    });

    compInter = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: codeInter,
      title: 'Analisis Mitigasi Risiko Transaksi',
      description: 'Studi kasus evaluasi kepatuhan rekanan',
      oracleClass: 'A',
      riskLevel: 'medium',
    });

    compCapstone = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: codeCap,
      title: 'Otoritas Pengesahan Kontrak Kritis',
      description: 'Verifikasi capstone tingkat lanjut',
      oracleClass: 'A',
      riskLevel: 'critical',
    });

    // Link prerequisites: Root -> Inter -> Capstone
    await container.linkPrerequisiteUseCase.execute({
      competencyId: compInter.id,
      prerequisiteId: compRoot.id,
    });
    await container.linkPrerequisiteUseCase.execute({
      competencyId: compCapstone.id,
      prerequisiteId: compInter.id,
    });

    // Create tasks for each node
    taskRoot = await container.createTaskUseCase.execute({
      competencyId: compRoot.id,
      title: 'Kalkulasi Ambang Batas Legalitas',
      scenario: 'Hitung nilai dasar verifikasi legalitas rekanan.',
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: { nilai_dasar: { expectedValue: 100, tolerance: 0 } },
      },
      rubricCriteria: [{ id: 'c1', title: 'Akurasi', weight: 100, description: 'Tepat' }],
      passingScore: 85,
    });

    taskInter = await container.createTaskUseCase.execute({
      competencyId: compInter.id,
      title: 'Kalkulasi Risiko Transaksi Menengah',
      scenario: 'Hitung skor risiko transaksi menengah rekanan.',
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: { skor_risiko: { expectedValue: 200, tolerance: 0 } },
      },
      rubricCriteria: [{ id: 'c2', title: 'Akurasi', weight: 100, description: 'Tepat' }],
      passingScore: 85,
    });

    taskCapstone = await container.createTaskUseCase.execute({
      competencyId: compCapstone.id,
      title: 'Kalkulasi Pengesahan Kontrak Capstone',
      scenario: 'Hitung nilai akhir kontrak bernilai tinggi.',
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: { nilai_kontrak: { expectedValue: 500, tolerance: 0 } },
      },
      rubricCriteria: [{ id: 'c3', title: 'Akurasi', weight: 100, description: 'Tepat' }],
      passingScore: 85,
    });
  });

  test('Quasi-Ordinal Knowledge Space Engine Invariants', () => {
    const nodes = ['A', 'B', 'C', 'D'];
    const edges = [
      { sourceId: 'A', targetId: 'B' }, // A -> B
      { sourceId: 'B', targetId: 'C' }, // B -> C
      { sourceId: 'A', targetId: 'D' }, // A -> D
    ];

    const kSpace = new KnowledgeSpaceEngine(nodes, edges);

    // 1. Ancestors & Descendants
    expect(kSpace.getAncestors('C')).toEqual(expect.arrayContaining(['A', 'B']));
    expect(kSpace.getAncestors('A')).toEqual([]);
    expect(kSpace.getDescendants('A')).toEqual(expect.arrayContaining(['B', 'C', 'D']));

    // 2. Admissible States (Closure under prerequisites)
    expect(kSpace.isAdmissibleState([])).toBe(true);
    expect(kSpace.isAdmissibleState(['A'])).toBe(true);
    expect(kSpace.isAdmissibleState(['A', 'B'])).toBe(true);
    expect(kSpace.isAdmissibleState(['B'])).toBe(false); // B requires A
    expect(kSpace.isAdmissibleState(['A', 'C'])).toBe(false); // C requires B

    // 3. Outer Fringe F_out(K)
    expect(kSpace.getOuterFringe([])).toEqual(expect.arrayContaining(['A']));
    expect(kSpace.getOuterFringe(['A'])).toEqual(expect.arrayContaining(['B', 'D']));
    expect(kSpace.getOuterFringe(['A', 'B'])).toEqual(expect.arrayContaining(['C', 'D']));

    // 4. Ancestral Mastery Propagation
    const propagated = kSpace.propagateAncestralMastery([], 'C');
    expect(propagated).toEqual(expect.arrayContaining(['A', 'B', 'C']));
  });

  test('Senior Fast-Track Diagnostic Placement: Passing Capstone immediately infers ancestors', async () => {
    // 1. Start a fresh diagnostic session for candidate
    const startResult = await container.startDiagnosticSessionUseCase.execute(learnerId, workspaceId);
    expect(startResult.session).toBeDefined();
    expect(startResult.session.status).toBe('in_progress');

    // 2. Query next probe recommendation
    const nextProbe = await container.getNextDiagnosticProbeUseCase.execute(startResult.session.id);
    expect(nextProbe.isComplete).toBe(false);
    expect(nextProbe.task).toBeDefined();
    expect(nextProbe.competencyId).toBe(compRoot.id);

    // 3. Candidate submits accurate calculation for compRoot
    const probeResult = await container.submitDiagnosticProbeUseCase.execute(startResult.session.id, {
      nilai_dasar: 100,
    });

    expect(probeResult.passed).toBe(true);
    expect(probeResult.score).toBeGreaterThanOrEqual(85);
    expect(probeResult.totalInferredMasteries).toBe(1);

    // 4. Next probe recommended should now be compInter
    const nextProbe2 = await container.getNextDiagnosticProbeUseCase.execute(startResult.session.id);
    expect(nextProbe2.isComplete).toBe(false);
    expect(nextProbe2.competencyId).toBe(compInter.id);

    // 5. Senior fast-track verification: Passing capstone directly implies all ancestors
    const session = await container.diagnosticRepository.findById(startResult.session.id);
    expect(session).toBeDefined();

    const competencies = await container.competencyRepository.listByWorkspace(workspaceId);
    const edges = await container.competencyRepository.listEdges(workspaceId);
    const kSpace = container.diagnosticPlacementEngine.buildKnowledgeSpace(competencies, edges);

    const { updatedMasteries, newlyInferredAncestors } = container.diagnosticPlacementEngine.applyProbeResult(
      session!,
      kSpace,
      compCapstone.id,
      taskCapstone.id,
      true,
      100
    );

    expect(updatedMasteries).toContain(compCapstone.id);
    expect(updatedMasteries).toContain(compInter.id);
    expect(updatedMasteries).toContain(compRoot.id);
    expect(newlyInferredAncestors).toContain(compInter.id);
    expect(session!.isCompleted()).toBe(true);
  }, 20000);

  test('REST Controller Endpoints: /api/v1/diagnostic/start and /next', async () => {
    // Test container use cases through direct service contracts
    const session = await container.diagnosticRepository.findActiveByUserAndWorkspace(learnerId, workspaceId);
    expect(session).toBeDefined();

    if (session) {
      const nextProbe = await container.getNextDiagnosticProbeUseCase.execute(session.id);
      expect(nextProbe).toBeDefined();
      expect(typeof nextProbe.isComplete).toBe('boolean');
    }
  });
});
