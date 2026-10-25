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
  await seedTasks(compMap);

  // 6. Educational Reading Modules & Active Recall Quizzes
  await seedEnterpriseContents(activeWs.id, compMap);

  console.log('✓ Enterprise Level Procurement Blueprint Seeded Successfully!');
}

async function seedTasks(compMap: Map<string, string>) {
  const comp01Id = compMap.get('PROC-ENT-01');
  if (comp01Id) {
    await db
      .insert(tasks)
      .values({
        competencyId: comp01Id,
        title: 'Klasifikasi Portofolio Belanja Berdasarkan Matriks Kraljic',
        scenario:
          'Sebagai Lead Strategic Sourcing, lakukan pemetaan kategori belanja korporat ke dalam 4 kuadran Matriks Kraljic (Routine, Leverage, Bottleneck, Strategic) sesuai SOP-CORP-PROC-2026-08 Pasal 2:\n1. Pembelian ATK dan consumable kantor standar.\n2. Biji plastik polimer custom dari pemasok tunggal untuk produk inti manufaktur.\n3. Suku cadang mesin lama impor dengan supplier tunggal dan nilai kecil.\n4. Layanan sewa armada logistik terstandardisasi dengan banyak alternatif vendor di pasar.',
        taskType: 'case_study',
        passingScore: 80,
        oracleData: {
          classification: { item1: 'Routine', item2: 'Strategic', item3: 'Bottleneck', item4: 'Leverage' },
          checklist: [
            'Mengidentifikasi ATK sebagai kuadran Routine dengan fokus simplifikasi proses & e-procurement',
            'Mengidentifikasi polimer custom sebagai kuadran Strategic dengan fokus kemitraan kolaboratif jangka panjang',
            'Mengidentifikasi suku cadang langka sebagai kuadran Bottleneck dengan fokus pengamanan pasokan & safety stock',
            'Mengidentifikasi armada logistik sebagai kuadran Leverage dengan fokus tender kompetitif & negosiasi harga',
          ],
        },
        rubricCriteria: [
          { name: 'Ketepatan Klasifikasi 4 Kuadran Kraljic', weight: 60 },
          { name: 'Pemilihan Strategi Pengadaan dan Pengendalian Risiko Pasokan', weight: 40 },
        ],
      })
      .onConflictDoNothing();
  }

  const comp02Id = compMap.get('PROC-ENT-02');
  if (comp02Id) {
    await db
      .insert(tasks)
      .values({
        competencyId: comp02Id,
        title: 'Kalkulasi Total Cost of Ownership (TCO) Pengadaan Server Cloud',
        scenario:
          'Perusahaan merencanakan pengadaan cluster server hybrid dengan harga beli pokok Rp 500.000.000, biaya implementasi & migrasi Rp 80.000.000, kontrak SLA tahunan Rp 40.000.000/tahun selama durasi 3 tahun, dan estimasi nilai sisa (residual value) sebesar Rp 50.000.000. Hitung nilai TCO komprehensif sebelum pajak, nilai PPN 11%, dan TCO final sesuai SOP-CORP-PROC-2026-08 Pasal 3.',
        taskType: 'calculation',
        passingScore: 80,
        oracleData: {
          formula: 'purchasePrice + implementationCost + (annualSla * contractYears) - residualValue',
          variables: {
            purchasePrice: 500000000,
            implementationCost: 80000000,
            annualSla: 40000000,
            contractYears: 3,
            residualValue: 50000000,
            expectedTcoPreTax: 650000000,
            expectedPpn: 71500000,
            expectedTcoFinal: 721500000,
          },
          checklist: [
            'Verifikasi biaya SLA 3 tahun (Rp 120.000.000)',
            'Pengurangan nilai sisa residual value (Rp 50.000.000)',
            'Kalkulasi PPN 11% atas TCO pokok (Rp 71.500.000)',
            'Batas margin overhead vendor <= 15%',
          ],
        },
        rubricCriteria: [
          { name: 'Akurasi Perhitungan TCO Bersih', weight: 60 },
          { name: 'Kepatuhan Komponen PPN & Biaya Siklus Hidup', weight: 40 },
        ],
      })
      .onConflictDoNothing();
  }

  const comp03Id = compMap.get('PROC-ENT-03');
  if (comp03Id) {
    await db
      .insert(tasks)
      .values({
        competencyId: comp03Id,
        title: 'Evaluasi Uji Tuntas Rekanan Tender Sistem ERP (Kasus Kelas B)',
        scenario:
          'Peserta tender PT Sinergi Solusi mengunggah berkas kualifikasi: NIB aktif, KSWP valid, laporan keuangan tahunan dengan Current Ratio 1.35, sertifikat ISO 9001 masih aktif, namun sertifikat ISO 27001 telah kedaluwarsa 14 hari sebelum batas akhir pendaftaran disertai surat pernyataan komitmen perpanjangan. Susun telaah hukum dan rekomendasi kelayakan.',
        taskType: 'case_study',
        passingScore: 85,
        oracleData: {
          acceptable_verdicts: ['GUGUR', 'TIDAK_LOLOS', 'DISKUALIFIKASI'],
          mandatory_citations: ['SOP-CORP-PROC-2026-08', 'Pasal 4'],
          gold_benchmark_rationale:
            'Berdasarkan SOP-CORP-PROC-2026-08 Pasal 4 ayat 2, pemenuhan sertifikasi standar keamanan data ISO 27001 adalah persyaratan mutlak yang wajib masih berlaku saat pembukaan penawaran. Surat pernyataan komitmen perpanjangan bukan merupakan dokumen pengganti sertifikat yang sah.',
          oracleConfig: {
            rolePersona: 'Ketua Komite Kepatuhan Legal & Auditor Keamanan Sistem Informasi',
            dos: [
              'Tegakkan aturan mutlak Pasal 4 ayat 2 bahwa sertifikat ISO 27001 wajib aktif saat pembukaan penawaran',
              'Tolak surat komitmen perpanjangan sebagai dokumen pengganti sertifikat sah',
              'Wajib menjatuhkan status GUGUR / DISKUALIFIKASI atas sertifikat kedaluwarsa',
            ],
            donts: [
              'Dilarang memberi toleransi perpanjangan sertifikat atau kelulusan bersyarat untuk modul ERP sensitif',
              'Dilarang meloloskan peserta semata-mata karena rasio likuiditas Current Ratio 1.35',
            ],
          },
          socraticConfig: {
            pedagogicalRole: 'Konsultan Tata Kelola Risiko & Penasihat Hukum Pengadaan',
            pedagogicalStyle: 'regulatory_socratic',
            dos: [
              'Arahkan peserta membaca SOP Pasal 4 mengenai konsekuensi yuridis sertifikat ISO yang habis masa berlakunya',
              'Tanyakan risiko hukum dan kebocoran data bagi korporasi jika sistem ERP dipegang vendor tanpa ISO 27001 aktif',
            ],
            donts: [
              'Dilarang membocorkan kata kunci putusan GUGUR atau DISKUALIFIKASI secara langsung',
              'Dilarang menyebutkan nama negative anchor trap secara eksplisit',
            ],
          },
        },
        rubricCriteria: [
          { name: 'Ketepatan Rekomendasi Putusan (Diskualifikasi)', weight: 50 },
          { name: 'Ketepatan Kutipan Dasar Aturan (Pasal 4 ayat 2)', weight: 30 },
          { name: 'Analisis Risiko Hukum & Keamanan Informasi', weight: 20 },
        ],
      })
      .onConflictDoNothing();
  }

  const comp04Id = compMap.get('PROC-ENT-04');
  if (comp04Id) {
    await db
      .insert(tasks)
      .values({
        competencyId: comp04Id,
        title: 'Audit Internal Pengendalian P2P: Deteksi Split PO & Anomali 3-Way Matching',
        scenario:
          'Ditemukan 3 berkas Purchase Order berturut-turut masing-masing bernilai Rp 48.000.000 kepada vendor CV Maju Perkasa untuk pengadaan suku cadang mesin pabrik dalam rentang waktu 5 hari kerja (total Rp 144.000.000). Batas wewenang pengadaan langsung tanpa tender adalah Rp 50.000.000. Dokumen BAST belum ditandatangani oleh Pengelola Gudang Independen namun faktur pembayaran telah diserahkan. Susun telaah audit forensik pengadaan.',
        taskType: 'case_study',
        passingScore: 85,
        oracleData: {
          acceptable_verdicts: ['PELANGGARAN', 'SPLIT_PO', 'FRAUD', 'PENOLAKAN_PEMBAYARAN'],
          mandatory_citations: ['SOP-CORP-PROC-2026-08', 'Pasal 6', 'Pasal 7'],
          gold_benchmark_rationale:
            'Tindakan memecah transaksi belanja modal sejenis menjadi 3 PO di bawah Rp 50.000.000 merupakan pelanggaran berat Anti-Split PO (Pasal 7) untuk menghindari mekanisme tender. Selain itu, pembayaran wajib ditahan karena melanggar prinsip Three-Way Matching (Pasal 6) di mana BAST belum ditandatangani oleh penerima fisik independen.',
        },
        rubricCriteria: [
          { name: 'Deteksi Pelanggaran Pemecahan Paket (Anti-Split PO)', weight: 40 },
          { name: 'Penegakan Prinsip Pengendalian Three-Way Matching', weight: 40 },
          { name: 'Rekomendasi Tindakan Korektif & Eskalasi Audit', weight: 20 },
        ],
      })
      .onConflictDoNothing();
  }

  const comp05Id = compMap.get('PROC-ENT-05');
  if (comp05Id) {
    await db
      .insert(tasks)
      .values({
        competencyId: comp05Id,
        title: 'Uji Stres Adversarial: Tekanan Anggaran Akhir Tahun vs Uji Tuntas Rekanan',
        scenario:
          'Pada tanggal 20 Desember 2026, Direktur Operasional meminta Anda selaku Procurement Officer untuk segera menandatangani PO pengadaan genset darurat senilai Rp 850.000.000 kepada PT Kilat Daya sebelum tanggal 23 Desember agar anggaran belanja CAPEX tidak hangus (lapsed). Saat diverifikasi cepat, laporan keuangan auditan PT Kilat Daya belum diserahkan dan PT Kilat Daya baru berdiri 2 bulan lalu. Direktur menyatakan akan bertanggung jawab penuh secara lisan atas pemilihan rekanan tersebut. Bagaimana tindakan profesional Anda?',
        taskType: 'adversarial_dilemma',
        passingScore: 90,
        oracleData: {
          acceptable_verdicts: ['TOLAK_PO', 'ESKALASI_KOMITE_AUDIT', 'TERBITKAN_NOTA_KEPATUHAN'],
          mandatory_citations: ['SOP-CORP-PROC-2026-08', 'Pasal 8'],
          gold_benchmark_rationale:
            'Berdasarkan SOP-CORP-PROC-2026-08 Pasal 8 ayat 1, risiko hangusnya anggaran tidak boleh dijadikan pembenaran untuk mengabaikan uji tuntas rekanan. Petugas pengadaan wajib menolak menerbitkan PO tanpa laporan keuangan auditan lengkap, menolak instruksi lisan tanpa dasar hukum, dan menerbitkan Nota Peringatan Kepatuhan resmi ke Komite Audit.',
        },
        rubricCriteria: [
          { name: 'Keteguhan Menolak Intervensi Non-Kepatuhan', weight: 40 },
          { name: 'Penerapan Dasar Hukum Regulasi SOP Pasal 8', weight: 30 },
          { name: 'Langkah Mitigasi: Nota Resmi & Eskalasi Komite Audit', weight: 30 },
        ],
      })
      .onConflictDoNothing();
  }
}
