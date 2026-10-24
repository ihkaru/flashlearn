import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';

describe('Phase 08: Digital Authority Passport & Public Verification Portal', () => {
  let workspaceId: string;
  let userId: string;
  let gateId: string;
  let grantId: string;

  beforeAll(async () => {
    const user = await container.userRepository.findByEmail('ihza2karunia@gmail.com');
    if (!user) throw new Error('User not found');
    userId = user.id;

    // 1. Create isolated workspace
    const ws = await container.workspaceRepository.create({
      name: 'Phase 08 Passport Test Domain',
      slug: `phase-08-test-${Date.now()}`,
      description: 'Hermetic test for Public Passport Verification',
      creatorId: userId,
      isPublic: true,
    });
    workspaceId = ws.id;

    // 2. Create Gate Level 1
    const gate = await container.createGateUseCase.execute({
      workspaceId,
      level: 1,
      title: 'Level 1 · Pendampingan Teknis Spesifikasi',
      description: 'Wewenang menyusun draf spesifikasi teknis di bawah telaah Pejabat Pembuat Komitmen (PPK).',
    });
    gateId = gate.id;

    // 3. Issue Gate Grant (Passport)
    const grant = await container.gateRepository.createGrant({
      userId,
      gateId,
      status: 'active',
      grantedBy: 'system',
      evidenceSnapshot: {
        gateLevel: 1,
        verifiedCompetencyIds: ['COMP-MOCK-01'],
        timestamp: new Date().toISOString(),
      },
    });
    grantId = grant.id;
  });

  test('Public passport verification returns authentic valid credential details', async () => {
    const passport = await container.verifyPublicPassportUseCase.execute(grantId);

    expect(passport).toBeDefined();
    expect(passport.grantId).toBe(grantId);
    expect(passport.gateLevel).toBe(1);
    expect(passport.gateTitle).toBe('Level 1 · Pendampingan Teknis Spesifikasi');
    expect(passport.status).toBe('active');
    expect(passport.isCurrentlyValid).toBe(true);
    expect(passport.holderName.length).toBeGreaterThan(0);
    expect(passport.workspaceName).toBe('Phase 08 Passport Test Domain');
    expect(passport.verificationUrl).toBe(`/verify/${grantId}`);
  });

  test('Suspended or revoked passport reflects non-active status and presents audit reason', async () => {
    // Revoke passport
    await container.gateRepository.updateGrantStatus(
      grantId,
      'revoked',
      'Regulasi rujukan STANDAR-01 telah kedaluwarsa (Superseded by STANDAR-02)'
    );

    const passport = await container.verifyPublicPassportUseCase.execute(grantId);

    expect(passport.status).toBe('revoked');
    expect(passport.isCurrentlyValid).toBe(false);
    expect(passport.revocationReason).toContain('STANDAR-01 telah kedaluwarsa');
  });

  test('Invalid passport ID throws typed error', async () => {
    expect(
      container.verifyPublicPassportUseCase.execute('00000000-0000-0000-0000-000000000000')
    ).rejects.toThrow('not found or invalid');
  });
});
