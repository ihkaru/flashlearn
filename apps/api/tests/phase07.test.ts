import { describe, test, expect, beforeAll } from 'bun:test';
import { createHash } from 'crypto';
import { container } from '../src/infrastructure/di/container';

describe('Phase 07: Immutable Audit Trail (D8) & Regulatory Compliance Exporter', () => {
  let workspaceId: string;
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    const user = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!user) throw new Error('User not found');
    userId = user.id;

    // Create fresh isolated workspace
    const ws = await container.workspaceRepository.create({
      name: 'Phase 07 Audit Trail Test Workspace',
      slug: `phase-07-test-${Date.now()}`,
      description: 'Hermetic test for Audit Trail and Compliance Exporter',
      creatorId: userId,
      isPublic: true,
    });
    workspaceId = ws.id;

    const sourceCode = `AUDIT-STD-${Date.now()}`;
    const sourceRes = await container.ingestSourceUseCase.execute({
      workspaceId,
      title: 'Standar Prosedur Audit Forensik 2026',
      code: sourceCode,
      version: '1.0',
      owner: 'Inspektorat Jenderal',
      effectiveDate: '2026-01-01',
      rawText: `# Bab I
Setiap transaksi keuangan wajib didokumentasikan dan diverifikasi oleh verifikator berwenang.`,
    });

    // Create competency & task
    const comp = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      sourceId: sourceRes.source.id,
      code: 'AUD-COMP-01',
      title: 'Verifikasi Kepatuhan Transaksi',
      description: 'Pemeriksaan kepatuhan transaksi',
      oracleClass: 'A',
      riskLevel: 'low',
    });

    const task = await container.createTaskUseCase.execute({
      competencyId: comp.id,
      title: 'Validasi Jumlah Transaksi',
      scenario: 'Hitung total transaksi dengan dasar biaya 50000000 dan PPN 11%.',
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: {
          total: { expectedValue: 55500000, tolerance: 10 },
        },
      },
      rubricCriteria: [{ id: 'total', title: 'Total Sesuai', weight: 100, description: 'Perhitungan tepat' }],
      passingScore: 80,
    });
    taskId = task.id;
  });

  test('ORACLE_EVALUATED audit log is automatically appended when learner submits attempt', async () => {
    const res = await container.evaluateAttemptUseCase.execute(userId, {
      taskId,
      submission: { total: 55500000 },
    });

    expect(res.passed).toBe(true);

    // Verify audit log exists in D8 append-only repository
    const logs = await container.auditLogRepository.listByWorkspace(workspaceId, 10);
    const evalLog = logs.find((l) => l.action === 'ORACLE_EVALUATED');

    expect(evalLog).toBeDefined();
    expect(evalLog?.targetType).toBe('attempt');
    expect(evalLog?.targetId).toBe(res.attempt.id);
    expect(evalLog?.payload.score).toBe(100);
    expect(evalLog?.payload.passed).toBe(true);
  });

  test('ExportAuditBundleUseCase generates tamper-evident compliance bundle with valid SHA256 checksum', async () => {
    const bundle = await container.exportAuditBundleUseCase.execute(workspaceId);

    expect(bundle).toBeDefined();
    expect(bundle.workspaceId).toBe(workspaceId);
    expect(bundle.totalLogs).toBeGreaterThan(0);
    expect(typeof bundle.bundleSignature).toBe('string');
    expect(bundle.bundleSignature.length).toBe(64); // SHA-256 hex length
    expect(bundle.sources.length).toBe(1);
    expect(bundle.sources[0].code).toContain('AUDIT-STD');

    // Verify tamper-evidence: recalculate checksum on the exported log canonical payload
    const canonicalPayload = JSON.stringify(bundle.logs.map((l) => [l.id, l.action, l.targetId, l.createdAt]));
    const recalculated = createHash('sha256').update(canonicalPayload).digest('hex');
    expect(recalculated).toBe(bundle.bundleSignature);

    // Tampering test: if any field is altered, signature verification must fail
    const tamperedPayload = canonicalPayload.replace('ORACLE_EVALUATED', 'TAMPERED_ACTION');
    const tamperedSig = createHash('sha256').update(tamperedPayload).digest('hex');
    expect(tamperedSig).not.toBe(bundle.bundleSignature);
  });
});
