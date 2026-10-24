import { db } from '../db';
import {
  workspaces,
  sources,
  sourceChunks,
  competencies,
  competencyEdges,
  gates,
  gateRequirements,
  tasks,
} from '../schema';
import { createHash } from 'crypto';

export async function seedProcurement(creatorId: string) {
  console.log('🏛️ Seeding Procurement (PBJ) Domain Blueprint...');

  // 1. Workspace
  const [ws] = await db
    .insert(workspaces)
    .values({
      name: 'Pengadaan Barang & Jasa Pemerintah (PBJ)',
      slug: 'pengadaan-barang-jasa-pemerintah',
      description: 'Blueprint Verifikasi Kompetensi & Paspor Wewenang Pengadaan Nasional berbasis Perpres 16/2018 jo 12/2021.',
      icon: '⚖️',
      isPublic: true,
      creatorId,
    })
    .onConflictDoNothing()
    .returning();

  const activeWs = ws || (await db.query.workspaces.findFirst({
    where: (w, { eq }) => eq(w.slug, 'pengadaan-barang-jasa-pemerintah'),
  }));

  if (!activeWs) return;

  // 2. Source & Chunks (Corpus of Record)
  const [source] = await db
    .insert(sources)
    .values({
      workspaceId: activeWs.id,
      code: 'PERPRES-16-2021',
      title: 'Peraturan Presiden No. 16/2018 jo No. 12/2021 tentang Pengadaan Barang/Jasa Pemerintah',
      version: 'v2.1',
      status: 'active',
      owner: 'LKPP RI',
      effectiveDate: new Date('2021-06-01'),
    })
    .onConflictDoNothing()
    .returning();

  const activeSource = source || (await db.query.sources.findFirst({
    where: (s, { eq }) => eq(s.code, 'PERPRES-16-2021'),
  }));

  if (activeSource) {
    const chunkHpsText = 'Penyusunan Harga Perkiraan Sendiri (HPS) memperhitungkan keuntungan dan biaya tidak langsung (overhead) paling tinggi 15%, serta Pajak Pertambahan Nilai (PPN) 11%.';
    const chunkHpsHash = createHash('sha256').update(chunkHpsText).digest('hex');

    const [chunkHps] = await db
      .insert(sourceChunks)
      .values({
        sourceId: activeSource.id,
        locationTag: 'Pasal 26 Ayat 3',
        content: chunkHpsText,
        sha256Hash: chunkHpsHash,
      })
      .onConflictDoNothing()
      .returning();

    // 3. Competencies DAG
    const comp1 = await db.insert(competencies).values({
      workspaceId: activeWs.id,
      sourceId: activeSource.id,
      code: 'PBJ-01',
      title: 'Landasan Regulasi & Etika Pengadaan',
      description: 'Penguasaan prinsip dasar efisien, efektif, transparan, terbuka, bersaing, adil, dan akuntabel sesuai Perpres.',
      oracleClass: 'A',
      riskLevel: 'low',
      isExpertApproved: true,
    }).onConflictDoNothing().returning();

    const comp2 = await db.insert(competencies).values({
      workspaceId: activeWs.id,
      sourceId: activeSource.id,
      code: 'PBJ-02',
      title: 'Penyusunan HPS & Analisis Kewajaran Harga',
      description: 'Kemampuan menyusun HPS deterministik sesuai batasan laba 15% dan PPN 11% dengan bukti survei pasar.',
      oracleClass: 'A',
      riskLevel: 'medium',
      isExpertApproved: true,
    }).onConflictDoNothing().returning();

    const comp3 = await db.insert(competencies).values({
      workspaceId: activeWs.id,
      sourceId: activeSource.id,
      code: 'PBJ-03',
      title: 'Evaluasi Dokumen Teknis & Deteksi Anomali',
      description: 'Pemeriksaan kepatuhan spesifikasi teknis, sertifikasi standar (ISO/TKDN), dan deteksi jebakan dokumen cacat hukum.',
      oracleClass: 'B',
      riskLevel: 'high',
      isExpertApproved: true,
    }).onConflictDoNothing().returning();

    const comp4 = await db.insert(competencies).values({
      workspaceId: activeWs.id,
      sourceId: activeSource.id,
      code: 'PBJ-04',
      title: 'Penanganan Sanggahan & Putusan Sengketa Tender',
      description: 'Penyusunan nota dinas jawaban sanggah dan mitigasi risiko gugatan hukum PTUN dengan justifikasi pakar.',
      oracleClass: 'C',
      riskLevel: 'high',
      isExpertApproved: true,
    }).onConflictDoNothing().returning();

    // Fetch existing if already inserted
    const c1 = comp1[0] || (await db.query.competencies.findFirst({ where: (c, { eq }) => eq(c.code, 'PBJ-01') }));
    const c2 = comp2[0] || (await db.query.competencies.findFirst({ where: (c, { eq }) => eq(c.code, 'PBJ-02') }));
    const c3 = comp3[0] || (await db.query.competencies.findFirst({ where: (c, { eq }) => eq(c.code, 'PBJ-03') }));
    const c4 = comp4[0] || (await db.query.competencies.findFirst({ where: (c, { eq }) => eq(c.code, 'PBJ-04') }));

    // Prerequisites DAG (PBJ-01 -> PBJ-02 -> PBJ-03 -> PBJ-04)
    if (c1 && c2) await db.insert(competencyEdges).values({ competencyId: c2.id, prerequisiteId: c1.id }).onConflictDoNothing();
    if (c2 && c3) await db.insert(competencyEdges).values({ competencyId: c3.id, prerequisiteId: c2.id }).onConflictDoNothing();
    if (c3 && c4) await db.insert(competencyEdges).values({ competencyId: c4.id, prerequisiteId: c3.id }).onConflictDoNothing();

    // 4. Progressive Authorization Gates
    const [g0] = await db.insert(gates).values({
      workspaceId: activeWs.id,
      level: 0,
      title: 'Level 0 · Observasi Pengadaan',
      description: 'Izin mendampingi rapat dan meninjau berkas di bawah pengawasan penuh tanpa wewenang tanda tangan.',
    }).onConflictDoNothing().returning();

    const [g1] = await db.insert(gates).values({
      workspaceId: activeWs.id,
      level: 1,
      title: 'Level 1 · Tim Pendukung Teknis',
      description: 'Izin menyusun draf HPS dan spesifikasi teknis dengan telaah berlapis oleh Pejabat Pembuat Komitmen (PPK).',
    }).onConflictDoNothing().returning();

    const [g2] = await db.insert(gates).values({
      workspaceId: activeWs.id,
      level: 2,
      title: 'Level 2 · Pejabat Pengadaan Mandiri',
      description: 'Wewenang penuh melaksanakan pengadaan langsung dan tender cepat dengan pagu risiko rendah hingga Rp 200 Juta.',
    }).onConflictDoNothing().returning();

    const [g3] = await db.insert(gates).values({
      workspaceId: activeWs.id,
      level: 3,
      title: 'Level 3 · Pokja Pemilihan Tender Risiko Tinggi',
      description: 'Wewenang mengeksekusi tender bernilai tinggi, tender internasional, dan memutus sanggahan secara definitif.',
    }).onConflictDoNothing().returning();

    // Gate Requirements
    const gate0 = g0 || (await db.query.gates.findFirst({ where: (g, { and, eq }) => and(eq(g.workspaceId, activeWs.id), eq(g.level, 0)) }));
    const gate1 = g1 || (await db.query.gates.findFirst({ where: (g, { and, eq }) => and(eq(g.workspaceId, activeWs.id), eq(g.level, 1)) }));
    const gate2 = g2 || (await db.query.gates.findFirst({ where: (g, { and, eq }) => and(eq(g.workspaceId, activeWs.id), eq(g.level, 2)) }));
    const gate3 = g3 || (await db.query.gates.findFirst({ where: (g, { and, eq }) => and(eq(g.workspaceId, activeWs.id), eq(g.level, 3)) }));

    if (gate0 && c1) await db.insert(gateRequirements).values({ gateId: gate0.id, competencyId: c1.id, minimumScore: 80, requiresHumanApproval: false }).onConflictDoNothing();
    if (gate1 && c2) await db.insert(gateRequirements).values({ gateId: gate1.id, competencyId: c2.id, minimumScore: 80, requiresHumanApproval: false }).onConflictDoNothing();
    if (gate2 && c3) await db.insert(gateRequirements).values({ gateId: gate2.id, competencyId: c3.id, minimumScore: 80, requiresHumanApproval: false }).onConflictDoNothing();
    if (gate3 && c4) await db.insert(gateRequirements).values({ gateId: gate3.id, competencyId: c4.id, minimumScore: 85, requiresHumanApproval: true }).onConflictDoNothing();

    // 5. Tasks (Class A, B, C)
    if (c2) {
      await db.insert(tasks).values({
        competencyId: c2.id,
        title: 'Kalkulasi HPS Pengadaan Perangkat Komputer (Kelas A)',
        scenario: 'Hitung HPS resmi berdasarkan harga survei pasar dengan margin overhead/keuntungan maksimal 15% dan PPN 11%.',
        taskType: 'calculation',
        passingScore: 80,
        oracleData: {
          formula: 'basePrice * (1 + overheadPercent/100) * 1.11',
          variables: { basePrice: 100000000, overheadPercent: 15 },
          checklist: ['survei_pasar_minimal_3_sumber', 'perhitungan_ppn_11_persen', 'overhead_maks_15_persen'],
        },
        rubricCriteria: [
          { name: 'Kebenaran Nilai Total HPS', weight: 60 },
          { name: 'Kepatuhan Checklist Regulasi', weight: 40 },
        ],
      }).onConflictDoNothing();
    }

    if (c3) {
      await db.insert(tasks).values({
        competencyId: c3.id,
        title: 'Evaluasi Kualifikasi Teknis Tender Infrastruktur Cloud (Kelas B)',
        scenario: 'Evaluasi dokumen peserta PT Mega Cloud yang bersertifikat ISO 27001 kedaluwarsa dengan janji komitmen.',
        taskType: 'case_study',
        passingScore: 75,
        oracleData: {
          goldSolution: 'Peserta wajib dinyatakan GUGUR teknis. Surat komitmen perpanjangan bukan sertifikat sah pada saat pembukaan penawaran.',
          rubricMatrix: [
            { criterion: 'Ketegasan status kelulusan (Wajib Gugur)', weight: 40 },
            { criterion: 'Rujukan regulasi keabsahan dokumen saat pembukaan', weight: 30 },
            { criterion: 'Analisis risiko audit BPK / potensi sanggah rekanan lain', weight: 30 },
          ],
          negativeAnchors: [
            'meluluskan dengan syarat',
            'memberikan masa tenggang perpanjangan sertifikat',
            'mengabaikan masa kedaluwarsa karena komitmen',
          ],
        },
        rubricCriteria: [
          { name: 'Ketegasan Evaluasi Teknis', weight: 40 },
          { name: 'Rujukan Regulasi Perpres', weight: 30 },
          { name: 'Mitigasi Risiko Audit', weight: 30 },
        ],
      }).onConflictDoNothing();
    }

    if (c4) {
      await db.insert(tasks).values({
        competencyId: c4.id,
        title: 'Sidang Putusan Sanggah Kasus Tender Pembangunan Gedung (Kelas C)',
        scenario: 'Rancang jawaban nota dinas atas sanggahan rekanan yang menuduh Pokja memasang spesifikasi diskriminatif.',
        taskType: 'case_study',
        passingScore: 85,
        oracleData: {
          expertReviewRequired: true,
        },
        rubricCriteria: [
          { id: 'crit_legal', name: 'Landasan Hukum & Kesesuaian Pasal Perpres', maxScore: 35 },
          { id: 'crit_procedural', name: 'Integritas Bukti Berita Acara Rapat Evaluasi', maxScore: 35 },
          { id: 'crit_audit_defense', name: 'Ketahanan Argumen terhadap Audit Inspektorat', maxScore: 30 },
        ],
      }).onConflictDoNothing();
    }
  }

  console.log('✓ Procurement (PBJ) Domain Blueprint Seeded Successfully!');
}
