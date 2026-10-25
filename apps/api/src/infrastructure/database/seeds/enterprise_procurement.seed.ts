import { db } from '../db';
import {
  workspaces,
  domains,
  sources,
  sourceChunks,
  competencies,
  competencyEdges,
  gates,
  gateRequirements,
  tasks,
  spacedFlashcards,
} from '../schema';
import { createHash } from 'crypto';
import {
  ENTERPRISE_WORKSPACE,
  ENTERPRISE_SOURCE,
  ENTERPRISE_CHUNKS,
  ENTERPRISE_COMPETENCIES,
  ENTERPRISE_EDGES,
  ENTERPRISE_GATES,
} from './enterprise_procurement.data';
import { seedEnterpriseContents } from './enterprise_procurement_contents.data';
import { seedEnterpriseTasks } from './enterprise_procurement_tasks.data';

export async function seedEnterpriseProcurement(creatorId: string) {
  console.log('🏛️ Seeding Enterprise Level Procurement Domain Blueprint...');

  // 1. Workspace
  const [ws] = await db
    .insert(workspaces)
    .values({ ...ENTERPRISE_WORKSPACE, creatorId })
    .onConflictDoNothing()
    .returning();

  const activeWs =
    ws ||
    (await db.query.workspaces.findFirst({
      where: (w, { eq }) => eq(w.slug, ENTERPRISE_WORKSPACE.slug),
    }));

  if (!activeWs) return;

  // 1b. Domains (Authority & Responsibility Tracks)
  const [d1] = await db
    .insert(domains)
    .values({
      workspaceId: activeWs.id,
      code: 'DOM-ENT-STRAT',
      name: 'Strategic Sourcing & Kraljic Specialist',
      slug: 'strategic-sourcing-kraljic',
      description: 'Lintasan kompetensi analisis portofolio pengadaan korporat dan negosiasi TCO.',
      targetRole: 'Spesialis Strategic Sourcing & Analis Pengadaan',
      responsibilityScope: 'Kewenangan memetakan belanja korporat, menentukan strategi sourcing berdasarkan Matriks Kraljic, dan memimpin kalkulasi TCO multi-tahun.',
      legalAuthorityLevel: 2,
      minPassingScore: 85,
      icon: '📊',
      status: 'active',
    })
    .onConflictDoNothing()
    .returning();

  const [d2] = await db
    .insert(domains)
    .values({
      workspaceId: activeWs.id,
      code: 'DOM-ENT-P2P',
      name: 'Procure-to-Pay (P2P) Governance & Anti-Fraud',
      slug: 'p2p-governance-anti-fraud',
      description: 'Lintasan kompetensi pengendalian kontrak, three-way matching, dan mitigasi fraud.',
      targetRole: 'Lead Pengendali Kontrak & Auditor P2P',
      responsibilityScope: 'Kewenangan memvalidasi Three-Way Matching (PO, GR, Invoice), verifikasi kepatuhan vendor due diligence, dan mendeteksi anomali invoice fraud.',
      legalAuthorityLevel: 3,
      minPassingScore: 85,
      icon: '🛡️',
      status: 'active',
    })
    .onConflictDoNothing()
    .returning();

  const activeD1 =
    d1 ||
    (await db.query.domains.findFirst({
      where: (d, { eq, and }) => and(eq(d.workspaceId, activeWs.id), eq(d.code, 'DOM-ENT-STRAT')),
    }));

  const activeD2 =
    d2 ||
    (await db.query.domains.findFirst({
      where: (d, { eq, and }) => and(eq(d.workspaceId, activeWs.id), eq(d.code, 'DOM-ENT-P2P')),
    }));

  // 2. Source & Chunks (Corpus of Record)
  const [source] = await db
    .insert(sources)
    .values({ ...ENTERPRISE_SOURCE, workspaceId: activeWs.id, domainId: activeD1?.id })
    .onConflictDoNothing()
    .returning();

  const activeSource =
    source ||
    (await db.query.sources.findFirst({
      where: (s, { eq }) => eq(s.code, ENTERPRISE_SOURCE.code),
    }));

  if (!activeSource) return;

  for (const chk of ENTERPRISE_CHUNKS) {
    const hash = createHash('sha256').update(chk.content).digest('hex');
    await db
      .insert(sourceChunks)
      .values({
        sourceId: activeSource.id,
        locationTag: chk.locationTag,
        content: chk.content,
        sha256Hash: hash,
      })
      .onConflictDoNothing();
  }

  // 3. Competencies DAG
  const compMap = new Map<string, string>();
  for (const def of ENTERPRISE_COMPETENCIES) {
    const targetDomainId = def.code.includes('03') || def.code.includes('04') ? activeD2?.id : activeD1?.id;
    const [inserted] = await db
      .insert(competencies)
      .values({
        workspaceId: activeWs.id,
        domainId: targetDomainId,
        sourceId: activeSource.id,
        code: def.code,
        title: def.title,
        description: def.description,
        oracleClass: def.oracleClass,
        cognitiveArchetype: def.cognitiveArchetype || 'ill_structured_case',
        riskLevel: def.riskLevel,
        isExpertApproved: true,
      })
      .onConflictDoNothing()
      .returning();

    const node =
      inserted ||
      (await db.query.competencies.findFirst({
        where: (c, { eq, and }) => and(eq(c.workspaceId, activeWs.id), eq(c.code, def.code)),
      }));

    if (node) compMap.set(def.code, node.id);
  }

  // Edges
  for (const edge of ENTERPRISE_EDGES) {
    const fromId = compMap.get(edge.from);
    const toId = compMap.get(edge.to);
    if (fromId && toId) {
      await db
        .insert(competencyEdges)
        .values({ competencyId: toId, prerequisiteId: fromId })
        .onConflictDoNothing();
    }
  }

  // 4. Progressive Authorization Gates
  for (const gDef of ENTERPRISE_GATES) {
    const targetDomainId = gDef.level >= 2 ? activeD2?.id : activeD1?.id;
    const [g] = await db
      .insert(gates)
      .values({
        workspaceId: activeWs.id,
        domainId: targetDomainId,
        level: gDef.level,
        title: gDef.title,
        description: gDef.description,
      })
      .onConflictDoNothing()
      .returning();

    const activeGate =
      g ||
      (await db.query.gates.findFirst({
        where: (gt, { eq, and }) => and(eq(gt.workspaceId, activeWs.id), eq(gt.level, gDef.level)),
      }));

    if (activeGate) {
      for (const reqCode of gDef.requiredCodes) {
        const compId = compMap.get(reqCode);
        if (compId) {
          await db
            .insert(gateRequirements)
            .values({
              gateId: activeGate.id,
              competencyId: compId,
              minimumScore: gDef.level >= 3 ? 85 : 80,
              requiresHumanApproval: gDef.requiresHuman,
            })
            .onConflictDoNothing();
        }
      }
    }
  }

  // 5. Tasks for Competencies
  await seedEnterpriseTasks(compMap);

  // 6. Educational Reading Modules & Active Recall Quizzes
  await seedEnterpriseContents(activeWs.id, compMap);

  // 7. Causal Priming Flashcards
  const c01 = compMap.get('PROC-ENT-01');
  const c02 = compMap.get('PROC-ENT-02');
  if (c01) {
    await db.insert(spacedFlashcards).values({
      userId: creatorId,
      competencyId: c01,
      cardType: 'causal_prediction',
      front: 'Jika komoditas Strategic Items diperlakukan dengan strategi tender spot terbuka (bukan kemitraan jangka panjang), apa dampak kausal pada kontinuitas rantai pasok?',
      back: 'Risiko disrupsi pasokan meningkat tajam saat terjadi kelangkaan pasar, dan vendor tidak memiliki komitmen alokasi prioritas.',
      predictionOptions: [
        'Risiko disrupsi pasokan tinggi saat pasar mengalami krisis kelangkaan',
        'Harga pokok otomatis turun 50%',
        'Vendor otomatis menandatangani SLA perpanjangan gratis',
      ],
      causalRationale: 'Matriks Kraljic menempatkan Strategic Items pada kuadran risiko pasokan tinggi dan dampak finansial besar, mewajibkan aliansi strategis.',
      category: 'causal_priming',
      repetitionIntervalDays: 1,
      easeFactor: 250,
      consecutiveCorrectAnswers: 0,
      nextReviewDue: new Date(),
    }).onConflictDoNothing();
  }

  if (c02) {
    await db.insert(spacedFlashcards).values({
      userId: creatorId,
      competencyId: c02,
      cardType: 'causal_prediction',
      front: 'Mengapa dalam kalkulasi TCO, biaya pemeliharaan multi-tahun (SLA) wajib dijumlahkan sebelum menghitung PPN 11%?',
      back: 'Karena PPN 11% dikenakan pada total nilai kontrak pengadaan yang disepakati, bukan hanya pada harga beli pokok barang di awal.',
      predictionOptions: [
        'PPN dikenakan pada keseluruhan nilai kontrak pengadaan termasuk layanan siklus hidup',
        'SLA tahunan dibebaskan dari pajak pertambahan nilai',
        'Peraturan perpajakan melarang kontrak pengadaan multi-tahun',
      ],
      causalRationale: 'Kalkulasi TCO merefleksikan total beban kas korporat sepanjang umur ekonomis aset pengadaan.',
      category: 'causal_priming',
      repetitionIntervalDays: 1,
      easeFactor: 250,
      consecutiveCorrectAnswers: 0,
      nextReviewDue: new Date(),
    }).onConflictDoNothing();
  }

  console.log('✓ Enterprise Level Procurement Blueprint Seeded Successfully!');
}
