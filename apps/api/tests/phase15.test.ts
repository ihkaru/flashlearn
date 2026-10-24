import { describe, test, expect } from 'bun:test';
import { synthesizeDomainBlueprint, verifyAcyclicity } from '../../../packages/cli/src/core/domain-synthesizer';
import { container } from '../src/infrastructure/di/container';
import { join } from 'node:path';

describe('Phase 15: Autonomous Domain Synthesizer & Agent-Agnostic Skill Engine', () => {
  const sampleDocPath = join(__dirname, '../../../docs/samples/sop-manajemen-risiko-vendor.md');

  test('Tarjan SCC Algorithm: Detects acyclic DAG and catches cyclic prerequisite loops', () => {
    // 1. Valid linear DAG
    const validNodes = ['comp_1', 'comp_2', 'comp_3'];
    const validEdges = [
      { from: 'comp_1', to: 'comp_2' },
      { from: 'comp_2', to: 'comp_3' },
    ];
    const validCheck = verifyAcyclicity(validNodes, validEdges);
    expect(validCheck.isAcyclic).toBe(true);
    expect(validCheck.cycles.length).toBe(0);

    // 2. Cyclic prerequisite loop: A -> B -> C -> A
    const cyclicEdges = [
      { from: 'comp_1', to: 'comp_2' },
      { from: 'comp_2', to: 'comp_3' },
      { from: 'comp_3', to: 'comp_1' },
    ];
    const cyclicCheck = verifyAcyclicity(validNodes, cyclicEdges);
    expect(cyclicCheck.isAcyclic).toBe(false);
    expect(cyclicCheck.cycles.length).toBeGreaterThan(0);
  });

  test('Autonomous Domain Synthesis from Markdown SOP Document', () => {
    const result = synthesizeDomainBlueprint({
      workspaceName: 'SOP Manajemen Risiko Vendor Pengadaan',
      sourceFiles: [sampleDocPath],
      slug: 'sop-vendor-test',
    });

    expect(result.dagIsAcyclic).toBe(true);
    expect(result.statistics.sourcesCount).toBe(1);
    expect(result.statistics.chunksCount).toBeGreaterThanOrEqual(5);
    expect(result.statistics.competenciesCount).toBe(3);
    expect(result.statistics.gatesCount).toBe(3);
    expect(result.statistics.tasksCount).toBe(3);

    const bp = result.blueprint;
    expect(bp.workspace.name).toBe('SOP Manajemen Risiko Vendor Pengadaan');
    expect(bp.sources.length).toBe(1);
    expect(bp.sources[0].chunks.length).toBeGreaterThanOrEqual(5);

    // Validate 3-Tier Bloom mapping
    const tasks = bp.tasks;
    const taskA = tasks.find((t: any) => t.taskType === 'calculation');
    const taskB = tasks.find((t: any) => t.taskType === 'case_study');
    const taskAdv = tasks.find((t: any) => t.taskType === 'adversarial_dilemma');

    expect(taskA).toBeDefined();
    expect(taskB).toBeDefined();
    expect(taskAdv).toBeDefined();
    expect(taskAdv.adversarialSpec.trapType).toBe('OMISSION_DATA');
  });

  test('Import Synthesized Domain Blueprint and Verify 100% Domain Readiness', async () => {
    const ts = Date.now();
    const creator = await container.userRepository.create({
      email: `synth-creator-${ts}@test.flashlearn`,
      name: 'Curriculum Architect',
      role: 'creator',
    });

    const result = synthesizeDomainBlueprint({
      workspaceName: `Autonomous Domain Verification ${ts}`,
      sourceFiles: [sampleDocPath],
      slug: `auto-domain-${ts}`,
    });

    const imported = await container.importDomainBlueprintUseCase.execute(creator.id, result.blueprint);
    expect(imported.workspaceId).toBeDefined();

    const readiness = await container.describeDomainReadinessUseCase.execute(imported.workspaceId);
    expect(readiness.dagIntegrity.isValid).toBe(true);
    expect(readiness.readiness.score).toBeGreaterThanOrEqual(50);
    expect(readiness.statistics.competenciesCount).toBe(3);
    expect(readiness.statistics.gatesCount).toBe(3);
  });
});
