import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { MultiRaterConsensusEngine } from '../src/domain/services/MultiRaterConsensusEngine';

describe('Phase 13: Double-Blind Multi-Rater Consensus Engine (Gwet AC1/AC2 & Arbitration)', () => {
  let workspaceId: string;
  let learnerId: string;
  let rater1Id: string;
  let rater2Id: string;
  let arbiterId: string;
  let compClassC: any;
  let taskClassC: any;

  beforeAll(async () => {
    // 1. Create unique test users
    const ts = Date.now();
    const candidate = await container.userRepository.create({
      email: `candidate-${ts}@test.flashlearn`,
      name: 'Aditya Pratama (Candidate)',
      role: 'guest',
    });
    learnerId = candidate.id;

    const rater1 = await container.userRepository.create({
      email: `rater1-${ts}@test.flashlearn`,
      name: 'Dr. Hendra Gunawan (Senior Assessor)',
      role: 'creator',
    });
    rater1Id = rater1.id;

    const rater2 = await container.userRepository.create({
      email: `rater2-${ts}@test.flashlearn`,
      name: 'Ir. Maya Safitri (Lead Inspector)',
      role: 'creator',
    });
    rater2Id = rater2.id;

    const arbiter = await container.userRepository.create({
      email: `arbiter-${ts}@test.flashlearn`,
      name: 'Prof. Bambang Sudiro (Chief Arbiter)',
      role: 'superadmin',
    });
    arbiterId = arbiter.id;

    // 2. Dedicated hermetic workspace
    const ws = await container.createWorkspaceUseCase.execute(rater1Id, {
      name: 'Procurement Governance Double-Blind Testing',
      slug: `multi-rater-test-${ts}`,
      description: 'Hermetic test workspace for multi-rater consensus',
    });
    workspaceId = ws.id;

    // 3. Class C Competency & Task
    compClassC = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: `COMP-DOC-${ts.toString().slice(-4)}`,
      title: 'Penyusunan Kerangka Acuan Kerja Kontrak Pengadaan Kompleks',
      description: 'Penyusunan dokumen kontrak multi-tahun dengan evaluasi subjektif pakar',
      oracleClass: 'C',
      riskLevel: 'high',
    });

    taskClassC = await container.createTaskUseCase.execute({
      competencyId: compClassC.id,
      title: 'Drafting KAK Sistem Rekrutmen Berbasis Cloud',
      scenario: 'Susun KAK pengadaan cloud hosting dengan klausul kelaikan SLA dan penalti keterlambatan.',
      taskType: 'document_draft',
      oracleData: { requiresHumanGrading: true },
      rubricCriteria: [
        { id: 'c1', title: 'Kelengkapan Klausul SLA', weight: 40, description: 'SLA 99.9%' },
        { id: 'c2', title: 'Struktur Matriks Risiko', weight: 30, description: 'Matriks mitigasi' },
        { id: 'c3', title: 'Kepatuhan Regulasi LKPP', weight: 30, description: 'Perpres 16/2018' },
      ],
      passingScore: 80,
    });
  });

  test('Psychometric Invariant: Prevalence Paradox Immunity (Gwet AC1 vs Cohen Kappa)', () => {
    const engine = new MultiRaterConsensusEngine();

    // Construct 20 criteria where raters agree on 19/20 (95% observed agreement),
    // but the distribution is heavily skewed toward category 3 (19 ratings in cat 3).
    const rubric1: Record<string, number> = {};
    const rubric2: Record<string, number> = {};

    for (let i = 1; i <= 20; i++) {
      if (i === 20) {
        // Only one discordance: R1 gives 3, R2 gives 2
        rubric1[`item_${i}`] = 3;
        rubric2[`item_${i}`] = 2;
      } else {
        // Concordant category 3
        rubric1[`item_${i}`] = 3;
        rubric2[`item_${i}`] = 3;
      }
    }

    const result = engine.calculateReliability(
      { reviewerId: 'r1', totalScore: 95, rubricScores: rubric1 },
      { reviewerId: 'r2', totalScore: 90, rubricScores: rubric2 }
    );

    expect(result.observedAgreement).toBe(0.95);
    // Cohen's Kappa collapses due to marginal skew (Prevalence Paradox)
    expect(result.cohenKappa).toBeLessThan(0.35);
    // Gwet's AC1 and AC2 remain robustly high, reflecting true agreement
    expect(result.gwetAC1).toBeGreaterThanOrEqual(0.85);
    expect(result.gwetAC2).toBeGreaterThanOrEqual(0.85);
    expect(result.hasConsensus).toBe(true);
    expect(result.requiresArbiter).toBe(false);
  });

  test('Double-Blind Assignment & Privacy Sanitization Invariants', async () => {
    // 1. Candidate submits a Class C attempt
    const attempt = await container.attemptRepository.create({
      taskId: taskClassC.id,
      userId: learnerId,
      submission: {
        documentUrl: 'https://storage.dvlpid.my.id/dossiers/kak-cloud-2026.pdf',
        textSummary: 'Dokumen KAK Pengadaan Cloud Hosting 2026 dengan klausul penalti 1% per hari.',
      },
      score: 0,
      feedback: 'Menunggu penilaian double-blind oleh dua penilai independen.',
      assessedBy: 'pending_multi_rater',
      oracleClassUsed: 'C',
      passed: false,
    });

    // Invariant: Candidate cannot review their own submission
    await expect(
      container.assignBlindReviewersUseCase.execute({
        attemptId: attempt.id,
        primaryReviewerId: learnerId,
        secondaryReviewerId: rater2Id,
      })
    ).rejects.toThrow('Self-assessment violation');

    // Invariant: Primary and secondary reviewers must be different
    await expect(
      container.assignBlindReviewersUseCase.execute({
        attemptId: attempt.id,
        primaryReviewerId: rater1Id,
        secondaryReviewerId: rater1Id,
      })
    ).rejects.toThrow('Primary and secondary reviewers must be different individuals');

    // Assign qualified blind reviewers
    const assignment = await container.assignBlindReviewersUseCase.execute({
      attemptId: attempt.id,
      primaryReviewerId: rater1Id,
      secondaryReviewerId: rater2Id,
    });

    expect(assignment.primaryReview.blindToken).toMatch(/^bln_[0-9a-f]{32}$/);
    expect(assignment.secondaryReview.blindToken).toMatch(/^bln_[0-9a-f]{32}$/);
    expect(assignment.primaryReview.blindToken).not.toBe(assignment.secondaryReview.blindToken);

    // Double-blind privacy sanitization: Query submission by blind token
    const sanitized = await container.getBlindReviewByTokenUseCase.execute(
      assignment.primaryReview.blindToken
    );

    expect(sanitized.taskId).toBe(taskClassC.id);
    expect(sanitized.submission.textSummary).toContain('Dokumen KAK Pengadaan Cloud Hosting');
    // Candidate identity and reviewer IDs MUST be strictly absent from the payload
    expect((sanitized as any).candidateName).toBeUndefined();
    expect((sanitized as any).userId).toBeUndefined();
    expect((sanitized as any).reviewerId).toBeUndefined();
    expect((sanitized as any).peerReviewerId).toBeUndefined();
  });

  test('Double-Blind Consensus Approval: Concordant reviewers unlock mastery', async () => {
    // 1. Create a fresh attempt
    const attempt = await container.attemptRepository.create({
      taskId: taskClassC.id,
      userId: learnerId,
      submission: { draft: 'KAK Lengkap Versi Final' },
      score: 0,
      feedback: 'Pending review',
      assessedBy: 'pending_multi_rater',
      oracleClassUsed: 'C',
      passed: false,
    });

    const assignment = await container.assignBlindReviewersUseCase.execute({
      attemptId: attempt.id,
      primaryReviewerId: rater1Id,
      secondaryReviewerId: rater2Id,
    });

    // 2. Rater 1 submits scores (Score = 90)
    const res1 = await container.submitBlindReviewUseCase.execute({
      blindToken: assignment.primaryReview.blindToken,
      rubricScores: { c1: 90, c2: 90, c3: 90 },
      totalScore: 90,
      notes: 'Analisis SLA sangat komprehensif.',
    });
    expect(res1.bothReviewsSubmitted).toBe(false);
    expect(res1.consensusStatus).toBe('in_review');

    // 3. Rater 2 submits concordant scores (Score = 88, Delta = 2%)
    const res2 = await container.submitBlindReviewUseCase.execute({
      blindToken: assignment.secondaryReview.blindToken,
      rubricScores: { c1: 90, c2: 85, c3: 90 },
      totalScore: 88,
      notes: 'Matriks mitigasi risiko sangat baik.',
    });

    expect(res2.bothReviewsSubmitted).toBe(true);
    expect(res2.consensusStatus).toBe('consensus_approved');
    expect(res2.passed).toBe(true);
    expect(res2.finalScore).toBe(89); // Math.round((90 + 88) / 2)
    expect(res2.reliability?.hasConsensus).toBe(true);
    expect(res2.reliability?.scoreDelta).toBe(2);

    // 4. Verify primary attempt record and mastery ledger updated
    const updatedAttempt = await container.attemptRepository.findById(attempt.id);
    expect(updatedAttempt?.passed).toBe(true);
    expect(updatedAttempt?.score).toBe(89);
    expect(updatedAttempt?.assessedBy).toBe('consensus_double_blind');

    const mastery = await container.masteryRepository.findByUserAndCompetency(learnerId, compClassC.id);
    expect(mastery?.status).toBe('mastered');
  });

  test('Dispute Escalation & Chief Arbiter Reconciliation: Divergent raters trigger arbitration', async () => {
    // 1. Create attempt with divergent raters
    const attempt = await container.attemptRepository.create({
      taskId: taskClassC.id,
      userId: learnerId,
      submission: { draft: 'KAK Kontroversial' },
      score: 0,
      feedback: 'Pending review',
      assessedBy: 'pending_multi_rater',
      oracleClassUsed: 'C',
      passed: false,
    });

    const assignment = await container.assignBlindReviewersUseCase.execute({
      attemptId: attempt.id,
      primaryReviewerId: rater1Id,
      secondaryReviewerId: rater2Id,
    });

    // Rater 1 (Dove): Gives high score 94%
    await container.submitBlindReviewUseCase.execute({
      blindToken: assignment.primaryReview.blindToken,
      rubricScores: { c1: 95, c2: 95, c3: 90 },
      totalScore: 94,
    });

    // Rater 2 (Hawk): Gives failing score 66% (Delta = 28% > 15%)
    const res2 = await container.submitBlindReviewUseCase.execute({
      blindToken: assignment.secondaryReview.blindToken,
      rubricScores: { c1: 65, c2: 70, c3: 65 },
      totalScore: 66,
    });

    expect(res2.bothReviewsSubmitted).toBe(true);
    expect(res2.consensusStatus).toBe('arbitration_required');
    expect(res2.reliability?.hasConsensus).toBe(false);
    expect(res2.reliability?.requiresArbiter).toBe(true);
    expect(res2.reliability?.scoreDelta).toBe(28);

    // 2. Chief Arbiter intervenes and resolves dispute
    // Invariant: Original rater cannot act as Chief Arbiter
    await expect(
      container.resolveArbitrationUseCase.execute({
        attemptId: attempt.id,
        arbiterId: rater1Id,
        rubricScores: { c1: 88, c2: 88, c3: 88 },
        totalScore: 88,
      })
    ).rejects.toThrow('Chief Arbiter must be an independent third party');

    // Independent Arbiter evaluates blind with 88%
    const arbitrationResult = await container.resolveArbitrationUseCase.execute({
      attemptId: attempt.id,
      arbiterId: arbiterId,
      rubricScores: { c1: 88, c2: 88, c3: 88 },
      totalScore: 88,
      notes: 'Klausul SLA sesuai standar, matriks risiko cukup memadai untuk disahkan.',
    });

    // Between R1 (94), R2 (66), Arbiter (88):
    // Closest concordant pair is (R1: 94, Arbiter: 88, delta=6).
    // Final score = Math.round((94 + 88) / 2) = 91%
    expect(arbitrationResult.finalScore).toBe(91);
    expect(arbitrationResult.passed).toBe(true);
    expect(arbitrationResult.resolvedMethod).toBe('CONCORDANT_PAIR_R1_ARBITER');

    // Verify consensus record is sealed as arbitration_resolved
    const consensusRec = await container.reviewRepository.findConsensusRecord(attempt.id);
    expect(consensusRec?.status).toBe('arbitration_resolved');
    expect(consensusRec?.finalScore).toBe(91);

    const finalAttempt = await container.attemptRepository.findById(attempt.id);
    expect(finalAttempt?.score).toBe(91);
    expect(finalAttempt?.passed).toBe(true);
    expect(finalAttempt?.assessedBy).toBe('chief_arbiter_arbitration');
  });
});
