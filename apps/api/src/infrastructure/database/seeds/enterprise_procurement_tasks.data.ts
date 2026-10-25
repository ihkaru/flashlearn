import { db } from '../db';
import { tasks } from '../schema';

export async function seedEnterpriseTasks(compMap: Map<string, string>) {
  const comp01Id = compMap.get('PROC-ENT-01');
  if (comp01Id) {
    await db
      .insert(tasks)
      .values({
        competencyId: comp01Id,
        title: 'Klasifikasi Portofolio Belanja Fasilitas & Rantai Pasok Berdasarkan Matriks Kraljic',
        scenario:
          'Sebagai Lead Strategic Sourcing, lakukan pemetaan kategori portofolio belanja korporat ke dalam 4 kuadran Matriks Kraljic (Routine, Leverage, Bottleneck, Strategic) sesuai SOP-CORP-PROC-2026-08 Pasal 2:\n1. Jasa kebersihan (cleaning service) & pest control gedung operasional standar dengan puluhan vendor lokal.\n2. Baja lembaran cold-rolled custom dari pemasok utama untuk struktur rangka produk otomotif inti.\n3. Reagen kimia analisis laboratorium bersertifikasi KAN dari importir tunggal dengan nilai belanja kecil tahunan.\n4. Karton kemasan box berstandar SNI dengan 15 alternatif pabrik lokal siap pasok volume besar.',
        taskType: 'case_study',
        passingScore: 80,
        oracleData: {
          classification: { item1: 'Routine', item2: 'Strategic', item3: 'Bottleneck', item4: 'Leverage' },
          checklist: [
            'Mengidentifikasi cleaning service sebagai kuadran Routine (simplifikasi administrasi & kontrak e-katalog)',
            'Mengidentifikasi baja lembaran custom sebagai kuadran Strategic (kemitraan kolaboratif jangka panjang & integrasi rantai pasok)',
            'Mengidentifikasi reagen lab importir tunggal sebagai kuadran Bottleneck (pengamanan pasokan, buffer stock, pencarian substitusi)',
            'Mengidentifikasi karton kemasan SNI sebagai kuadran Leverage (tender kompetitif & negosiasi harga agresif)',
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
        title: 'Kalkulasi Total Cost of Ownership (TCO) Pengadaan Storage SAN Tier-1',
        scenario:
          'Perusahaan merencanakan pengadaan sistem SAN Storage Tier-1 untuk core database perbankan dengan harga beli pokok Rp 750.000.000, biaya instalasi & konfigurasi jaringan SAN Rp 120.000.000, kontrak pemeliharaan & SLA 24/7 sebesar Rp 55.000.000/tahun selama durasi kontrak 4 tahun, dan estimasi nilai sisa (residual value) pada akhir tahun ke-4 sebesar Rp 90.000.000. Sesuai SOP-CORP-PROC-2026-08 Pasal 3, hitung nilai TCO komprehensif sebelum pajak, nilai PPN 11%, dan TCO final.',
        taskType: 'calculation',
        passingScore: 80,
        oracleData: {
          formula: 'purchasePrice + implementationCost + (annualSla * contractYears) - residualValue',
          variables: {
            purchasePrice: 750000000,
            implementationCost: 120000000,
            annualSla: 55000000,
            contractYears: 4,
            residualValue: 90000000,
            expectedTcoPreTax: 1000000000,
            expectedPpn: 110000000,
            expectedTcoFinal: 1110000000,
          },
          checklist: [
            'Verifikasi biaya SLA 4 tahun (Rp 220.000.000)',
            'Pengurangan nilai sisa residual value akhir tahun ke-4 (Rp 90.000.000)',
            'Kalkulasi PPN 11% atas TCO pokok Rp 1.000.000.000 (Rp 110.000.000)',
            'Batas margin overhead vendor <= 15%',
          ],
        },
        rubricCriteria: [
          { name: 'Akurasi Perhitungan TCO Bersih', weight: 60 },
          { name: 'Kepatuhan Komponen PPN & Biaya Siklus Hidup', weight: 40 },
        ],
      })
      .onConflictDoNothing();

    // Isomorphic Variant B (Far Transfer Testing)
    await db
      .insert(tasks)
      .values({
        competencyId: comp02Id,
        title: 'Kalkulasi Total Cost of Ownership (TCO) Infrastruktur Cloud Hybrid (Varian B)',
        scenario:
          'Perusahaan merencanakan migrasi ke sistem Cloud Hybrid dengan harga beli pokok lisensi Rp 400.000.000, biaya implementasi migrasi Rp 90.000.000, biaya langganan cloud & SLA Rp 70.000.000/tahun selama 3 tahun, dan estimasi nilai sisa (residual value) sebesar Rp 50.000.000. Hitung TCO sebelum pajak, PPN 11%, dan TCO final.',
        taskType: 'calculation',
        scenarioVariantCode: 'variant_b',
        isIsomorphicVariant: true,
        passingScore: 80,
        oracleData: {
          formula: 'purchasePrice + implementationCost + (annualSla * contractYears) - residualValue',
          variables: {
            purchasePrice: 400000000,
            implementationCost: 90000000,
            annualSla: 70000000,
            contractYears: 3,
            residualValue: 50000000,
            expectedTcoPreTax: 650000000,
            expectedPpn: 71500000,
            expectedTcoFinal: 721500000,
          },
        },
        rubricCriteria: [
          { name: 'Akurasi Perhitungan TCO Varian B', weight: 60 },
          { name: 'Kepatuhan Formulasi Multi-Tahun & PPN 11%', weight: 40 },
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
