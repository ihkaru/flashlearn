import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { CompetencyEntity } from '../src/domain/entities/Competency';
import { MasteryRecordEntity } from '../src/domain/entities/MasteryRecord';

describe('Phase 02: Directed Competency Graph & Mastery Ledger', () => {
  let workspaceId: string;
  let learnerId: string;
  let node1: CompetencyEntity;
  let node2: CompetencyEntity;
  let node3: CompetencyEntity;

  beforeAll(async () => {
    const workspaces = await container.workspaceRepository.listAll();
    if (workspaces.length === 0) throw new Error('No workspace found');
    workspaceId = workspaces[0].id;

    const admin = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!admin) throw new Error('Admin not found');
    learnerId = admin.id;

    // Clean any previous test nodes
    const existing = await container.competencyRepository.listByWorkspace(workspaceId);
    for (const node of existing) {
      if (['HPS-001', 'HPS-002', 'HPS-003'].includes(node.code)) {
        await container.competencyRepository.delete(node.id);
      }
    }
  });

  test('Creates sequential competency nodes with prerequisite links', async () => {
    node1 = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: 'HPS-001',
      title: 'Dasar Perhitungan HPS & Kewenangan PPK',
      description: 'Memahami dasar hukum dan keabsahan penghitungan harga perkiraan sendiri.',
      oracleClass: 'A',
      riskLevel: 'low',
    });
    expect(node1).toBeInstanceOf(CompetencyEntity);
    expect(node1.code).toBe('HPS-001');
    expect(node1.oracleClass).toBe('A');

    node2 = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: 'HPS-002',
      title: 'Formula Pajak PPN 11% & Batas Overhead 15%',
      description: 'Menghitung batas kewajaran overhead cost dan kepatuhan perpajakan.',
      oracleClass: 'A',
      riskLevel: 'medium',
      prerequisiteIds: [node1.id],
    });
    expect(node2).toBeInstanceOf(CompetencyEntity);
    expect(node2.prerequisiteIds).toContain(node1.id);

    node3 = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: 'HPS-003',
      title: 'Analisis Justifikasi Harga Pasar & Mitigasi Audit',
      description: 'Menilai kewajaran harga survei dan menyusun dokumen pembelaan audit BPKP.',
      oracleClass: 'B',
      riskLevel: 'high',
      prerequisiteIds: [node2.id],
    });
    expect(node3).toBeInstanceOf(CompetencyEntity);
    expect(node3.prerequisiteIds).toContain(node2.id);
  });

  test('Cycle detection guardrail blocks circular prerequisite dependencies', async () => {
    expect(
      container.linkPrerequisiteUseCase.execute({
        competencyId: node1.id,
        prerequisiteId: node3.id,
      })
    ).rejects.toThrow(/Cycle detected/);
  });

  test('Initial learner progression evaluation blocks downstream nodes', async () => {
    const graph = await container.getCompetencyGraphUseCase.execute(workspaceId, learnerId);
    const statusMap = new Map(graph.nodes.map((n) => [n.code, n]));

    const s1 = statusMap.get('HPS-001')!;
    const s2 = statusMap.get('HPS-002')!;
    const s3 = statusMap.get('HPS-003')!;

    expect(s1.userStatus).toBe('ready');
    expect(s1.canAttempt).toBe(true);

    expect(s2.userStatus).toBe('locked');
    expect(s2.canAttempt).toBe(false);
    expect(s2.blockingPrerequisites.some((b) => b.code === 'HPS-001')).toBe(true);

    expect(s3.userStatus).toBe('locked');
    expect(s3.canAttempt).toBe(false);
    expect(s3.blockingPrerequisites.some((b) => b.code === 'HPS-002')).toBe(true);
  });

  test('Mastering prerequisite dynamically unlocks downstream node', async () => {
    const simulatedAttemptId = crypto.randomUUID();
    const record = await container.masteryRepository.upsertStatus(
      learnerId,
      node1.id,
      'mastered',
      simulatedAttemptId
    );
    expect(record).toBeInstanceOf(MasteryRecordEntity);
    expect(record.isMastered()).toBe(true);

    const graph = await container.getCompetencyGraphUseCase.execute(workspaceId, learnerId);
    const statusMap = new Map(graph.nodes.map((n) => [n.code, n]));

    const s1 = statusMap.get('HPS-001')!;
    const s2 = statusMap.get('HPS-002')!;
    const s3 = statusMap.get('HPS-003')!;

    expect(s1.userStatus).toBe('mastered');
    expect(s2.userStatus).toBe('ready'); // Unlocked!
    expect(s2.canAttempt).toBe(true);
    expect(s3.userStatus).toBe('locked'); // Still locked waiting for HPS-002
  });

  test('Expert approval workflow records verifier identity', async () => {
    const approved = await container.approveCompetencyUseCase.execute(node3.id, learnerId);
    expect(approved.isExpertApproved).toBe(true);
    expect(approved.approvedBy).toBe(learnerId);
  });
});
