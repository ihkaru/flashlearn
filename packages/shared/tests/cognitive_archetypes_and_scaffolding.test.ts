import { describe, it, expect } from 'bun:test';
import { BackwardScaffoldingGenerator } from '../../../apps/api/src/application/services/BackwardScaffoldingGenerator';
import { TaskEntity } from '../../../apps/api/src/domain/entities/Task';
import type { CompetencyNode } from '../src/types/competency';

describe('Cognitive Archetypes & Backward Scaffolding Engine (October 2026)', () => {
  const generator = new BackwardScaffoldingGenerator();

  it('generates algorithmic_quant scaffolding with formulas, isomorphic steps, and trap analysis', () => {
    const comp: CompetencyNode = {
      id: 'comp-quant-1',
      workspaceId: 'ws-1',
      code: 'PROC-ENT-02',
      title: 'Kalkulasi Total Cost of Ownership (TCO)',
      description: 'Analisis biaya siklus hidup pengadaan modal multi-tahun.',
      oracleClass: 'A',
      cognitiveArchetype: 'algorithmic_quant',
      riskLevel: 'medium',
      isExpertApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const task = new TaskEntity({
      id: 'task-quant-1',
      competencyId: comp.id,
      title: 'Kalkulasi TCO Storage SAN Tier-1',
      scenario: 'Perusahaan merencanakan pengadaan SAN Storage...',
      taskType: 'calculation',
      passingScore: 80,
      oracleData: {
        formula: 'purchasePrice + implementationCost + (annualSla * contractYears) - residualValue',
        variables: {
          purchasePrice: 750000000,
          implementationCost: 120000000,
          annualSla: 55000000,
          contractYears: 4,
          residualValue: 90000000,
        },
      },
      rubricCriteria: [{ name: 'Akurasi Perhitungan', weight: 100 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const bundle = generator.generate(comp, [task], ['SOP-CORP-PROC-2026-08 Pasal 3']);

    expect(bundle.jobAid).toBeDefined();
    expect(bundle.jobAid.formulas).toBeDefined();
    expect(bundle.jobAid.formulas!['Formula Inti']).toContain('purchasePrice');
    expect(bundle.jobAid.checklist!.length).toBeGreaterThan(2);

    expect(bundle.workedExamples.length).toBeGreaterThan(0);
    const we = bundle.workedExamples[0];
    expect(we.title).toContain('TCO');
    // Ensure isomorphic difference (different numbers from task: 400M vs 750M)
    expect(we.scenario).not.toContain('750.000.000');
    expect(we.solutionSteps.some((s) => s.commonTrap !== undefined)).toBe(true);

    expect(bundle.microSandbox).toBeDefined();
    expect(bundle.microSandbox!.checkpoints.length).toBeGreaterThan(0);
  });

  it('generates artifact_audit scaffolding with defect detection and audit checklists', () => {
    const comp: CompetencyNode = {
      id: 'comp-audit-1',
      workspaceId: 'ws-1',
      code: 'PROC-ENT-03',
      title: 'Evaluasi Uji Tuntas Rekanan Tender',
      description: 'Audit kepatuhan yuridis berkas penawaran.',
      oracleClass: 'B',
      cognitiveArchetype: 'artifact_audit',
      riskLevel: 'high',
      isExpertApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const task = new TaskEntity({
      id: 'task-audit-1',
      competencyId: comp.id,
      title: 'Evaluasi Uji Tuntas Rekanan Tender ERP',
      scenario: 'Peserta tender PT Sinergi Solusi mengunggah berkas...',
      taskType: 'case_study',
      passingScore: 85,
      oracleData: {
        acceptable_verdicts: ['GUGUR', 'DISKUALIFIKASI'],
        mandatory_citations: ['SOP-CORP-PROC-2026-08', 'Pasal 4'],
        checklist: ['Verifikasi sertifikat ISO 27001', 'Uji keabsahan laporan keuangan'],
      },
      rubricCriteria: [{ name: 'Ketepatan Putusan', weight: 100 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const bundle = generator.generate(comp, [task]);

    expect(bundle.jobAid.checklist!.length).toBeGreaterThan(0);
    expect(bundle.workedExamples.length).toBeGreaterThan(0);
    const we = bundle.workedExamples[0];
    expect(we.solutionSteps.some((s) => s.commonTrap !== undefined)).toBe(true);
    expect(bundle.microSandbox).toBeDefined();
  });

  it('generates ill_structured_case scaffolding with contrasting decisions and ethical analysis', () => {
    const comp: CompetencyNode = {
      id: 'comp-case-1',
      workspaceId: 'ws-1',
      code: 'PROC-ENT-05',
      title: 'Anti-Fraud & Investigasi Pengadaan',
      description: 'Penanganan dilema benturan kepentingan.',
      oracleClass: 'B',
      cognitiveArchetype: 'ill_structured_case',
      riskLevel: 'high',
      isExpertApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const task = new TaskEntity({
      id: 'task-case-1',
      competencyId: comp.id,
      title: 'Investigasi Dugaan Benturan Kepentingan Vendor Afiliasi',
      scenario: 'Ditemukan indikasi kepemilikan saham silang...',
      taskType: 'adversarial_dilemma',
      passingScore: 85,
      adversarialSpec: {
        dilemmaType: 'whistleblower_intimidation',
        authorityLevel: 3,
        primaryConstraint: 'Integritas audit mutlak',
        distractorNarratives: ['Target penyerapan anggaran'],
        goldStandardAction: 'Lapor komite audit independen',
        compromiseTrap: 'Menyetujui secara diam-diam',
      },
      oracleData: {
        acceptable_verdicts: ['LAPOR_KOMITE', 'TOLAK'],
      },
      rubricCriteria: [{ name: 'Integritas Etika', weight: 100 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const bundle = generator.generate(comp, [task]);

    expect(bundle.jobAid.checklist!.some((c) => c.includes('Conflict of Interest'))).toBe(true);
    expect(bundle.workedExamples[0].title).toContain('Kasus Kontras');
    expect(bundle.workedExamples[0].solutionSteps.some((s) => s.step.includes('Fatal'))).toBe(true);
  });
});
