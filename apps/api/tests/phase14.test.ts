import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { CompetencyDriftEngine } from '../src/domain/services/CompetencyDriftEngine';

describe('Phase 14: Predictive Competency Drift & Skill Half-Life Decay Modeling (DSR Model)', () => {
  let workspaceId: string;
  let learnerId: string;
  let compNode: any;
  let gatePassport: any;

  beforeAll(async () => {
    const ts = Date.now();
    const candidate = await container.userRepository.create({
      email: `dsr-pilot-${ts}@test.flashlearn`,
      name: 'Capt. Rian Pratama (Pilot Candidate)',
      role: 'guest',
    });
    learnerId = candidate.id;

    const ws = await container.createWorkspaceUseCase.execute(learnerId, {
      name: 'Aviation Emergency Operations Workspace',
      slug: `av-emerg-${ts}`,
      description: 'Hermetic test workspace for predictive drift modeling',
    });
    workspaceId = ws.id;

    compNode = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: `EMERG-PROC-${ts.toString().slice(-4)}`,
      title: 'Prosedur Darurat Dekompresi Kabin Pesawat',
      description: 'Eksekusi checklist darurat dalam kondisi hipoksia elevasi tinggi',
      oracleClass: 'A',
      riskLevel: 'high',
    });

    // Create a Gate Level 3 (Autonomous High-Risk Authorization)
    const gate = await container.gateRepository.createGate({
      workspaceId,
      level: 3,
      title: 'Otoritas Komando Darurat Penerbangan',
      description: 'Wewenang komando penuh prosedur darurat penerbangan',
    });

    await container.gateRepository.addRequirements(gate.id, [
      {
        competencyId: compNode.id,
        minimumScore: 85,
        requiresHumanApproval: false,
      },
    ]);

    // Learner initially achieves mastery
    const initialMastery = await container.masteryRepository.upsertStatus(
      learnerId,
      compNode.id,
      'mastered'
    );

    // Initial stability S = 30 days, D = 5
    await container.masteryRepository.updateDriftState(initialMastery.id, {
      stability: 30.0,
      difficulty: 5.0,
      cachedRetrievability: 1.0,
      driftStatus: 'active',
    });

    // Grant active passport
    gatePassport = await container.gateRepository.createGrant({
      userId: learnerId,
      gateId: gate.id,
      status: 'active',
      grantedBy: 'flight_safety_board',
      evidenceSnapshot: { verifiedScore: 95 },
    });
  });

  test('DSR Forgetting Curve & Threshold Decay Dynamics', () => {
    const driftEngine = new CompetencyDriftEngine();
    const s = 30.0;

    // 1. Initial day (t = 0)
    expect(driftEngine.computeRetrievability(0, s)).toBe(1.0);
    expect(driftEngine.determineDriftStatus(1.0)).toBe('active');

    // 2. Memory half-life checkpoint (t = 30 days)
    // R(30) = (1 + 0.19 * 30 / 30)^(-0.5) = (1.19)^(-0.5) ≈ 0.916
    const r30 = driftEngine.computeRetrievability(30, s);
    expect(r30).toBeGreaterThanOrEqual(0.90);
    expect(r30).toBeLessThanOrEqual(0.93);
    expect(driftEngine.determineDriftStatus(r30)).toBe('active');

    // 3. Drift Warning zone (R < 0.85)
    // At t = 65 days, R(65) ≈ 0.84 < 0.85
    const r65 = driftEngine.computeRetrievability(65, s);
    expect(r65).toBeLessThan(0.85);
    expect(r65).toBeGreaterThanOrEqual(0.70);
    expect(driftEngine.determineDriftStatus(r65)).toBe('drift_warning');

    // 4. Provisional Expiration zone (R < 0.70)
    // At t = 180 days, R(180) ≈ 0.68 < 0.70
    const r180 = driftEngine.computeRetrievability(180, s);
    expect(r180).toBeLessThan(0.70);
    expect(driftEngine.determineDriftStatus(r180)).toBe('provisionally_expired');
  });

  test('Spaced Retrieval Stability Stretch: Passing challenge stretches stability by > 1.8x', async () => {
    const driftEngine = new CompetencyDriftEngine();

    // Mathematical unit test: S = 30, D = 5, testing at R = 0.80
    const newSMath = driftEngine.updateStability(30.0, 5.0, 0.80, true);
    expect(newSMath).toBeGreaterThan(30.0 * 1.8); // Must expand by > 1.8x

    // End-to-end Use Case execution:
    // Fast forward to day 65 (R ≈ 0.84)
    const sixtyFiveDaysAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000);
    const mastery = await container.masteryRepository.findByUserAndCompetency(learnerId, compNode.id);
    expect(mastery).toBeDefined();

    await container.masteryRepository.updateDriftState(mastery!.id, {
      lastDemonstratedAt: sixtyFiveDaysAgo,
    });

    const revalResult = await container.revalidateCompetencyChallengeUseCase.execute({
      userId: learnerId,
      competencyId: compNode.id,
      passed: true,
      score: 95,
      now: new Date(),
    });

    expect(revalResult.passed).toBe(true);
    expect(revalResult.previousStability).toBe(30.0);
    expect(revalResult.newStability).toBeGreaterThan(50.0);
    expect(revalResult.stretchFactor).toBeGreaterThanOrEqual(1.8);
    expect(revalResult.driftStatus).toBe('active'); // active_verified status restored
    expect(revalResult.newRetrievability).toBe(1.0);

    // Verify persisted state
    const updatedMastery = await container.masteryRepository.findByUserAndCompetency(learnerId, compNode.id);
    expect(updatedMastery?.stability).toBeGreaterThan(50.0);
    expect(updatedMastery?.driftStatus).toBe('active');
  });

  test('Lapse Collapse & Gate Passport Suspension on Severe Decay', async () => {
    const driftEngine = new CompetencyDriftEngine();

    // 1. Math unit test: Failing a challenge collapses stability to <= 3.0 days
    const collapsedSMath = driftEngine.updateStability(30.0, 5.0, 0.70, false);
    expect(collapsedSMath).toBeLessThanOrEqual(3.0);
    expect(collapsedSMath).toBeGreaterThanOrEqual(1.0);

    // 2. Simulate severe decay by setting lastDemonstratedAt to 200 days ago
    const twoHundredDaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const mastery = await container.masteryRepository.findByUserAndCompetency(learnerId, compNode.id);
    expect(mastery).toBeDefined();

    await container.masteryRepository.updateDriftState(mastery!.id, {
      stability: 30.0,
      lastDemonstratedAt: twoHundredDaysAgo,
    });

    // 3. Run decay batch worker
    const batchResult = await container.processCompetencyDecayBatchUseCase.execute(new Date());
    expect(batchResult.totalProcessed).toBeGreaterThan(0);
    expect(batchResult.expiredCount).toBeGreaterThan(0);
    expect(batchResult.suspendedGatePassportsCount).toBeGreaterThan(0);

    // 4. Invariant: Gate Level 3 Passport MUST be provisionally suspended
    const userGrants = await container.gateRepository.listGrantsByUser(learnerId);
    const targetGrant = userGrants.find((g) => g.id === gatePassport.id);
    expect(targetGrant?.status).toBe('provisional');

    // 5. Audit trail records suspension reason
    const auditLogs = await container.auditLogRepository.listByWorkspace(workspaceId);
    const suspensionLog = auditLogs.find((l) => l.action === 'GATE_PASSPORT_SUSPENDED_DRIFT');
    expect(suspensionLog).toBeDefined();
    expect(suspensionLog?.payload.retrievability).toBeLessThan(0.70);
  });

  test('Workspace Drift Audit Radar Report Endpoint and Use Case', async () => {
    const report = await container.auditCompetencyDriftUseCase.execute(workspaceId, {
      threshold: 1.0,
    });

    expect(report.workspaceId).toBe(workspaceId);
    expect(report.totalMonitored).toBeGreaterThan(0);
    expect(report.items.length).toBeGreaterThan(0);

    const auditedItem = report.items.find((i) => i.competencyId === compNode.id);
    expect(auditedItem).toBeDefined();
    expect(auditedItem?.competencyCode).toContain('EMERG-PROC');
    expect(typeof auditedItem?.retrievability).toBe('number');
    expect(typeof auditedItem?.daysUntilWarning).toBe('number');
  });
});
