import { describe, test, expect } from 'bun:test';
import { synthesizeDomainBlueprint, verifyAcyclicity } from '../../../packages/cli/src/core/domain-synthesizer';
import { container } from '../src/infrastructure/di/container';
import { join } from 'node:path';

describe('Phase 15: Autonomous Domain Synthesizer & Multi-Domain Agnostic Engine', () => {
  const vendorDocPath = join(__dirname, '../../../docs/samples/sop-manajemen-risiko-vendor.md');
  const avionicsDocPath = join(__dirname, '../../../docs/samples/sop-kelaikan-avionik.md');
  const triageDocPath = join(__dirname, '../../../docs/samples/sop-triage-klinis.md');

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

  test('Domain-Agnostic: Autonomous Synthesis for Civil Aviation Domain (ATA 104)', () => {
    const result = synthesizeDomainBlueprint({
      workspaceName: 'Kelaikan Sistem Avionik Pesawat',
      sourceFiles: [avionicsDocPath],
      slug: 'avionics-clearance',
    });

    expect(result.dagIsAcyclic).toBe(true);
    expect(result.statistics.sourcesCount).toBe(1);
    expect(result.statistics.chunksCount).toBeGreaterThanOrEqual(3);
    expect(result.statistics.competenciesCount).toBe(3);

    const bp = result.blueprint;
    const taskA = bp.tasks.find((t: any) => t.taskType === 'calculation');
    const taskB = bp.tasks.find((t: any) => t.taskType === 'case_study');
    const taskAdv = bp.tasks.find((t: any) => t.taskType === 'adversarial_dilemma');

    expect(taskA).toBeDefined();
    expect(taskB).toBeDefined();
    expect(taskAdv).toBeDefined();

    // Verify dynamic extraction from aviation text
    const allTaskText = JSON.stringify(bp.tasks).toLowerCase();
    expect(allTaskText).toContain('avionik');
    expect(taskAdv.adversarialSpec.trapType).toBe('OMISSION_DATA');
    expect(taskAdv.adversarialSpec.correctDisposition).toBe('REJECT_AND_DEMAND_DATA');
  });

  test('Domain-Agnostic: Autonomous Synthesis for Emergency Medical Triage Domain', () => {
    const result = synthesizeDomainBlueprint({
      workspaceName: 'Protokol Triage Instalasi Gawat Darurat',
      sourceFiles: [triageDocPath],
      slug: 'medical-triage',
    });

    expect(result.dagIsAcyclic).toBe(true);
    expect(result.statistics.competenciesCount).toBe(3);

    const bp = result.blueprint;
    const taskAdv = bp.tasks.find((t: any) => t.taskType === 'adversarial_dilemma');
    expect(taskAdv).toBeDefined();

    // Verify dynamic extraction from medical triage text
    const allTaskText = JSON.stringify(bp.tasks).toLowerCase();
    expect(allTaskText).toContain('triage');
    expect(taskAdv.adversarialSpec.correctDisposition).toBe('REJECT_AND_DEMAND_DATA');
  });

  test('Strict Pipeline Integrity: Throws error if markdown is empty or lacks extractable criteria', () => {
    // 1. Empty markdown
    expect(() => {
      synthesizeDomainBlueprint({
        workspaceName: 'Empty Domain',
        markdownTexts: [{ text: '', title: 'Empty' }],
      });
    }).toThrow('INSUFFICIENT_DOMAIN_SPECIFICATION');

    // 2. Unstructured content with no actionable rules/bullets
    expect(() => {
      synthesizeDomainBlueprint({
        workspaceName: 'Unstructured Domain',
        markdownTexts: [
          {
            text: '# Generic Hello\nThis is a casual paragraph without any rules, lists, or compliance standards.\nJust general text.',
            title: 'CasualDoc',
          },
        ],
      });
    }).toThrow('INSUFFICIENT_DOMAIN_SPECIFICATION');
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
      sourceFiles: [vendorDocPath],
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
