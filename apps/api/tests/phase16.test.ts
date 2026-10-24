import { describe, test, expect, beforeAll } from 'bun:test';
import { container } from '../src/infrastructure/di/container';
import { canonicalizeJson } from '../src/domain/services/W3cCredentialCryptoEngine';
import type { W3CVerifiableCredential20 } from '@flashlearn/shared';

describe('Phase 16: Cryptographic Verifiable Credentials & OpenBadges 3.0 (Ed25519 & RDFC-1.0)', () => {
  let workspaceId: string;
  let candidateId: string;
  let compNode: any;
  let gateId: string;
  let issuedVc: W3CVerifiableCredential20;

  beforeAll(async () => {
    const ts = Date.now();
    const candidate = await container.userRepository.create({
      email: `vc-practitioner-${ts}@test.flashlearn`,
      name: 'Dr. Sarah Nurhaliza (Certified Nuclear Safety Auditor)',
      role: 'guest',
    });
    candidateId = candidate.id;

    const ws = await container.createWorkspaceUseCase.execute(candidateId, {
      name: 'National Nuclear Energy Regulatory Authority',
      slug: `bapeten-reg-${ts}`,
      description: 'Hermetic test workspace for W3C Verifiable Credentials',
    });
    workspaceId = ws.id;

    compNode = await container.createCompetencyNodeUseCase.execute({
      workspaceId,
      code: `NUC-SAFE-${ts.toString().slice(-4)}`,
      title: 'Audit Integritas Reaktor Nuklir Riset',
      description: 'Verifikasi kepatuhan sistem pendingin primer standar IAEA GSR Part 4',
      oracleClass: 'C',
      riskLevel: 'critical',
    });

    const gate = await container.gateRepository.createGate({
      workspaceId,
      level: 3,
      title: 'Otoritas Inspektur Senior Fasilitas Nuklir (Gate 3 Capstone)',
      description: 'Wewenang legal penandatanganan sertifikat kelaikan operasi reaktor',
    });
    gateId = gate.id;

    await container.gateRepository.addRequirements(gate.id, [
      {
        competencyId: compNode.id,
        minimumScore: 90,
        requiresHumanApproval: true,
      },
    ]);

    // Initial mastery established
    const mastery = await container.masteryRepository.upsertStatus(
      candidateId,
      compNode.id,
      'mastered'
    );

    await container.masteryRepository.updateDriftState(mastery.id, {
      stability: 45.0,
      difficulty: 4.0,
      cachedRetrievability: 1.0,
      driftStatus: 'active',
      lastDemonstratedAt: new Date(),
    });

    // Grant active authority passport
    await container.gateRepository.createGrant({
      userId: candidateId,
      gateId: gate.id,
      status: 'active',
      grantedBy: 'nuclear_regulatory_commission',
      evidenceSnapshot: {
        verifiedScore: 98,
        verifiedCompetencyIds: [compNode.id],
      },
    });
  });

  test('Deterministic Canonicalization (RDFC JSON Key Lexicographical Ordering)', () => {
    const unarranged = {
      z_alpha: 100,
      issuer: { name: 'Authority', id: 'did:web:example' },
      a_meta: 'verified',
    };

    const canonical = canonicalizeJson(unarranged);
    // Keys must appear in strict alphabetical order: "a_meta", then "issuer" (with "id", "name"), then "z_alpha"
    expect(canonical).toBe(
      '{"a_meta":"verified","issuer":{"id":"did:web:example","name":"Authority"},"z_alpha":100}'
    );
  });

  test('Scenario 1: Issuing W3C VC 2.0 with Ed25519 DataIntegrityProof & Offline Verification', async () => {
    issuedVc = await container.issueVerifiableCredentialUseCase.execute({
      gateId,
      userId: candidateId,
    });

    // 1. Structure adheres to W3C VC 2.0 and OpenBadges 3.0
    expect(issuedVc['@context']).toContain('https://www.w3.org/ns/credentials/v2');
    expect(issuedVc['@context']).toContain('https://purl.imsglobal.org/spec/ob/v3p0/context.json');
    expect(issuedVc.type).toContain('VerifiableCredential');
    expect(issuedVc.type).toContain('OpenBadgeCredential');
    expect(issuedVc.type).toContain('DigitalAuthorityPassport');
    expect(issuedVc.issuer.id).toContain(workspaceId);
    expect(issuedVc.credentialSubject.id).toContain(candidateId);
    expect(issuedVc.credentialSubject.achievement.gateId).toBe(gateId);
    expect(issuedVc.credentialSubject.achievement.verifiedCompetencies).toContain(compNode.id);

    // 2. DataIntegrityProof specification
    expect(issuedVc.proof.type).toBe('DataIntegrityProof');
    expect(issuedVc.proof.cryptosuite).toBe('eddsa-rdfc-2022');
    expect(issuedVc.proof.proofPurpose).toBe('assertionMethod');
    expect(typeof issuedVc.proof.proofValue).toBe('string');
    expect(issuedVc.proof.proofValue.length).toBeGreaterThan(64);

    // 3. Mathematical Offline Verification
    const verification = await container.verifyVerifiableCredentialUseCase.execute(issuedVc);
    expect(verification.valid).toBe(true);
    expect(verification.credentialId).toBe(issuedVc.id);
    expect(verification.issuerId).toBe(issuedVc.issuer.id);
    expect(verification.achievementTitle).toBe(issuedVc.credentialSubject.achievement.gateTitle);

    // 4. Persistence in repository
    const stored = await container.credentialRepository.findCredentialById(issuedVc.id);
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe('active');
  });

  test('Scenario 2: Tamper Detection (1-bit mutation in claim produces SIGNATURE_MISMATCH)', async () => {
    // Clone original credential
    const tamperedVc: W3CVerifiableCredential20 = JSON.parse(JSON.stringify(issuedVc));

    // Tamper 1 property in credentialSubject
    tamperedVc.credentialSubject.achievement.gateTitle = 'Otoritas Palsu Tanpa Kualifikasi';

    const verification = await container.verifyVerifiableCredentialUseCase.execute(tamperedVc);
    expect(verification.valid).toBe(false);
    expect(verification.error).toBe('SIGNATURE_MISMATCH');
  });

  test('Scenario 3: Competency Drift blocks credential issuance when R(t) < 0.85', async () => {
    // Simulate candidate whose competency has decayed (e.g. 80 days elapsed with S = 45 days => R < 0.85)
    const mastery = await container.masteryRepository.findByUserAndCompetency(candidateId, compNode.id);
    expect(mastery).toBeDefined();

    const eightyDaysAgo = new Date(Date.now() - 80 * 24 * 60 * 60 * 1000);
    await container.masteryRepository.updateDriftState(mastery!.id, {
      lastDemonstratedAt: eightyDaysAgo,
      driftStatus: 'drift_warning',
    });

    // Attempting to issue VC must fail immediately
    let thrownError: Error | null = null;
    try {
      await container.issueVerifiableCredentialUseCase.execute({
        gateId,
        userId: candidateId,
      });
    } catch (err: any) {
      thrownError = err;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError!.message).toContain('COMPETENCY_DRIFT_UNSTABLE');
    expect(thrownError!.message).toContain('Revalidation required prior to credential issuance');

    // Restore candidate mastery stability for clean state
    await container.masteryRepository.updateDriftState(mastery!.id, {
      lastDemonstratedAt: new Date(),
      driftStatus: 'active',
      cachedRetrievability: 1.0,
    });
  });
});
