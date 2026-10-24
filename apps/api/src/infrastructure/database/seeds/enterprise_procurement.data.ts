export const ENTERPRISE_WORKSPACE = {
  name: 'Manajemen Pengadaan Tingkat Enterprise (Strategic Sourcing & P2P)',
  slug: 'enterprise-level-procurement',
  description:
    'Blueprint Tata Kelola Pengadaan Korporat: Strategic Sourcing, Kraljic Matrix, TCO Calculation, Vendor Due Diligence, Three-Way Matching & Anti-Fraud Governance.',
  icon: '🏢',
  isPublic: true,
};

export const ENTERPRISE_SOURCE = {
  code: 'SRC-ENT-PROC-2026',
  title: 'SOP Manajemen Pengadaan Tingkat Enterprise & Strategic Sourcing (SOP-CORP-PROC-2026-08)',
  version: 'v2.4',
  status: 'active',
  owner: 'Enterprise Procurement & Internal Audit Committee',
  effectiveDate: new Date('2026-08-01'),
};

export const ENTERPRISE_CHUNKS = [
  {
    locationTag: 'Pasal 1-2 (Prinsip & Kraljic)',
    content:
      'Pengadaan barang dan jasa enterprise berpedoman pada Efisiensi Finansial (TCO), Transparansi, Keadilan Bersaing, Mitigasi Risiko, dan ESG. Portofolio pembelian wajib diklasifikasikan ke dalam 4 kuadran Kraljic: Routine Items, Leverage Items, Bottleneck Items, dan Strategic Items.',
  },
  {
    locationTag: 'Pasal 3 (Formulasi TCO)',
    content:
      'Total Cost of Ownership (TCO) dihitung dengan rumus: TCO = Harga Beli Pokok + Biaya Implementasi + (Biaya SLA Tahunan x Tahun Kontrak) - Nilai Sisa (Residual Value). Margin laba dan overhead maksimal 15%, dan PPN dihitung 11%.',
  },
  {
    locationTag: 'Pasal 4-5 (Uji Tuntas & COI)',
    content:
      'Calon rekanan wajib memenuhi ambang batas kelayakan administrasi 100%: NIB aktif, KSWP valid, serta sertifikat ISO 9001 dan ISO 27001 yang masih berlaku saat pembukaan penawaran. Rekanan dengan sertifikat kedaluwarsa wajib langsung digugurkan; surat komitmen perpanjangan bukan dokumen sah. Larangan benturan kepentingan melarang hubungan keluarga atau kepemilikan silang dengan tim pengadaan.',
  },
  {
    locationTag: 'Pasal 6-7 (P2P Control & Anti-Split PO)',
    content:
      'Prinsip Three-Way Matching mewajibkan pencocokan Purchase Order (PO) sah, Berita Acara Serah Terima (BAST)/Goods Receipt fisik independen, dan Faktur Resmi sebelum pembayaran. Dilarang keras memecah paket pengadaan menjadi beberapa PO kecil untuk menghindari ambang batas persetujuan Direksi atau kewajiban tender.',
  },
  {
    locationTag: 'Pasal 8 (Pertahanan Tekanan Waktu Q4)',
    content:
      'Ancaman hangusnya anggaran belanja modal (CAPEX) pada akhir tahun atau desakan manajemen tidak boleh dijadikan pembenaran untuk memotong uji tuntas rekanan. Petugas pengadaan wajib menolak surat pesanan jika laporan keuangan atau audit keselamatan belum lengkap, dan menerbitkan Nota Peringatan Kepatuhan jika terjadi intervensi.',
  },
];

export const ENTERPRISE_COMPETENCIES = [
  {
    code: 'PROC-ENT-01',
    title: 'Prinsip Strategic Sourcing & Klasifikasi Matriks Kraljic',
    description:
      'Penguasaan 5 pilar tata kelola pengadaan korporat dan kemampuan memetakan belanja ke 4 kuadran Kraljic (Routine, Leverage, Bottleneck, Strategic).',
    oracleClass: 'A' as const,
    riskLevel: 'low' as const,
  },
  {
    code: 'PROC-ENT-02',
    title: 'Kalkulasi Total Cost of Ownership (TCO) & Evaluasi HPS',
    description:
      'Kemampuan menyusun TCO komprehensif (harga beli, implementasi, SLA tahunan, residual value, PPN 11%) dan memvalidasi batas overhead maksimal 15%.',
    oracleClass: 'A' as const,
    riskLevel: 'medium' as const,
  },
  {
    code: 'PROC-ENT-03',
    title: 'Uji Tuntas Rekanan (Due Diligence) & Deteksi Benturan Kepentingan',
    description:
      'Verifikasi legalitas, analisis rasio likuiditas keuangan (Current Ratio >= 1.2), keabsahan sertifikasi ISO, dan deteksi benturan kepentingan (COI).',
    oracleClass: 'B' as const,
    riskLevel: 'high' as const,
  },
  {
    code: 'PROC-ENT-04',
    title: 'Pengendalian Siklus P2P: Three-Way Matching & Anti-Split PO',
    description:
      'Pemeriksaan integritas dokumen Three-Way Matching (PO, BAST/GR, Invoice) dan audit forensik terhadap pola pemecahan paket pengadaan (split PO).',
    oracleClass: 'B' as const,
    riskLevel: 'high' as const,
  },
  {
    code: 'PROC-ENT-05',
    title: 'Uji Stres Integritas: Tekanan Anggaran Q4 vs Kepatuhan Uji Tuntas',
    description:
      'Kemampuan mempertahankan kepatuhan regulasi mutlak saat menghadapi desakan eksekutif dan risiko hangusnya anggaran akhir tahun.',
    oracleClass: 'B' as const,
    riskLevel: 'critical' as const,
  },
];

export const ENTERPRISE_EDGES = [
  { from: 'PROC-ENT-01', to: 'PROC-ENT-02' },
  { from: 'PROC-ENT-02', to: 'PROC-ENT-03' },
  { from: 'PROC-ENT-03', to: 'PROC-ENT-04' },
  { from: 'PROC-ENT-04', to: 'PROC-ENT-05' },
];

export const ENTERPRISE_GATES = [
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
