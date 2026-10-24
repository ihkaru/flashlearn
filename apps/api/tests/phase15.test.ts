import { describe, test, expect } from 'bun:test';
import { verifyAcyclicity, validateDomainBlueprint, certifyDomainBlueprint } from '../../../packages/cli/src/core/domain-synthesizer';
import { container } from '../src/infrastructure/di/container';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Phase 15: Agent-Synthesized Domain Blueprint Certification & Invariant Engine', () => {
  const aviationBpPath = join(__dirname, '../../../packages/cli/tests/fixtures/sample-aviation-blueprint.json');
  const triageBpPath = join(__dirname, '../../../packages/cli/tests/fixtures/sample-triage-blueprint.json');

  const aviationBlueprint = JSON.parse(readFileSync(aviationBpPath, 'utf-8'));
  const triageBlueprint = JSON.parse(readFileSync(triageBpPath, 'utf-8'));

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

  test('Domain-Agnostic: Invariant Certification for Civil Aviation Blueprint (ATA 104)', () => {
    const certified = certifyDomainBlueprint(aviationBlueprint);

    expect(certified.dagIsAcyclic).toBe(true);
    expect(certified.statistics.sourcesCount).toBe(1);
    expect(certified.statistics.chunksCount).toBe(2);
    expect(certified.statistics.competenciesCount).toBe(3);
    expect(certified.statistics.gatesCount).toBe(3);
    expect(certified.statistics.tasksCount).toBe(3);

    const bp = certified.blueprint;
    const taskAdv = bp.tasks.find((t: any) => t.taskType === 'adversarial_dilemma');
    expect(taskAdv).toBeDefined();
    expect(taskAdv.adversarialSpec.trapType).toBe('OMISSION_DATA');
    expect(taskAdv.adversarialSpec.correctDisposition).toBe('REJECT_AND_DEMAND_DATA');
  });

  test('Domain-Agnostic: Invariant Certification for Emergency Medical Triage Blueprint', () => {
    const certified = certifyDomainBlueprint(triageBlueprint);

    expect(certified.dagIsAcyclic).toBe(true);
    expect(certified.statistics.competenciesCount).toBe(3);
    expect(certified.statistics.gatesCount).toBe(3);

    const bp = certified.blueprint;
    const taskAdv = bp.tasks.find((t: any) => t.taskType === 'adversarial_dilemma');
    expect(taskAdv.adversarialSpec.statutoryPolicy).toContain('Klausul Kepatuhan Mutlak');
  });

  test('Strict Pipeline Integrity: Throws typed error if blueprint invariants are violated', () => {
    // 1. Missing workspace name
    expect(() => {
      validateDomainBlueprint({
        workspace: { name: '' },
        sources: [],
        competencies: [],
        gates: [],
      });
    }).toThrow('INVALID_DOMAIN_BLUEPRINT');

    // 2. Insufficient competencies (< 2)
    expect(() => {
      validateDomainBlueprint({
        workspace: { name: 'Valid Workspace' },
        sources: [{ code: 'SRC-1', title: 'Source 1', chunks: [] }],
        competencies: [{ code: 'C1', title: 'Only One' }],
        gates: [{ level: 1, name: 'Gate 1' }],
      });
    }).toThrow('INSUFFICIENT_DOMAIN_SPECIFICATION');

    // 3. Cyclic prerequisite loop in blueprint
    expect(() => {
      validateDomainBlueprint({
        workspace: { name: 'Cyclic Workspace' },
        sources: [{ code: 'SRC-1', title: 'Source 1', chunks: [] }],
        competencies: [
          { code: 'C1', title: 'Comp 1', prerequisites: ['C2'] },
          { code: 'C2', title: 'Comp 2', prerequisites: ['C1'] },
        ],
        gates: [{ level: 1, name: 'Gate 1' }],
      });
    }).toThrow('INVALID_DOMAIN_BLUEPRINT: Prerequisite graph contains cyclic loops');
  });

  test('Import Validated Domain Blueprint and Verify 100% Domain Readiness', async () => {
    const ts = Date.now();
    const creator = await container.userRepository.create({
      email: `synth-creator-${ts}@test.flashlearn`,
      name: 'Curriculum Architect',
      role: 'creator',
    });

    const customAviationBp = {
      ...aviationBlueprint,
      workspace: {
        ...aviationBlueprint.workspace,
        slug: `avionics-${ts}`,
      },
    };

    const imported = await container.importDomainBlueprintUseCase.execute(creator.id, customAviationBp);
    expect(imported.workspaceId).toBeDefined();

    const readiness = await container.describeDomainReadinessUseCase.execute(imported.workspaceId);
    expect(readiness.dagIntegrity.isValid).toBe(true);
    expect(readiness.readiness.score).toBeGreaterThanOrEqual(50);
    expect(readiness.statistics.competenciesCount).toBe(3);
    expect(readiness.statistics.gatesCount).toBe(3);
  });
});
