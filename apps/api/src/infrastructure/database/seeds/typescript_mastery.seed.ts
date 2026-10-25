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

export async function seedTypeScriptMastery(creatorId: string) {
  console.log('🏛️ Seeding TypeScript Mastery & Bun Runtime Domain Blueprint...');

  const activeWs = await db.query.workspaces.findFirst({
    where: (w, { eq }) => eq(w.slug, 'typescript-mastery-bun'),
  });
  if (!activeWs) return;

  // 1. Domain
  const [domain] = await db
    .insert(domains)
    .values({
      workspaceId: activeWs.id,
      code: 'DOM-TS-BUN',
      name: 'TypeScript Mastery & Bun Native Performance',
      slug: 'typescript-mastery-bun-native',
      description: 'Domain penguasaan sistem tipe TypeScript 5.8+, Bun runtime native syscalls, dan Svelte 5 reactive architecture.',
      targetRole: 'Staff Frontend & Fullstack TypeScript Engineer',
      responsibilityScope: 'Wewenang menyusun modul tipe tingkat lanjut, arsitektur reaktif Svelte 5, dan optimasi memori Bun.',
      legalAuthorityLevel: 2,
      minPassingScore: 80,
      icon: '⚡',
      status: 'active',
    })
    .onConflictDoNothing()
    .returning();

  const activeDomain = domain || (await db.query.domains.findFirst({
    where: (d, { and, eq }) => and(eq(d.workspaceId, activeWs.id), eq(d.code, 'DOM-TS-BUN')),
  }));

  // 2. Source & Chunks (Corpus of Record)
  const [source] = await db
    .insert(sources)
    .values({
      workspaceId: activeWs.id,
      domainId: activeDomain?.id,
      code: 'SOP-TS-BUN-2026',
      title: 'Panduan Praktik Terbaik TypeScript 5.8+ & Bun Native Runtime (SOP-TS-BUN-2026-02)',
      version: 'v2.0',
      status: 'active',
      owner: 'Modern Tooling Technical Committee',
      effectiveDate: new Date('2026-02-01'),
    })
    .onConflictDoNothing()
    .returning();

  const activeSource = source || (await db.query.sources.findFirst({
    where: (s, { eq }) => eq(s.code, 'SOP-TS-BUN-2026'),
  }));

  if (!activeSource) return;

  const chunkContents = [
    { tag: 'Bab 1 (Type Algebra & Narrowing)', text: 'TypeScript adalah static compile-time type system. Hindari penggunaan tipe "any" atau cast "as unknown as T" pada domain logic; gunakan Discriminated Unions dan User-Defined Type Guards untuk type narrowing deterministik.' },
    { tag: 'Bab 2 (Bun Zero-Copy I/O)', text: 'Bun runtime memanfaatkan Zig dan engine JavaScriptCore dengan optimasi syscall direct buffer. Menggunakan Bun.file().stream() menghemat konsumsi memori hingga 70% dibandingkan pemuatan buffer penuh ke RAM.' },
    { tag: 'Bab 3 (Svelte 5 Runes Reactive Engine)', text: 'Svelte 5 menggunakan sistem reactivity berbasis Runes ($state, $derived, $effect). State reaktif wajib dienkapsulasi dan hanya memicu update pada fine-grained DOM node tanpa virtual DOM reflow.' },
    { tag: 'Bab 4 (Pencegahan Memory Leak & Concurrency)', text: 'Event listener dan timer tak berbatas dalam modul berumur panjang wajib memiliki cleanup handler eksplisit. Dilarang meninggalkan unhandled promise rejection pada operasi I/O asinkron.' },
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
    { code: 'TSB-01', title: 'Sistem Tipe Tingkat Lanjut & Aljabar Tipe Compile-Time', arch: 'algorithmic_quant', tier: 'remember', risk: 'low', oClass: 'A' },
    { code: 'TSB-02', title: 'Optimasi Syscall I/O & Bun Native Zero-Copy Streaming', arch: 'algorithmic_quant', tier: 'apply', risk: 'medium', oClass: 'A' },
    { code: 'TSB-03', title: 'Arsitektur Reaktif Svelte 5 Runes & Desain State Hermetis', arch: 'ill_structured_case', tier: 'analyze', risk: 'high', oClass: 'B' },
    { code: 'TSB-04', title: 'Pencegahan Memory Leak & Concurrency Race Condition', arch: 'ill_structured_case', tier: 'evaluate', risk: 'critical', oClass: 'B' },
  ];

  const compMap = new Map<string, string>();
  for (const cDef of compsDef) {
    const [c] = await db.insert(competencies).values({
      workspaceId: activeWs.id,
      domainId: activeDomain?.id,
      sourceId: activeSource.id,
      code: cDef.code,
      title: cDef.title,
      description: `Penguasaan ${cDef.title} berpedoman pada SOP-TS-BUN-2026.`,
      cognitiveArchetype: cDef.arch,
      oracleClass: cDef.oClass as any,
      riskLevel: cDef.risk as any,
      isExpertApproved: true,
    }).onConflictDoNothing().returning();
    const activeC = c || (await db.query.competencies.findFirst({ where: (cmp, { and, eq }) => and(eq(cmp.workspaceId, activeWs.id), eq(cmp.code, cDef.code)) }));
    if (activeC) compMap.set(cDef.code, activeC.id);
  }

  // Edges DAG (TSB-01 -> TSB-02 -> TSB-03 -> TSB-04)
  const c1 = compMap.get('TSB-01');
  const c2 = compMap.get('TSB-02');
  const c3 = compMap.get('TSB-03');
  const c4 = compMap.get('TSB-04');
  if (c1 && c2) await db.insert(competencyEdges).values({ competencyId: c2, prerequisiteId: c1 }).onConflictDoNothing();
  if (c2 && c3) await db.insert(competencyEdges).values({ competencyId: c3, prerequisiteId: c2 }).onConflictDoNothing();
  if (c3 && c4) await db.insert(competencyEdges).values({ competencyId: c4, prerequisiteId: c3 }).onConflictDoNothing();

  // 4. Progressive Authorization Gates
  const gatesDef = [
    { level: 0, title: 'Level 0 · Observasi Kode & Review PR', comp: c1, human: false },
    { level: 1, title: 'Level 1 · Pengembang Fitur TypeScript Mandiri', comp: c2, human: false },
    { level: 2, title: 'Level 2 · Spesialis Kinerja Runtime & Svelte Reaktif', comp: c3, human: false },
    { level: 3, title: 'Level 3 · Lead Architect Penjamin Reliabilitas Runtime', comp: c4, human: true },
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
      title: 'Desain Conditional Types & Discriminated Union Event Emitter',
      scenario: 'Rancang generic event listener antarmuka TypedEventEmitter<T> di mana tipe argumen callback secara otomatis terikat ketat dengan nama event tanpa bypass "any".',
      taskType: 'case_study',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        acceptable_verdicts: ['DISCRIMINATED_UNION', 'CONDITIONAL_MAPPED_TYPE'],
        mandatory_citations: ['SOP-TS-BUN-2026', 'Bab 1'],
      },
      rubricCriteria: [
        { name: 'Ketiadaan Type Bypass "any"', weight: 50 },
        { name: 'Ketetapan Aljabar Tipe Compile-Time', weight: 50 },
      ],
    }).onConflictDoNothing();
  }

  if (c2) {
    await db.insert(tasks).values({
      competencyId: c2,
      title: 'Kalkulasi Penghematan Memori Streaming Bun vs Node Buffer (Kelas A)',
      scenario: 'Sebuah file log berukuran 500 MB diproses oleh 20 worker paralel. Metode konvensional me-load seluruh file ke RAM (500 MB per worker = 10.000 MB RAM). Metode streaming Bun zero-copy hanya membutuhkan buffer jendela 4 MB per worker. Hitung penghematan konsumsi RAM dalam persen.',
      taskType: 'calculation',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        formula: '((legacyRam - streamingRam) / legacyRam) * 100',
        variables: { legacyRam: 10000, streamingRam: 80, expectedPercentSavings: 99.2 },
      },
      rubricCriteria: [
        { name: 'Ketepatan Kalkulasi Penghematan RAM (99.2%)', weight: 60 },
        { name: 'Analisis Batas Kapasitas Memori Server', weight: 40 },
      ],
    }).onConflictDoNothing();

    // Isomorphic Variant B
    await db.insert(tasks).values({
      competencyId: c2,
      title: 'Kalkulasi Penghematan RAM Batch CSV Ingestion (Varian B)',
      scenario: 'Proses import data CSV 200 MB dengan 10 request bersamaan. Buffer konvensional: 2.000 MB RAM. Bun streaming chunk 2 MB per request: 20 MB RAM. Hitung efisiensi penghematan RAM dalam persen.',
      taskType: 'calculation',
      scenarioVariantCode: 'variant_b',
      isIsomorphicVariant: true,
      passingScore: 80,
      oracleData: {
        formula: '((legacyRam - streamingRam) / legacyRam) * 100',
        variables: { legacyRam: 2000, streamingRam: 20, expectedPercentSavings: 99.0 },
      },
      rubricCriteria: [
        { name: 'Ketepatan Kalkulasi Efisiensi RAM (99.0%)', weight: 60 },
        { name: 'Pemilihan Ukuran Chunk Optimal', weight: 40 },
      ],
    }).onConflictDoNothing();
  }

  if (c3) {
    await db.insert(tasks).values({
      competencyId: c3,
      title: 'Audit Reaktivitas Svelte 5 Runes: Pencegahan Infinite Effect Loop',
      scenario: 'Sebuah komponen Svelte 5 menggunakan $effect() yang secara tidak sengaja memutasi variabel $state() yang sama di dalam callback effect tanpa kondisi pelindung. Susun audit perbaikan menggunakan $derived().',
      taskType: 'case_study',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        acceptable_verdicts: ['GANTI_KE_DERIVED', 'HINDARI_MUTASI_DALAM_EFFECT'],
        mandatory_citations: ['SOP-TS-BUN-2026', 'Bab 3'],
      },
      rubricCriteria: [
        { name: 'Identifikasi Akar Penyebab Infinite Loop', weight: 50 },
        { name: 'Penerapan Solusi Idiomatis $derived()', weight: 50 },
      ],
    }).onConflictDoNothing();
  }

  if (c4) {
    await db.insert(tasks).values({
      competencyId: c4,
      title: 'Uji Stres Adversarial: Tekanan Pemadaman Server vs Trik "as any" Berbahaya',
      scenario: 'Saat terjadi insiden kritis di production, seorang insinyur junior mengusulkan menambahkan "as any" untuk membungkam error tipe TypeScript agar deployment hotfix dapat segera dipush tanpa tes regresi. Bagaimana disposisi Anda?',
      taskType: 'adversarial_dilemma',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 90,
      adversarialSpec: {
        trapType: 'PRESSURE_INCIDENT',
        correctDisposition: 'REJECT_AND_DEMAND_DATA',
        trapCues: [
          { cue: 'Tekanan insiden downtime production', weight: 0.5 },
          { cue: 'Usulan bypass compile error dengan "as any"', weight: 0.5 },
        ],
        statutoryPolicy: 'SOP-TS-BUN-2026 Bab 4',
        vetoThreshold: 0.7,
      },
      oracleData: {
        acceptable_verdicts: ['TOLAK_ANY_BYPASS', 'PERBAIKI_TIPE_DENGAN_BENAR'],
        checklist: ['Penolakan penulisan tipe any di production hotfix', 'Validasi tipe secara definitif'],
      },
      rubricCriteria: [
        { name: 'Keteguhan Menjaga Integritas Tipe di Tengah Insiden', weight: 50 },
        { name: 'Penyusunan Solusi Tipe Aman Cepat (Safe Type Guard)', weight: 50 },
      ],
    }).onConflictDoNothing();
  }

  // 6. Causal Priming Flashcards
  if (c1 && chunkIds[0]) {
    await db.insert(spacedFlashcards).values({
      userId: creatorId,
      competencyId: c1,
      sourceChunkId: chunkIds[0],
      cardType: 'causal_prediction',
      front: 'Jika sebuah union type tidak memiliki diskriminator literal ("kind" / "type"), bagaimana kemampuan compiler mempersempit tipe (type narrowing)?',
      back: 'Compiler tidak dapat menyimpulkan varian yang tepat di cabang blok if/switch; pengembang terpaksa menggunakan manual type assertion yang rawan runtime error.',
      predictionOptions: [
        'Compiler gagal mempersempit tipe secara otomatis tanpa diskriminator eksplisit',
        'Compiler otomatis membuat kolom baru di database',
        'Runtime V8 mengalami segfault',
      ],
      causalRationale: 'Discriminated unions memanfaatkan literal string/number untuk memberikan kepastian tipe matematis pada waktu kompilasi.',
      category: 'causal_priming',
      repetitionIntervalDays: 1,
      easeFactor: 250,
      consecutiveCorrectAnswers: 0,
      nextReviewDue: new Date(),
    }).onConflictDoNothing();
  }

  console.log('✓ TypeScript Mastery & Bun Runtime Domain Blueprint Seeded Successfully!');
}
