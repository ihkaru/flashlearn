import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';

describe('Domain Diagnostics & Curriculum-Aware Socratic Tutor', () => {
  let workspaceId: string;
  let compAId: string;
  let compBId: string;

  beforeAll(async () => {
    const user = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!user) throw new Error('User not found');

    const ws = await container.workspaceRepository.create({
      name: 'Diagnostics & Curriculum Test Domain',
      slug: `diag-test-${Date.now()}`,
      description: 'Domain for testing readiness diagnostics and curriculum context injection',
      creatorId: user.id,
      isPublic: true,
    });
    workspaceId = ws.id;

    // 1. Ingest official source
    const sourceCode = `REG-${Date.now()}`;
    const src = await container.ingestSourceUseCase.execute({
      workspaceId,
      title: 'Pedoman Standar Tata Kelola Biaya 2026',
      code: sourceCode,
      version: '1.0',
      owner: 'Badan Standarisasi',
      effectiveDate: '2026-01-01',
      rawText: `# Pasal 1: Definisi Biaya Pokok
Biaya pokok mencakup material langsung dan upah riil tanpa memasukkan keuntungan spekulatif.
# Pasal 2: Batas Margin Keuntungan
Margin keuntungan dibatasi maksimal 15% dari biaya pokok riil.`,
    });

    // 2. Create Competencies (compA has tasks, compB will intentionally be an orphan for gap detection)
    const compA = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      sourceId: src.source.id,
      code: 'DIAG-CALC-01',
      title: 'Kalkulasi Margin Biaya Pokok',
      description: 'Perhitungan batasan keuntungan 15% sesuai regulasi',
      oracleClass: 'A',
      riskLevel: 'low',
    });
    compAId = compA.id;

    const compB = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      sourceId: src.source.id,
      code: 'DIAG-ORPHAN-02',
      title: 'Audit Biaya Spekulatif (Orphan Node)',
      description: 'Deteksi pos biaya fiktif yang tidak memiliki bukti riil',
      oracleClass: 'B',
      riskLevel: 'high',
      prerequisiteIds: [compA.id],
    });
    compBId = compB.id;

    // 3. Create Task ONLY for compA
    await container.createTaskUseCase.execute({
      competencyId: compA.id,
      title: 'Kalkulasi Maksimum Margin Proyek',
      scenario: 'Tentukan batasan keuntungan maksimal jika biaya pokok riil adalah Rp 50.000.000.',
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: {
          maxProfit: { expectedValue: 7500000, tolerance: 10 },
        },
      },
      rubricCriteria: [
        { id: 'crit_margin', title: 'Perhitungan Akurat 15%', weight: 100, description: 'Sesuai Pasal 2' },
      ],
      passingScore: 80,
    });

    // 4. Create Partial Gates (Level 0 and Level 1 only; missing Level 2 and Level 3)
    await container.createGateUseCase.execute({
      workspaceId,
      level: 0,
      title: 'Gate Level 0: Observasi Terbimbing',
      description: 'Akses peninjauan dokumen',
    });
    await container.createGateUseCase.execute({
      workspaceId,
      level: 1,
      title: 'Gate Level 1: Analis Dampingan',
      description: 'Penyusunan berkas di bawah supervisi',
    });

    // 5. Deliver Educational Reading Material to the Learner
    await container.createContentUseCase.execute(user.id, 'creator', {
      workspaceId,
      title: 'Modul 01: Konsep Dasar Biaya Pokok vs Keuntungan',
      slug: `modul-biaya-${Date.now()}`,
      type: 'materi',
      summary: 'Penjelasan rinci mengapa keuntungan dihitung dari biaya riil, bukan estimasi kasar.',
      body: `# Modul 01: Prinsip Tata Kelola Biaya
Dalam sistem akuntansi modern, mahasiswa sering bingung antara 'overhead' dan 'keuntungan'.
Ingat prinsip utama: Keuntungan maksimal 15% hanya dapat diaplikasikan pada biaya dasar riil.`,
      isPublished: true,
    });
  });

  test('DescribeDomainReadinessUseCase: Accurately identifies domain statistics, DAG topology, and gaps', async () => {
    const report = await container.describeDomainReadinessUseCase.execute(workspaceId);

    expect(report).toBeDefined();
    expect(report.workspace.id).toBe(workspaceId);

    // Statistics assertions
    expect(report.statistics.sourcesCount).toBe(1);
    expect(report.statistics.chunksCount).toBe(2);
    expect(report.statistics.competenciesCount).toBe(2);
    expect(report.statistics.tasksCount).toBe(1);
    expect(report.statistics.gatesCount).toBe(2);
    expect(report.statistics.contentsCount).toBe(1);

    // DAG Integrity assertions
    expect(report.dagIntegrity.isValid).toBe(true);
    expect(report.dagIntegrity.cycleDetected).toBe(false);
    expect(report.dagIntegrity.rootNodesCount).toBe(1); // compA is root

    // Gap analysis assertions (crucial for coding agents)
    expect(report.gaps.orphanCompetenciesWithoutTasks.length).toBe(1);
    expect(report.gaps.orphanCompetenciesWithoutTasks[0].code).toBe('DIAG-ORPHAN-02');
    expect(report.gaps.missingGateLevels).toContain(2);
    expect(report.gaps.missingGateLevels).toContain(3);
    expect(report.gaps.missingMaterials).toBe(false);

    // Recommendations for AI Coding Agents
    expect(report.recommendations.length).toBeGreaterThanOrEqual(2);
    const taskRec = report.recommendations.find((r) => r.issue.includes('DIAG-ORPHAN-02'));
    expect(taskRec).toBeDefined();
    expect(taskRec?.suggestedCliCommand).toContain('flashlearn task create');
    expect(taskRec?.suggestedCliCommand).toContain(compBId);

    const gateRec = report.recommendations.find((r) => r.issue.includes('Gate Level 2') || r.issue.includes('Gate Level 3'));
    expect(gateRec).toBeDefined();
    expect(gateRec?.suggestedCliCommand).toContain('flashlearn gate create');
  });

  test('Curriculum-Aware Socratic Tutor: Injects delivered educational materials to diagnose learner confusion', async () => {
    const tasks = await container.taskRepository.listByCompetency(compAId);
    expect(tasks.length).toBeGreaterThan(0);
    const task = tasks[0];

    // Consult Socratic Tutor with a confusion anchored in the lesson
    const hint = await container.askSocraticTutorUseCase.execute(task.id, {
      question: 'Saya bingung apa bedanya overhead dan keuntungan, dan rumus mana yang harus saya pakai untuk Rp 50.000.000?',
    });

    expect(hint).toBeDefined();
    expect(typeof hint.socraticGuidance).toBe('string');
    expect(hint.socraticGuidance.length).toBeGreaterThan(20);
    expect(typeof hint.reflectiveQuestion).toBe('string');
    expect(hint.reflectiveQuestion.length).toBeGreaterThan(10);

    // Anti-Spoiler Invariant: must not reveal answer 7500000
    expect(hint.socraticGuidance).not.toContain('7500000');
    expect(hint.reflectiveQuestion).not.toContain('7500000');
  }, 45000);
});
