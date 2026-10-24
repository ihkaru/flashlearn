import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import type { DomainBlueprint } from '@flashlearn/shared';

describe('Phase 09: Universal Domain Blueprint Importer (Zero Hardcoding Enforcer)', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!user) throw new Error('User not found');
    userId = user.id;
  });

  test('Declaratively imports complex Aviation Maintenance (ATA 104) domain blueprint without hardcoding', async () => {
    const aviationBlueprint: DomainBlueprint = {
      version: '1.0.0',
      workspace: {
        name: 'Avionics Maintenance & Airworthiness Release',
        slug: `avionics-release-${Date.now()}`,
        description: 'ATA 104 Level III Aircraft Avionics & Flight Control Certification Engine',
        icon: '✈️',
      },
      sources: [
        {
          code: `FAA-FAR-43-${Date.now()}`,
          title: 'Federal Aviation Regulations Part 43: Maintenance & Inspections',
          version: 'Rev-2026',
          owner: 'FAA Flight Standards',
          effectiveDate: '2026-01-15',
          chunks: [
            {
              locationTag: 'FAR 43.9(a)',
              content: 'Each person who maintains, performs preventive maintenance, or alters an aircraft must make an entry in the maintenance record containing a description of work performed and the signature and certificate number.',
            },
            {
              locationTag: 'FAR 43.13(b)',
              content: 'Each person maintaining or altering aircraft shall use materials of such quality that the condition will be at least equal to its original or properly altered condition with respect to aerodynamic characteristics.',
            },
          ],
        },
      ],
      competencies: [
        {
          code: 'AV-ELEC-01',
          title: 'Aircraft Electrical Wiring Interconnect System (EWIS) Inspection',
          description: 'Visual and instrument testing of cockpit wiring harnesses for chafing and voltage drop.',
          oracleClass: 'A',
          riskLevel: 'medium',
        },
        {
          code: 'AV-CALIB-02',
          title: 'Pitot-Static System Pressure Calibration',
          description: 'Precision calculation of static pressure leak rate and altimeter tolerance thresholds.',
          oracleClass: 'A',
          riskLevel: 'high',
          prerequisites: ['AV-ELEC-01'],
        },
        {
          code: 'AV-AIRW-03',
          title: 'Airworthiness Release & Return-to-Service Investigation',
          description: 'Case evaluation of unapproved parts (bogus parts) discovery and legal airworthiness disposition.',
          oracleClass: 'B',
          riskLevel: 'high',
          prerequisites: ['AV-CALIB-02'],
        },
      ],
      gates: [
        {
          level: 0,
          title: 'Level 0 · Hangar Observation Apprentice',
          description: 'Authorized to assist licensed mechanics under direct visual line-of-sight supervision.',
          requirements: [
            {
              competencyCode: 'AV-ELEC-01',
              minimumScore: 80,
            },
          ],
        },
        {
          level: 3,
          title: 'Level 3 · Certified Airworthiness Release Sign-off Authority',
          description: 'Full legal authority to sign aircraft maintenance records and approve return-to-service.',
          requirements: [
            {
              competencyCode: 'AV-AIRW-03',
              minimumScore: 85,
              requiresHumanApproval: true,
            },
          ],
        },
      ],
      tasks: [
        {
          competencyCode: 'AV-CALIB-02',
          title: 'Pitot-Static Leak Rate Calculation for Boeing 737 Altimeter',
          scenario: 'System pressurized to 1000 ft/min equivalent. Maximum permitted leakage is 100 ft/min over 1 minute.',
          taskType: 'calculation',
          oracleData: {
            expectedFormulas: {
              leak_rate_fpm: { expectedValue: 45, tolerance: 5 },
            },
            checklist: ['seal_integrity_test', 'hose_clamp_torque_verified'],
          },
          rubricCriteria: [
            { id: 'leak_rate_fpm', title: 'Leak Rate Calculation', weight: 60, description: 'Within 50 ft/min tolerance' },
            { id: 'seal_integrity_test', title: 'Seal Integrity', weight: 20, description: 'Visual check' },
            { id: 'hose_clamp_torque_verified', title: 'Torque Check', weight: 20, description: 'Calibrated wrench' },
          ],
          passingScore: 80,
        },
      ],
    };

    const result = await container.importDomainBlueprintUseCase.execute(userId, aviationBlueprint);

    expect(result).toBeDefined();
    expect(result.sourcesCreated).toBe(1);
    expect(result.competenciesCreated).toBe(3);
    expect(result.edgesLinked).toBe(2);
    expect(result.gatesCreated).toBe(2);
    expect(result.tasksCreated).toBe(1);

    // Verify workspace was created and graph has proper structure
    const graph = await container.getCompetencyGraphUseCase.execute(result.workspaceId);
    expect(graph.totalNodes).toBe(3);
    expect(graph.edges.length).toBe(2);

    // Downstream node AV-CALIB-02 should be initially locked for a new learner
    const calibNode = graph.nodes.find((n) => n.code === 'AV-CALIB-02');
    expect(calibNode?.userStatus).toBe('locked');
    expect(calibNode?.blockingPrerequisites.length).toBe(1);
    expect(calibNode?.blockingPrerequisites[0].code).toBe('AV-ELEC-01');
  });
});
