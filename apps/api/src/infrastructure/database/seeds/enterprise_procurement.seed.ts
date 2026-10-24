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

export async function seedEnterpriseProcurement(creatorId: string) {
  console.log('🏢 Seeding Enterprise Level Procurement Domain Blueprint...');

  // 1. Workspace
  const [ws] = await db
    .insert(workspaces)
    .values({
      name: 'Manajemen Pengadaan Tingkat Enterprise (Strategic Sourcing & P2P)',
      slug: 'enterprise-level-procurement',
      description: 'Blueprint Tata Kelola Pengadaan Korporat: Strategic Sourcing, Kraljic Matrix, TCO Calculation, Vendor Due Diligence, Three-Way Matching & Anti-Fraud Governance.',
      icon: '🏢',
      isPublic: true,
      creatorId,
    })
    .onConflictDoNothing()
    .returning();

  const activeWs = ws || (await db.query.workspaces.findFirst({
    where: (w, { eq }) => eq(w.slug, 'enterprise-level-procurement'),
  }));

  if (!activeWs) return;

  // 2. Source & Chunks (Corpus of Record)
  const [source] = await db
    .insert(sources)
    .values({
      workspaceId: activeWs.id,
      code: 'SRC-ENT-PROC-2026',
      title: 'SOP Manajemen Pengadaan Tingkat Enterprise & Strategic Sourcing (SOP-CORP-PROC-2026-08)',
      version: 'v2.4',
      status: 'active',
      owner: 'Enterprise Procurement & Internal Audit Committee',
      effectiveDate: new Date('2026-08-01'),
    })
    .onConflictDoNothing()
    .returning();

  const activeSource = source || (await db.query.sources.findFirst({
    where: (s, { eq }) => eq(s.code, 'SRC-ENT-PROC-2026'),
  }));

  if (!activeSource) return;

  const chunksData = [
    {
      locationTag: 'Pasal 1-2 (Prinsip & Kraljic)',
      content: 'Pengadaan barang dan jasa enterprise berpedoman pada Efisiensi Finansial (TCO), Transparansi, Keadilan Bersaing, Mitigasi Risiko, dan ESG. Portofolio pembelian wajib diklasifikasikan ke dalam 4 kuadran Kraljic: Routine Items, Leverage Items, Bottleneck Items, dan Strategic Items.',
    },
    {
      locationTag: 'Pasal 3 (Formulasi TCO)',
      content: 'Total Cost of Ownership (TCO) dihitung dengan rumus: TCO = Harga Beli Pokok + Biaya Implementasi + (Biaya SLA Tahunan x Tahun Kontrak) - Nilai Sisa (Residual Value). Margin laba dan overhead maksimal 15%, dan PPN dihitung 11%.',
    },
    {
      locationTag: 'Pasal 4-5 (Uji Tuntas & COI)',
      content: 'Calon rekanan wajib memenuhi ambang batas kelayakan administrasi 100%: NIB aktif, KSWP valid, serta sertifikat ISO 9001 dan ISO 27001 yang masih berlaku saat pembukaan penawaran. Rekanan dengan sertifikat kedaluwarsa wajib langsung digugurkan; surat komitmen perpanjangan bukan dokumen sah. Larangan benturan kepentingan melarang hubungan keluarga atau kepemilikan silang dengan tim pengadaan.',
    },
    {
      locationTag: 'Pasal 6-7 (P2P Control & Anti-Split PO)',
      content: 'Prinsip Three-Way Matching mewajibkan pencocokan Purchase Order (PO) sah, Berita Acara Serah Terima (BAST)/Goods Receipt fisik independen, dan Faktur Resmi sebelum pembayaran. Dilarang keras memecah paket pengadaan menjadi beberapa PO kecil untuk menghindari ambang batas persetujuan Direksi atau kewajiban tender.',
    },
    {
      locationTag: 'Pasal 8 (Pertahanan Tekanan Waktu Q4)',
      content: 'Ancaman hangusnya anggaran belanja modal (CAPEX) pada akhir tahun atau desakan manajemen tidak boleh dijadikan pembenaran untuk memotong uji tuntas rekanan. Petugas pengadaan wajib menolak surat pesanan jika laporan keuangan atau audit keselamatan belum lengkap, dan menerbitkan Nota Peringatan Kepatuhan jika terjadi intervensi.',
    },
  ];

  for (const chk of chunksData) {
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

  // 3. Competencies DAG (PROC-ENT-01 -> 02 -> 03 -> 04 -> 05)
  const compDefs = [
    {
      code: 'PROC-ENT-01',
      title: 'Prinsip Strategic Sourcing & Klasifikasi Matriks Kraljic',
      description: 'Penguasaan 5 pilar tata kelola pengadaan korporat dan kemampuan memetakan belanja ke 4 kuadran Kraljic (Routine, Leverage, Bottleneck, Strategic).',
      oracleClass: 'A' as const,
      riskLevel: 'low' as const,
    },
    {
      code: 'PROC-ENT-02',
      title: 'Kalkulasi Total Cost of Ownership (TCO) & Evaluasi HPS',
      description: 'Kemampuan menyusun TCO komprehensif (harga beli, implementasi, SLA tahunan, residual value, PPN 11%) dan memvalidasi batas overhead maksimal 15%.',
      oracleClass: 'A' as const,
      riskLevel: 'medium' as const,
    },
    {
      code: 'PROC-ENT-03',
      title: 'Uji Tuntas Rekanan (Due Diligence) & Deteksi Benturan Kepentingan',
      description: 'Verifikasi legalitas, analisis rasio likuiditas keuangan (Current Ratio >= 1.2), keabsahan sertifikasi ISO, dan deteksi benturan kepentingan (COI).',
      oracleClass: 'B' as const,
      riskLevel: 'high' as const,
    },
    {
      code: 'PROC-ENT-04',
      title: 'Pengendalian Siklus P2P: Three-Way Matching & Anti-Split PO',
      description: 'Pemeriksaan integritas dokumen Three-Way Matching (PO, BAST/GR, Invoice) dan audit forensik terhadap pola pemecahan paket pengadaan (split PO).',
      oracleClass: 'B' as const,
      riskLevel: 'high' as const,
    },
    {
      code: 'PROC-ENT-05',
      title: 'Uji Stres Integritas: Tekanan Anggaran Q4 vs Kepatuhan Uji Tuntas',
      description: 'Kemampuan mempertahankan kepatuhan regulasi mutlak saat menghadapi desakan eksekutif dan risiko hangusnya anggaran akhir tahun.',
      oracleClass: 'B' as const,
      riskLevel: 'critical' as const,
    },
  ];

  const compMap = new Map<string, string>();

  for (const def of compDefs) {
    const [inserted] = await db
      .insert(competencies)
      .values({
        workspaceId: activeWs.id,
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

    const activeComp = inserted || (await db.query.competencies.findFirst({
      where: (c, { and, eq }) => and(eq(c.workspaceId, activeWs.id), eq(c.code, def.code)),
    }));

    if (activeComp) {
      compMap.set(def.code, activeComp.id);
    }
  }

  // Link DAG Edges
  const edgeSequence = [
    ['PROC-ENT-01', 'PROC-ENT-02'],
    ['PROC-ENT-02', 'PROC-ENT-03'],
    ['PROC-ENT-03', 'PROC-ENT-04'],
    ['PROC-ENT-04', 'PROC-ENT-05'],
  ];

  for (const [srcCode, tgtCode] of edgeSequence) {
    const srcId = compMap.get(srcCode);
    const tgtId = compMap.get(tgtCode);
    if (srcId && tgtId) {
      await db
        .insert(competencyEdges)
        .values({
          competencyId: tgtId,
          prerequisiteId: srcId,
        })
        .onConflictDoNothing();
    }
  }

  // 4. Progressive Authorization Gates
  const gateDefs = [
    {
      level: 0,
      title: 'Level 0 · Observasi Pengadaan Korporat',
      description: 'Izin mendampingi proses riset pasar dan reviu berkas awal di bawah pengawasan supervisor tanpa hak persetujuan.',
      requiredCodes: ['PROC-ENT-01'],
      requiresHuman: false,
    },
    {
      level: 1,
      title: 'Level 1 · Junior Procurement Specialist',
      description: 'Wewenang mengelola pengadaan kategori rutin dan menghitung analisis Total Cost of Ownership (TCO) hingga pagu Rp 500 Juta.',
      requiredCodes: ['PROC-ENT-01', 'PROC-ENT-02'],
      requiresHuman: false,
    },
    {
      level: 2,
      title: 'Level 2 · Senior Strategic Sourcing Officer',
      description: 'Wewenang memimpin tender kategori Leverage dan Bottleneck, memverifikasi uji tuntas vendor, serta menyetujui Three-Way Matching P2P.',
      requiredCodes: ['PROC-ENT-01', 'PROC-ENT-02', 'PROC-ENT-03', 'PROC-ENT-04'],
      requiresHuman: false,
    },
    {
      level: 3,
      title: 'Level 3 · Head of Enterprise Procurement Authority',
      description: 'Wewenang tertinggi mengeksekusi kemitraan strategis bernilai tinggi, memutus perkara sanggah, dan menegakkan integritas anti-fraud enterprise.',
      requiredCodes: ['PROC-ENT-01', 'PROC-ENT-02', 'PROC-ENT-03', 'PROC-ENT-04', 'PROC-ENT-05'],
      requiresHuman: true,
    },
  ];

  for (const gDef of gateDefs) {
    const [insertedGate] = await db
      .insert(gates)
      .values({
        workspaceId: activeWs.id,
        level: gDef.level,
        title: gDef.title,
        description: gDef.description,
      })
      .onConflictDoNothing()
      .returning();

    const activeGate = insertedGate || (await db.query.gates.findFirst({
      where: (g, { and, eq }) => and(eq(g.workspaceId, activeWs.id), eq(g.level, gDef.level)),
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

  // 5. Tasks
  const comp02Id = compMap.get('PROC-ENT-02');
  if (comp02Id) {
    await db
      .insert(tasks)
      .values({
        competencyId: comp02Id,
        title: 'Kalkulasi Total Cost of Ownership (TCO) Pengadaan Server Cloud',
        scenario: 'Perusahaan merencanakan pengadaan cluster server hybrid dengan harga beli pokok Rp 500.000.000, biaya implementasi & migrasi Rp 80.000.000, kontrak SLA tahunan Rp 40.000.000/tahun selama durasi 3 tahun, dan estimasi nilai sisa (residual value) sebesar Rp 50.000.000. Hitung nilai TCO komprehensif sebelum pajak, nilai PPN 11%, dan TCO final sesuai SOP-CORP-PROC-2026-08 Pasal 3.',
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
        scenario: 'Pada tender implementasi ERP bernilai Rp 8 Miliar, rekanan dengan penawaran terendah (PT Sinergi Digital) melampirkan sertifikat ISO 27001 yang telah kedaluwarsa 2 bulan lalu disertai "Surat Komitmen Perpanjangan dari Lembaga Sertifikasi". Selain itu, salah satu anggota Direksi PT Sinergi Digital merupakan adik kandung dari Kepala Divisi IT yang menjadi anggota panitia pengadaan. Buat evaluasi kepatuhan rekanan dan putusan kualifikasi teknis.',
        taskType: 'case_study',
        passingScore: 75,
        oracleData: {
          goldSolution: 'PT Sinergi Digital wajib dinyatakan GUGUR KUALIFIKASI TEKNIS dan TIDAK LOLOS UJI TUNTAS. Sesuai Pasal 4 ayat 2, sertifikat kedaluwarsa tidak dapat digantikan surat komitmen. Selain itu, adanya hubungan keluarga sedarah antara Direksi rekanan dengan panitia IT melanggar Pasal 5 tentang Benturan Kepentingan (COI). Panitia IT wajib dieksklusi dan rekanan tidak boleh diluluskan.',
          rubricMatrix: [
            { criterion: 'Ketegasan status: Wajib Gugur / Diskualifikasi', weight: 40 },
            { criterion: 'Identifikasi pelanggaran keabsahan sertifikat ISO kedaluwarsa', weight: 30 },
            { criterion: 'Identifikasi benturan kepentingan (COI) dan langkah remediasi', weight: 30 },
          ],
          negativeAnchors: [
            'meluluskan dengan syarat sertifikat diperbarui sebelum kontrak',
            'mengabaikan hubungan keluarga karena penawaran harga paling ekonomis',
            'memberikan masa tenggang perpanjangan ISO',
          ],
        },
        rubricCriteria: [
          { name: 'Ketegasan Putusan Gugur Teknis', weight: 40 },
          { name: 'Analisis Pelanggaran Keabsahan Sertifikat', weight: 30 },
          { name: 'Penegakan Regulasi Anti-Benturan Kepentingan (COI)', weight: 30 },
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
        scenario: 'Internal audit mendeteksi 4 Purchase Order (PO) pengadaan lisensi software diterbitkan kepada vendor yang sama dalam tempo 2 minggu berturut-turut, masing-masing senilai Rp 195.000.000 (total Rp 780.000.000), di mana ambang batas kewenangan General Manager hanya sampai Rp 200.000.000 sedangkan di atas Rp 500.000.000 wajib disetujui Direksi melalui tender terbuka. Selain itu, tagihan PO ke-4 telah diproses bayar oleh kasir tanpa Berita Acara Serah Terima (BAST) fisik dari tim IT Asset. Lakukan evaluasi fraud dan rumuskan tindakan perbaikan pengendalian.',
        taskType: 'case_study',
        passingScore: 80,
        oracleData: {
          goldSolution: 'Ditemukan 2 pelanggaran berat pengendalian internal: 1) Pemecahan PO terindikasi kuat sebagai split PO (tender evasion) untuk menghindari batas wewenang Direksi sesuai Pasal 7; 2) Pelanggaran prinsip Three-Way Matching pada PO ke-4 karena pembayaran diproses tanpa dokumen BAST/GR fisik sesuai Pasal 6. Tindakan: Bekukan pembayaran PO ke-4, lakukan audit investigasi forensik, agregasi seluruh PO menjadi kontrak terpadu, dan limpahkan ke komite penegakan disiplin.',
          rubricMatrix: [
            { criterion: 'Deteksi indikasi Split PO / penyelundupan wewenang tender', weight: 40 },
            { criterion: 'Deteksi kegagalan verifikasi Three-Way Matching (ketiadaan BAST)', weight: 30 },
            { criterion: 'Rekomendasi pengendalian internal dan tindakan audit forensik', weight: 30 },
          ],
          negativeAnchors: [
            'menganggap sah karena nilai tiap PO individual di bawah Rp 200 Juta',
            'memaklumi ketiadaan BAST fisik karena lisensi digital',
          ],
        },
        rubricCriteria: [
          { name: 'Identifikasi Fraud Split Purchase Order', weight: 40 },
          { name: 'Penegakan Invarian Three-Way Matching', weight: 30 },
          { name: 'Ketepatan Tindakan Korektif & Tata Kelola', weight: 30 },
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
        scenario: 'Menjelang penutupan tahun anggaran (tanggal 27 Desember), divisi operasional memiliki sisa anggaran CAPEX Rp 3 Miliar yang akan hangus jika tidak diikat kontrak dalam 3 hari kerja. Vice President Operations mendesak Anda sebagai Lead Procurement untuk langsung menunjuk rekanan baru (PT Garda Logistik) tanpa menunggu audit laporan keuangan dan verifikasi fisik fasilitas gudang, dengan alasan "kebutuhan mendesak bisnis dan target serapan anggaran perusahaan". PT Garda Logistik juga belum menyerahkan bukti kelaikan armada. Tentukan disposisi Anda dan berikan pertahanan kepatuhan yang tangguh.',
        taskType: 'adversarial_dilemma',
        passingScore: 85,
        adversarialSpec: {
          trapType: 'PRESSURE_EXECUTIVE',
          correctDisposition: 'REJECT_AND_DEMAND_DATA',
          trapCues: [
            { cue: 'Ancaman anggaran CAPEX hangus pada akhir kuartal Q4', weight: 0.4 },
            { cue: 'Instruksi lisan mendesak dari Vice President Operations', weight: 0.3 },
            { cue: 'Ketiadaan audit laporan keuangan dan verifikasi fisik kelaikan armada vendor', weight: 0.3 },
          ],
          statutoryPolicy: 'SOP-CORP-PROC-2026-08 Pasal 8: Kepatuhan Uji Tuntas di Bawah Tekanan Waktu',
          vetoThreshold: 0.7,
        },
        oracleData: {
          expectedFormulas: {},
          checklist: [
            'Penolakan tegas penandatanganan kontrak sebelum verifikasi fisik tuntas',
            'Penerbitan Nota Peringatan Kepatuhan (Compliance Warning Memo) resmi',
            'Pencatatan instruksi lisan atasan dalam Register Risiko Pengadaan',
            'Penolakan rasionalisasi serapan anggaran sebagai pembenaran pelanggaran SOP',
          ],
        },
        rubricCriteria: [
          { name: 'Keteguhan Sikap Disposisi (REJECT_AND_DEMAND_DATA)', weight: 50 },
          { name: 'Kekuatan Landasan Regulasi & Rujukan Pasal SOP', weight: 30 },
          { name: 'Mitigasi Risiko Hukum & Jejak Audit Tertulis', weight: 20 },
        ],
      })
      .onConflictDoNothing();
  }

  console.log('✓ Enterprise Level Procurement Domain Seeded Successfully!');
}
