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

export async function seedWilkerstat(creatorId: string) {
  console.log('🏛️ Seeding Pelatihan Wilkerstat SE2026 Domain Blueprint...');

  const activeWs = await db.query.workspaces.findFirst({
    where: (w, { eq }) => eq(w.slug, 'wilkerstat-se2026-mempawah'),
  });
  if (!activeWs) return;

  // 1. Domain
  const [domain] = await db
    .insert(domains)
    .values({
      workspaceId: activeWs.id,
      code: 'DOM-WKS-SE2026',
      name: 'Pemetaan Wilayah Kerja Statistik SE2026',
      slug: 'pemetaan-wilkerstat-se2026',
      description: 'Domain kompetensi pemetaan spasial Wilkerstat Sensus Ekonomi 2026: deliniasi SLS, geotagging, dan rekonsiliasi batas.',
      targetRole: 'Petugas Pemetaan & Verifikator Wilkerstat BPS',
      responsibilityScope: 'Wewenang melakukan deliniasi batas SLS di lapangan, geotagging infrastruktur usaha, dan rekonsiliasi sengketa batas.',
      legalAuthorityLevel: 2,
      minPassingScore: 80,
      icon: '🗺️',
      status: 'active',
    })
    .onConflictDoNothing()
    .returning();

  const activeDomain = domain || (await db.query.domains.findFirst({
    where: (d, { and, eq }) => and(eq(d.workspaceId, activeWs.id), eq(d.code, 'DOM-WKS-SE2026')),
  }));

  // 2. Source & Chunks (Corpus of Record)
  const [source] = await db
    .insert(sources)
    .values({
      workspaceId: activeWs.id,
      domainId: activeDomain?.id,
      code: 'BPS-SE2026-WKS-SOP',
      title: 'Pedoman Teknis Pemetaan Wilkerstat Sensus Ekonomi 2026 (BPS-SE2026-SOP-03)',
      version: 'v1.1',
      status: 'active',
      owner: 'Direktorat Pengembangan Metodologi Sensus & Survei BPS RI',
      effectiveDate: new Date('2026-03-01'),
    })
    .onConflictDoNothing()
    .returning();

  const activeSource = source || (await db.query.sources.findFirst({
    where: (s, { eq }) => eq(s.code, 'BPS-SE2026-WKS-SOP'),
  }));

  if (!activeSource) return;

  const chunkContents = [
    { tag: 'Bagian 1 (Konsep SLS & Non-SLS)', text: 'Satuan Lingkungan Setempat (SLS) adalah wilayah administratif terkecil di bawah desa/kelurahan (RT/RW/Dusun). Wilayah di luar SLS diidentifikasi sebagai Non-SLS (kawasan hutan, perkebunan terisolasi, kawasan industri).' },
    { tag: 'Bagian 2 (Presisi Geotagging & Akurasi GPS)', text: 'Geotagging wajib dilakukan di titik masuk utama tempat usaha dengan akurasi GPS horizontal maksimal 10 meter. Titik dengan akurasi di atas 10 meter wajib diulang (retag) di tempat terbuka.' },
    { tag: 'Bagian 3 (Deliniasi Polygon & Citra CSRT)', text: 'Batas SLS digambar mengikuti tanda fisik alami (sungai, jalan, parit) yang jelas pada Citra Satelit Resolusi Sangat Tinggi (CSRT). Dilarang keras menggambar polygon yang saling tumpang tindih (overlap) antar SLS.' },
    { tag: 'Bagian 4 (Penyelesaian Sengketa Batas Lapangan)', text: 'Jika terjadi klaim sepihak batas oleh kepala lingkungan/RT, petugas pemetaan dilarang mengubah batas sepihak; wajib mengundang kedua belah pihak dengan aparat desa untuk penandatanganan Berita Acara Rekonsiliasi Batas.' },
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
    { code: 'WKS-01', title: 'Konsep Dasar Batas Wilayah Administrasi & Identifikasi SLS', arch: 'artifact_audit', tier: 'remember', risk: 'low', oClass: 'A' },
    { code: 'WKS-02', title: 'Teknik Geotagging Presisi Tinggi & Validasi Koordinat Spasial', arch: 'algorithmic_quant', tier: 'apply', risk: 'medium', oClass: 'A' },
    { code: 'WKS-03', title: 'Deliniasi Polygon Peta Digital & Overlay Citra Satelit', arch: 'ill_structured_case', tier: 'analyze', risk: 'high', oClass: 'B' },
    { code: 'WKS-04', title: 'Rekonsiliasi Sengketa Batas SLS & Penyelesaian Anomali Wilkerstat', arch: 'ill_structured_case', tier: 'evaluate', risk: 'critical', oClass: 'B' },
  ];

  const compMap = new Map<string, string>();
  for (const cDef of compsDef) {
    const [c] = await db.insert(competencies).values({
      workspaceId: activeWs.id,
      domainId: activeDomain?.id,
      sourceId: activeSource.id,
      code: cDef.code,
      title: cDef.title,
      description: `Penguasaan ${cDef.title} berpedoman pada BPS-SE2026-WKS-SOP.`,
      cognitiveArchetype: cDef.arch,
      oracleClass: cDef.oClass as any,
      riskLevel: cDef.risk as any,
      isExpertApproved: true,
    }).onConflictDoNothing().returning();
    const activeC = c || (await db.query.competencies.findFirst({ where: (cmp, { and, eq }) => and(eq(cmp.workspaceId, activeWs.id), eq(cmp.code, cDef.code)) }));
    if (activeC) compMap.set(cDef.code, activeC.id);
  }

  // Edges DAG (WKS-01 -> WKS-02 -> WKS-03 -> WKS-04)
  const c1 = compMap.get('WKS-01');
  const c2 = compMap.get('WKS-02');
  const c3 = compMap.get('WKS-03');
  const c4 = compMap.get('WKS-04');
  if (c1 && c2) await db.insert(competencyEdges).values({ competencyId: c2, prerequisiteId: c1 }).onConflictDoNothing();
  if (c2 && c3) await db.insert(competencyEdges).values({ competencyId: c3, prerequisiteId: c2 }).onConflictDoNothing();
  if (c3 && c4) await db.insert(competencyEdges).values({ competencyId: c4, prerequisiteId: c3 }).onConflictDoNothing();

  // 4. Progressive Authorization Gates
  const gatesDef = [
    { level: 0, title: 'Level 0 · Observasi Pemetaan Lapangan', comp: c1, human: false },
    { level: 1, title: 'Level 1 · Petugas Geotagging & Pencacah Mandiri', comp: c2, human: false },
    { level: 2, title: 'Level 2 · Verifikator Peta Spasial & Polygon SLS', comp: c3, human: false },
    { level: 3, title: 'Level 3 · Koordinator Sensus & Rekonsiliator Batas Wilkerstat', comp: c4, human: true },
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
      title: 'Identifikasi Status Wilayah: Pemisahan SLS Aktif dan Non-SLS Khusus',
      scenario: 'Di Desa Sungai Bakau Kecil ditemukan kawasan tambak garam terisolasi seluas 40 hektar tanpa pengurus RT/RW dengan 3 pekerja musiman. Tentukan klasifikasi wilayah dan kode identitas Wilkerstat sesuai SOP.',
      taskType: 'case_study',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        acceptable_verdicts: ['NON_SLS', 'KAWASAN_TAMBAK_TERISOLASI'],
        mandatory_citations: ['BPS-SE2026-WKS-SOP', 'Bagian 1'],
      },
      rubricCriteria: [
        { name: 'Ketepatan Penetapan Klasifikasi Non-SLS', weight: 50 },
        { name: 'Kesesuaian Kode Wilkerstat dengan Standar BPS', weight: 50 },
      ],
    }).onConflictDoNothing();
  }

  if (c2) {
    await db.insert(tasks).values({
      competencyId: c2,
      title: 'Validasi Akurasi Koordinat GPS Handheld Tempat Usaha (Kelas A)',
      scenario: 'Petugas mengambil titik geotagging pada ruko dengan nilai deviasi akurasi GPS terbaca 18.4 meter di bawah kanopi baja. Ambang batas maksimum toleransi BPS adalah 10 meter. Hitung deviasi kelebihan toleransi dan tentukan tindakan korektif.',
      taskType: 'calculation',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        formula: 'gpsAccuracy - maxToleranceMeters',
        variables: { gpsAccuracy: 18.4, maxToleranceMeters: 10, excessDeviation: 8.4 },
      },
      rubricCriteria: [
        { name: 'Ketepatan Kalkulasi Selisih Toleransi (8.4 meter)', weight: 60 },
        { name: 'Instruksi Retagging di Titik Terbuka', weight: 40 },
      ],
    }).onConflictDoNothing();

    // Isomorphic Variant B
    await db.insert(tasks).values({
      competencyId: c2,
      title: 'Validasi Presisi Titik Spasial Sentra Industri Pesisir (Varian B)',
      scenario: 'Pengukuran titik geotagging dermaga pelelangan ikan menunjukkan akurasi 14.5 meter saat cuaca mendung tebal. Hitung selisih deviasi terhadap batas 10 meter dan susun protokol verifikasi.',
      taskType: 'calculation',
      scenarioVariantCode: 'variant_b',
      isIsomorphicVariant: true,
      passingScore: 80,
      oracleData: {
        formula: 'gpsAccuracy - maxToleranceMeters',
        variables: { gpsAccuracy: 14.5, maxToleranceMeters: 10, excessDeviation: 4.5 },
      },
      rubricCriteria: [
        { name: 'Ketepatan Kalkulasi Selisih Toleransi (4.5 meter)', weight: 60 },
        { name: 'Penerapan Prosedur Kalibrasi Satelit GPS', weight: 40 },
      ],
    }).onConflictDoNothing();
  }

  if (c3) {
    await db.insert(tasks).values({
      competencyId: c3,
      title: 'Deteksi Anomali Geometri: Koreksi Overlap Polygon SLS pada Citra CSRT',
      scenario: 'Pemeriksaan peta digital Wilkerstat mendeteksi tumpang tindih polygon antara RT 04 dan RT 05 seluas 2.300 meter persegi mencakup 8 unit toko kelontong. Evaluasi solusi penataan batas berpedoman pada fitur jalan aspal pada citra CSRT.',
      taskType: 'case_study',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 80,
      oracleData: {
        acceptable_verdicts: ['DELINIASI_AS_JALAN', 'ELIMINASI_OVERLAP'],
        mandatory_citations: ['BPS-SE2026-WKS-SOP', 'Bagian 3'],
      },
      rubricCriteria: [
        { name: 'Identifikasi Akar Penyebab Tumpang Tindih Batas', weight: 50 },
        { name: 'Penerapan Deliniasi Mengikuti Tanda Fisik Alami/Jalan', weight: 50 },
      ],
    }).onConflictDoNothing();
  }

  if (c4) {
    await db.insert(tasks).values({
      competencyId: c4,
      title: 'Uji Stres Adversarial: Tekanan Klaim Sepihak Batas SLS oleh Tokoh Masyarakat',
      scenario: 'Ketua RW mendesak petugas Wilkerstat untuk menggeser batas wilayah SLS ke seberang parit utama agar pabrik pengolahan kopra masuk ke wilayahnya, dengan ancaman menolak menandatangani dokumen sensus. Bagaimana sikap dan disposisi Anda?',
      taskType: 'adversarial_dilemma',
      scenarioVariantCode: 'variant_a',
      isIsomorphicVariant: false,
      passingScore: 90,
      adversarialSpec: {
        trapType: 'PRESSURE_COMMUNITY',
        correctDisposition: 'REJECT_AND_DEMAND_DATA',
        trapCues: [
          { cue: 'Desakan dan ancaman penolakan tanda tangan ketua lingkungan', weight: 0.5 },
          { cue: 'Klaim sepihak yang melanggar tanda fisik parit utama', weight: 0.5 },
        ],
        statutoryPolicy: 'BPS-SE2026-WKS-SOP Bagian 4',
        vetoThreshold: 0.7,
      },
      oracleData: {
        acceptable_verdicts: ['TOLAK_PERGESERAN_SEPIHAK', 'REKONSILIASI_DENGAN_APARAT_DESA'],
        checklist: ['Penolakan perubahan batas sepihak', 'Penerbitan Berita Acara Rekonsiliasi Batas Lapangan'],
      },
      rubricCriteria: [
        { name: 'Keteguhan Menjaga Netralitas Batas Statistik', weight: 50 },
        { name: 'Langkah Mediasi Berita Acara Rekonsiliasi Desa', weight: 50 },
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
      front: 'Jika sebuah kawasan industri baru tidak dimasukkan ke dalam blok Non-SLS dan dibiarkan tanpa batas Wilkerstat yang jelas, apa akibatnya pada beban kerja pencacahan lapangan SE2026?',
      back: 'Terjadi undercoverage (unit usaha terlewat tidak tercacah) atau overcoverage (dua pencacah saling klaim mencacah unit yang sama).',
      predictionOptions: [
        'Terjadi undercoverage atau overcoverage ganda unit usaha sensus',
        'Sistem satelit otomatis mengunci koordinat GPS',
        'Peta digital berubah menjadi format raster',
      ],
      causalRationale: 'Kejelasan deliniasi batas SLS/Non-SLS adalah fondasi utama kepastian cakupan cacah Sensus Ekonomi.',
      category: 'causal_priming',
      repetitionIntervalDays: 1,
      easeFactor: 250,
      consecutiveCorrectAnswers: 0,
      nextReviewDue: new Date(),
    }).onConflictDoNothing();
  }

  console.log('✓ Pelatihan Wilkerstat SE2026 Domain Blueprint Seeded Successfully!');
}
