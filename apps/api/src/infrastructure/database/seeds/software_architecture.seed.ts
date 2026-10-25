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

export async function seedSoftwareArchitecture(creatorId: string) {
  console.log('🏛️ Seeding Software Engineering & Clean Architecture Domain Blueprint...');

  const activeWs = await db.query.workspaces.findFirst({
    where: (w, { eq }) => eq(w.slug, 'software-engineering-architecture'),
  });
  if (!activeWs) return;

  // 1. Domain
  const [domain] = await db
    .insert(domains)
    .values({
      workspaceId: activeWs.id,
      code: 'DOM-SWE-ARCH',
      name: 'Software Engineering & Clean Architecture',
      slug: 'software-engineering-clean-architecture',
      description: 'Domain rekayasa arsitektur perangkat lunak enterprise: Hexagonal, SOLID, DI, dan pengujian hermetis.',
      targetRole: 'Enterprise Software Architect & Lead Backend Engineer',
      responsibilityScope: 'Wewenang merancang boundary arsitektur, mengaudit kepatuhan SOLID, dan menegakkan pola hermetis.',
      legalAuthorityLevel: 2,
      minPassingScore: 80,
      icon: '🏛️',
      status: 'active',
    })
    .onConflictDoNothing()
    .returning();

  const activeDomain = domain || (await db.query.domains.findFirst({
    where: (d, { and, eq }) => and(eq(d.workspaceId, activeWs.id), eq(d.code, 'DOM-SWE-ARCH')),
  }));

  // 2. Source & Chunks (Corpus of Record)
  const [source] = await db
    .insert(sources)
    .values({
      workspaceId: activeWs.id,
      domainId: activeDomain?.id,
      code: 'SOP-SWE-ARCH-2026',
      title: 'Standar Arsitektur Rekayasa Perangkat Lunak Enterprise (SOP-SWE-ARCH-2026-01)',
      version: 'v1.4',
      status: 'active',
      owner: 'Enterprise Architecture Board',
      effectiveDate: new Date('2026-01-15'),
    })
    .onConflictDoNothing()
    .returning();

  const activeSource = source || (await db.query.sources.findFirst({
    where: (s, { eq }) => eq(s.code, 'SOP-SWE-ARCH-2026'),
  }));

  if (!activeSource) return;

  const chunkContents = [
    { tag: 'Bab 1 (Hexagonal Architecture)', text: 'Lapisan Domain (Core Business Logic) wajib bebas dari pustaka eksternal dan framework HTTP/database. Komunikasi ke luar hanya melalui Driving Ports (Controller) dan Driven Ports (Repository/Gateway Interfaces).' },
    { tag: 'Bab 2 (SOLID Principles)', text: 'Single Responsibility Principle mewajibkan setiap kelas hanya memiliki satu alasan untuk berubah (satu stakeholder). Dependency Inversion mewajibkan modul tingkat tinggi bergantung pada abstraksi, bukan konseptual konkret.' },
    { tag: 'Bab 3 (Hermetic Testing)', text: 'Pengujian perangkat lunak harus stateless, dapat dieksekusi paralel (pytest -n auto / cargo test), tanpa shared mutable globals, dan menggunakan mock I/O berbasis kontrak antarmuka.' },
    { tag: 'Bab 4 (Utang Teknis & Arsitektur)', text: 'Dilarang keras meloloskan silent fallback atau membiarkan kebocoran SQL langsung di controller demi mengejar jadwal rilis tanpa persetujuan Architecture Review Board.' },
  ];

  const chunkIds: string[] = [];
  for (const item of chunkContents) {
    const hash = createHash('sha256').update(item.text).digest('hex');
    const [c] = await db.insert(sourceChunks).values({
      sourceId: activeSource.id,
      locationTag: item.tag,
      content: item.text,
      sha256Hash: hash,
    }).onConflictDoNothing().returning();
    const activeC = c || (await db.query.sourceChunks.findFirst({ where: (sc, { eq }) => eq(sc.sha256Hash, hash) }));
    if (activeC) chunkIds.push(activeC.id);
  }

  // 3. Competencies DAG
  const compsDef = [
    { code: 'SWE-01', title: 'Prinsip Hexagonal Architecture & Isolasi Lapisan Domain', arch: 'artifact_audit', tier: 'remember', risk: 'low', oClass: 'A' },
    { code: 'SWE-02', title: 'Penerapan Single Responsibility Principle & Dependency Injection', arch: 'algorithmic_quant', tier: 'apply', risk: 'medium', oClass: 'A' },
    { code: 'SWE-03', title: 'Desain Repository Pattern & Abstraksi Akses Data Hermetis', arch: 'ill_structured_case', tier: 'analyze', risk: 'high', oClass: 'B' },
    { code: 'SWE-04', title: 'Manajemen Utang Arsitektur & Pertahanan Boundary Kritis', arch: 'ill_structured_case', tier: 'evaluate', risk: 'critical', oClass: 'B' },
  ];

  const compMap = new Map<string, string>();
  for (const cDef of compsDef) {
    const [c] = await db.insert(competencies).values({
      workspaceId: activeWs.id,
      domainId: activeDomain?.id,
      sourceId: activeSource.id,
      code: cDef.code,
      title: cDef.title,
      description: `Penguasaan ${cDef.title} berpedoman pada SOP-SWE-ARCH-2026.`,
      cognitiveArchetype: cDef.arch,
      oracleClass: cDef.oClass as any,
      riskLevel: cDef.risk as any,
      isExpertApproved: true,
    }).onConflictDoNothing().returning();
    const activeC = c || (await db.query.competencies.findFirst({ where: (cmp, { and, eq }) => and(eq(cmp.workspaceId, activeWs.id), eq(cmp.code, cDef.code)) }));
    if (activeC) compMap.set(cDef.code, activeC.id);
  }

  // Edges DAG (SWE-01 -> SWE-02 -> SWE-03 -> SWE-04)
  const c1 = compMap.get('SWE-01');
  const c2 = compMap.get('SWE-02');
  const c3 = compMap.get('SWE-03');
  const c4 = compMap.get('SWE-04');
  if (c1 && c2) await db.insert(competencyEdges).values({ competencyId: c2, prerequisiteId: c1 }).onConflictDoNothing();
  if (c2 && c3) await db.insert(competencyEdges).values({ competencyId: c3, prerequisiteId: c2 }).onConflictDoNothing();
  if (c3 && c4) await db.insert(competencyEdges).values({ competencyId: c4, prerequisiteId: c3 }).onConflictDoNothing();

  // 4. Progressive Authorization Gates
  const gatesDef = [
    { level: 0, title: 'Level 0 · Observasi Arsitektur Kode', comp: c1, human: false },
    { level: 1, title: 'Level 1 · Pengembang Komponen Mandiri', comp: c2, human: false },
    { level: 2, title: 'Level 2 · Pemimpin Modul & Pengawas Integrasi', comp: c3, human: false },
    { level: 3, title: 'Level 3 · Lead Architect Penandatangan Rilis', comp: c4, human: true },
  ];

  for (const gDef of gatesDef) {
    const [g] = await db.insert(gates).values({
      workspaceId: activeWs.id,
      domainId: activeDomain?.id,
      level: gDef.level,
      title: gDef.title,
      description: `Wewenang dan otorisasi bertingkat ${gDef.title}.`,
    }).onConflictDoNothing().returning();
    const activeG = g || (await db.query.gates.findFirst({ where: (gt, { and, eq }) => and(eq(gt.workspaceId, activeWs.id), eq(gt.level, gDef.level)) }));
    if (activeG && gDef.comp) {
      await db.insert(gateRequirements).values({
        gateId: activeG.id,
        competencyId: gDef.comp,
        minimumScore: gDef.level >= 3 ? 85 : 80,
        requiredObservationsCount: 1,
        requiresHumanApproval: gDef.human,
      }).onConflictDoNothing();
    }
  }

  // 5. Tasks (Class A, B, C, Adversarial Dilemma, Isomorphic Variant)
  if (c1) {
    await db.insert(tasks).values({
      competencyId: c1,
      title: 'Audit Pelanggaran Batas Lapisan Domain (Hexagonal Architecture)',
      scenario: 'Ditemukan controller HTTP yang langsung mengimpor modul database PostgreSQL dan menjalankan raw query di dalam handler. Evaluasi pelanggaran terhadap prinsip Ports and Adapters.',
      taskType: 'case_study',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        acceptable_verdicts: ['PELANGGARAN_DOMAIN_ISOLATION', 'REFACTORING_REPOSITORIES'],
        mandatory_citations: ['SOP-SWE-ARCH-2026', 'Bab 1'],
      },
      rubricCriteria: [
        { name: 'Identifikasi Pelanggaran Lapisan Domain', weight: 50 },
        { name: 'Rekomendasi Pemisahan ke Driven Port', weight: 50 },
      ],
    }).onConflictDoNothing();
  }

  if (c2) {
    await db.insert(tasks).values({
      competencyId: c2,
      title: 'Kalkulasi Coupling Metrics & Instability Index Komponen (Kelas A)',
      scenario: 'Modul Billing memiliki 4 dependensi keluar (Efferent Coupling Ce = 4) dan 16 modul lain yang bergantung padanya (Afferent Coupling Ca = 16). Hitung Instability Index I = Ce / (Ca + Ce) dan evaluasi kestabilannya.',
      taskType: 'calculation',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        formula: 'Ce / (Ca + Ce)',
        variables: { Ce: 4, Ca: 16, expectedInstability: 0.2 },
      },
      rubricCriteria: [
        { name: 'Ketepatan Nilai Instability Index (0.2)', weight: 60 },
        { name: 'Analisis Kestabilan Komponen (Highly Stable)', weight: 40 },
      ],
    }).onConflictDoNothing();

    // Isomorphic Variant B
    await db.insert(tasks).values({
      competencyId: c2,
      title: 'Kalkulasi Coupling Metrics Modul Notifikasi (Varian B)',
      scenario: 'Modul Notification memiliki 9 dependensi keluar (Ce = 9) dan 3 modul pemanggil (Ca = 3). Hitung Instability Index I = Ce / (Ca + Ce) dan jelaskan risikonya.',
      taskType: 'calculation',
      scenarioVariantCode: 'variant_b',
      isIsomorphicVariant: true,
      passingScore: 80,
      oracleData: {
        formula: 'Ce / (Ca + Ce)',
        variables: { Ce: 9, Ca: 3, expectedInstability: 0.75 },
      },
      rubricCriteria: [
        { name: 'Ketepatan Nilai Instability Index (0.75)', weight: 60 },
        { name: 'Analisis Kestabilan Komponen (Highly Unstable/Volatile)', weight: 40 },
      ],
    }).onConflictDoNothing();
  }

  if (c3) {
    await db.insert(tasks).values({
      competencyId: c3,
      title: 'Audit Repository Hermetis & Pencegahan Kebocoran State Pengujian',
      scenario: 'Sebuah unit test suite menggunakan variabel database global singleton yang dimutasi saat pengujian paralel dijalankan. Susun diagnosis dan rekomendasi migrasi ke Dependency Injection hermetis.',
      taskType: 'case_study',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        acceptable_verdicts: ['HILANGKAN_MUTABLE_GLOBAL', 'INJEKSI_TRANSAKSI_ISOLASI'],
        mandatory_citations: ['SOP-SWE-ARCH-2026', 'Bab 3'],
      },
      rubricCriteria: [
        { name: 'Diagnosis Akar Masalah State Kebocoran Global', weight: 50 },
        { name: 'Solusi Hermetic Testing & Desain DI', weight: 50 },
      ],
    }).onConflictDoNothing();
  }

  if (c4) {
    await db.insert(tasks).values({
      competencyId: c4,
      title: 'Uji Stres Adversarial: Desakan Jadwal Rilis vs Bypass Lapisan Validasi Arsitektur',
      scenario: 'Product Manager mendesak agar fitur pembayaran langsung membaca tabel mutasi bank tanpa melewati PaymentGateway Port demi mengejar promo tengah malam. Bagaimana disposisi dan mitigasi risiko Anda?',
      taskType: 'adversarial_dilemma',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 90,
      adversarialSpec: {
        trapType: 'PRESSURE_EXECUTIVE',
        correctDisposition: 'REJECT_AND_DEMAND_DATA',
        trapCues: [
          { cue: 'Desakan peluncuran promo tengah malam', weight: 0.5 },
          { cue: 'Bypass antarmuka PaymentGateway Port', weight: 0.5 },
        ],
        statutoryPolicy: 'SOP-SWE-ARCH-2026 Bab 4',
        vetoThreshold: 0.7,
      },
      oracleData: {
        acceptable_verdicts: ['TOLAK_BYPASS', 'TERAPKAN_ADAPTER_RESMI'],
        checklist: ['Penolakan bypass arsitektur', 'Eskalasi ke Architecture Review Board'],
      },
      rubricCriteria: [
        { name: 'Keteguhan Mempertahankan Integritas Arsitektur', weight: 50 },
        { name: 'Rujukan Kebijakan SOP Bab 4', weight: 50 },
      ],
    }).onConflictDoNothing();
  }

  // 6. Causal Schema Priming Flashcards
  if (c1 && chunkIds[0]) {
    await db.insert(spacedFlashcards).values({
      userId: creatorId,
      competencyId: c1,
      sourceChunkId: chunkIds[0],
      cardType: 'causal_prediction',
      front: 'Jika sebuah modul Domain Entity mengimpor modul HTTP Request secara langsung, apa konsekuensi langsung terhadap unit test?',
      back: 'Unit test domain tidak lagi hermetis; pengujian domain menjadi bergantung pada runtime HTTP server dan mock network.',
      predictionOptions: [
        'Domain test menjadi lambat dan membutuhkan server HTTP aktif',
        'Database otomatis mengalami deadlock',
        'TypeScript tidak dapat melakukan compile',
      ],
      causalRationale: 'Prinsip Hexagonal Architecture mengisolasi domain dari protokol I/O agar domain dapat diuji murni in-memory.',
      category: 'causal_priming',
      repetitionIntervalDays: 1,
      easeFactor: 250,
      consecutiveCorrectAnswers: 0,
      nextReviewDue: new Date(),
    }).onConflictDoNothing();
  }

  console.log('✓ Software Engineering & Clean Architecture Domain Blueprint Seeded Successfully!');
}
