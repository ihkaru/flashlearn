import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { contents, contentSourceCitations, sourceChunks, sources } from '../schema';

export async function seedEnterpriseContents(workspaceId: string, compMap: Map<string, string>) {
  console.log('📚 Seeding Enterprise Procurement Reading Modules (Contents)...');

  const comp01Id = compMap.get('PROC-ENT-01');
  const comp02Id = compMap.get('PROC-ENT-02');
  const comp03Id = compMap.get('PROC-ENT-03');

  // 1. Modul 1: Strategic Sourcing & Matriks Kraljic (Combined: Materi + 3D Flashcards)
  const [existing01] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.workspaceId, workspaceId), eq(contents.slug, 'strategic-sourcing-dan-matriks-kraljic')));

  if (!existing01) {
    await db.insert(contents).values({
      workspaceId,
      competencyId: comp01Id,
      title: 'Pondasi Strategic Sourcing & Klasifikasi Matriks Kraljic',
      slug: 'strategic-sourcing-dan-matriks-kraljic',
      type: 'combined',
      summary:
        'Pelajari 5 pilar tata kelola pengadaan korporat modern serta cara memetakan kategori belanja ke 4 kuadran Kraljic (Routine, Leverage, Bottleneck, Strategic) sesuai SOP-CORP-PROC-2026-08 Pasal 1-2.',
      readingTimeMinutes: 7,
      body: `# Pondasi Strategic Sourcing & Klasifikasi Matriks Kraljic

## 1. Lima Pilar Pengadaan Tingkat Enterprise (SOP Pasal 1)
Tata kelola pengadaan barang dan jasa pada level enterprise modern tidak lagi berfokus semata-mata pada pembelian administratif berbiaya termurah, melainkan berpedoman pada 5 pilar utama:
1. **Efisiensi Finansial & Total Cost of Ownership (TCO)**: Memperhitungkan seluruh biaya siklus hidup produk, bukan hanya harga beli saat transaksi.
2. **Transparansi & Akuntabilitas**: Seluruh tahapan terdokumentasi dan dapat diaudit secara forensik.
3. **Keadilan Bersaing**: Memberikan kesempatan setara bagi calon rekanan yang memenuhi kualifikasi.
4. **Mitigasi Risiko Pasokan**: Mencegah kelangkaan stok barang kritis yang dapat menghentikan operasi bisnis utama.
5. **Kepatuhan ESG (Environmental, Social, and Governance)**: Memastikan rekanan memenuhi standar kelestarian lingkungan dan etika ketenagakerjaan.

---

## 2. Kuadran Matriks Kraljic (SOP Pasal 2)
Matriks Kraljic membagi portofolio belanja menjadi 4 kuadran berdasarkan dua variabel utama:
- **Sumbu Y: Dampak Finansial (Financial Impact / Profit Impact)**
- **Sumbu X: Risiko Pasokan (Supply Risk / Market Complexity)**

### A. Routine Items (Dampak Finansial Rendah, Risiko Pasokan Rendah)
- **Contoh**: Alat Tulis Kantor (ATK), tisu, consumable dapur.
- **Fokus Strategi**: **Standardisasi proses, e-procurement katalog, dan simplifikasi transaksi**.
- **Tujuan**: Meminimalkan biaya transaksi administrasi karena nilai belanjanya kecil dan alternatif vendor melimpah.

### B. Leverage Items (Dampak Finansial Tinggi, Risiko Pasokan Rendah)
- **Contoh**: Sewa armada logistik terstandardisasi, bahan bakar, komoditas massal.
- **Fokus Strategi**: **Tender kompetitif, konsolidasi volume, dan negosiasi harga agresif**.
- **Tujuan**: Memanfaatkan daya tawar pembeli (buyer's market) untuk menekan harga serendah mungkin tanpa khawatir pasokan terputus.

### C. Bottleneck Items (Dampak Finansial Rendah, Risiko Pasokan Tinggi)
- **Contoh**: Suku cadang mesin pabrik tua langka, software lisensi legacy proprietary.
- **Fokus Strategi**: **Pengamanan kontinuitas pasokan, pencarian vendor alternatif, dan buffer stock cadangan**.
- **Tujuan**: Menjamin operasional pabrik tidak mogok hanya karena ketiadaan suku cadang murah yang sulit dicari di pasar.

### D. Strategic Items (Dampak Finansial Tinggi, Risiko Pasokan Tinggi)
- **Contoh**: Polimer kimia custom untuk produk inti manufaktur, mesin perakitan robotik utama.
- **Fokus Strategi**: **Kemitraan kolaboratif jangka panjang (Strategic Partnership), SLA ketat, dan integrasi rantai pasok**.
- **Tujuan**: Mengamankan keunggulan kompetitif perusahaan melalui kolaborasi erat dengan pemasok utama.

---

## 3. Rujukan Resmi
> *"Berdasarkan SOP-CORP-PROC-2026-08 Pasal 2 ayat 1, setiap pengelola pengadaan wajib mengkategorikan kebutuhan belanja ke dalam kuadran Kraljic yang tepat sebelum menentukan metode pengadaan langsung atau tender terbuka."*`,
      questions: [
        {
          id: 'q1',
          prompt:
            'Menurut SOP-CORP-PROC-2026-08 Pasal 2, apa strategi utama pengadaan untuk kategori Routine Items (seperti ATK)?',
          options: [
            'Tender kompetitif internasional dengan jaminan bank 10%',
            'Standardisasi, e-procurement katalog, dan simplifikasi proses administrasi',
            'Kemitraan strategis eksklusif jangka panjang',
            'Membuat safety stock berlebih di gudang',
          ],
          correctIndex: 1,
          explanation:
            'Routine items memiliki dampak finansial dan risiko pasokan rendah, sehingga tujuannya adalah meminimalkan biaya transaksi administrasi lewat simplifikasi dan e-procurement.',
          flashcardFront: 'Apa fokus strategi pengadaan pada kuadran Routine Items dalam Matriks Kraljic?',
          flashcardBack:
            'Simplifikasi proses, standardisasi spesifikasi, dan e-procurement katalog (SOP Pasal 2).',
        },
        {
          id: 'q2',
          prompt:
            'Kategori pengadaan dengan nilai belanja tinggi namun memiliki banyak pemasok alternatif di pasar (Risiko Pasokan Rendah) masuk ke dalam kuadran mana?',
          options: ['Bottleneck Items', 'Strategic Items', 'Leverage Items', 'Routine Items'],
          correctIndex: 2,
          explanation:
            'Leverage Items memiliki dampak finansial tinggi namun pasar sangat kompetitif (risiko pasokan rendah), memungkinkan perusahaan melakukan tender kompetitif dan negosiasi volume.',
          flashcardFront: 'Definisi kuadran Leverage Items pada Matriks Kraljic:',
          flashcardBack:
            'Dampak Finansial Tinggi, Risiko Pasokan Rendah. Strategi: Tender kompetitif & negosiasi volume agresif.',
        },
        {
          id: 'q3',
          prompt:
            'Suku cadang mesin pabrik impor berharga murah tetapi hanya diproduksi oleh 1 pabrikan di dunia diklasifikasikan sebagai:',
          options: ['Bottleneck Items', 'Leverage Items', 'Routine Items', 'Capex Non-Kritis'],
          correctIndex: 0,
          explanation:
            'Bottleneck items dicirikan oleh nilai finansial yang relatif kecil tetapi risiko pasokannya sangat tinggi/kritis bagi kelangsungan operasional.',
          flashcardFront: 'Ciri utama kuadran Bottleneck Items:',
          flashcardBack:
            'Nilai belanja rendah/sedang, tetapi risiko pasokan tinggi. Fokus strategi: Pengamanan pasokan & buffer stock.',
        },
      ],
      isPublished: true,
    });
  }

  // 2. Modul 2: Total Cost of Ownership (TCO) Calculation (Combined)
  const [existing02] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.workspaceId, workspaceId), eq(contents.slug, 'kalkulasi-total-cost-of-ownership-tco')));

  if (!existing02) {
    await db.insert(contents).values({
      workspaceId,
      competencyId: comp02Id,
      title: 'Kalkulasi Total Cost of Ownership (TCO) & Analisis Siklus Hidup',
      slug: 'kalkulasi-total-cost-of-ownership-tco',
      type: 'combined',
      summary:
        'Kuasai metode perhitungan TCO pengadaan server & aset modal: Harga Beli, Biaya Implementasi, SLA Multi-tahun, Residual Value, PPN 11%, dan batas overhead vendor 15% sesuai SOP Pasal 3.',
      readingTimeMinutes: 6,
      body: `# Kalkulasi Total Cost of Ownership (TCO) & Analisis Siklus Hidup

## 1. Konsep Biaya Kepemilikan Total (Life Cycle Costing)
Pengadaan aset modal (Capital Expenditure / CAPEX) tidak boleh hanya membandingkan harga beli di awal penawaran (*acquisition price*). Seringkali biaya pemeliharaan, lisensi tahunan, dan migrasi jauh melampaui harga beli barang.

## 2. Formula Standar TCO (SOP-CORP-PROC-2026-08 Pasal 3)
$$\\text{TCO Sebelum Pajak} = \\text{Harga Beli Pokok} + \\text{Biaya Implementasi} + (\\text{Biaya SLA Tahunan} \\times \\text{Tahun Kontrak}) - \\text{Nilai Sisa (Residual Value)}$$

### Ketentuan Tambahan Pasal 3:
1. **PPN 11%**: Dihitung dari total nilai TCO sebelum pajak jika seluruh komponen merupakan objek pajak pertambahan nilai.
2. **Batas Overhead & Margin Laba**: Margin laba wajar yang diajukan vendor maksimal adalah **15%**. Penawaran dengan overhead di atas 15% wajib diverifikasi ulang oleh tim HPS.
3. **Nilai Sisa (Residual Value)**: Estimasi nilai wajar pelepasan aset pada akhir periode kontrak diperlakukan sebagai faktor pengurang (*deduction factor*).

---

## 3. Contoh Studi Kasus Riil
- **Harga Beli Pokok Server**: Rp 500.000.000
- **Biaya Implementasi & Migrasi**: Rp 80.000.000
- **Kontrak SLA & Support**: Rp 40.000.000 / tahun (Durasi 3 tahun = Rp 120.000.000)
- **Estimasi Nilai Sisa (Residual Value)**: Rp 50.000.000
- **TCO Sebelum Pajak**: Rp 500jt + Rp 80jt + Rp 120jt - Rp 50jt = **Rp 650.000.000**
- **PPN 11%**: 11% x Rp 650.000.000 = **Rp 71.500.000**
- **TCO Final**: Rp 650.000.000 + Rp 71.500.000 = **Rp 721.500.000**`,
      questions: [
        {
          id: 'q_tco_1',
          prompt:
            'Sesuai SOP-CORP-PROC-2026-08 Pasal 3, bagaimana posisi Nilai Sisa (Residual Value) dalam perhitungan Total Cost of Ownership?',
          options: [
            'Sebagai faktor penambah biaya total kepemilikan',
            'Sebagai faktor pengurang dari total biaya siklus hidup',
            'Tidak boleh diperhitungkan dalam formulasi pengadaan',
            'Dikonversi menjadi denda keterlambatan rekanan',
          ],
          correctIndex: 1,
          explanation:
            'Nilai sisa diperhitungkan sebagai faktor pengurang karena merupakan estimasi aset yang dapat dipulihkan pada akhir masa manfaat.',
          flashcardFront: 'Posisi Residual Value dalam formula TCO:',
          flashcardBack: 'Faktor Pengurang dari total biaya kepemilikan (SOP Pasal 3).',
        },
        {
          id: 'q_tco_2',
          prompt:
            'Berapakah batas maksimum margin laba dan overhead vendor yang diizinkan menurut SOP Pasal 3?',
          options: [
            'Maksimal 10%',
            'Maksimal 15%',
            'Maksimal 25%',
            'Tidak ada batasan selama disetujui Direksi',
          ],
          correctIndex: 1,
          explanation: 'SOP Pasal 3 menetapkan batas overhead dan laba wajar maksimal 15%.',
          flashcardFront: 'Batas wajar overhead & laba rekanan (SOP Pasal 3):',
          flashcardBack: 'Maksimal 15% dari total biaya riil.',
        },
      ],
      isPublished: true,
    });
  }

  // 3. Modul 3: Vendor Due Diligence, Three-Way Matching & Anti-Split PO (Materi)
  const [existing03] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.workspaceId, workspaceId), eq(contents.slug, 'uji-tuntas-rekanan-three-way-matching-p2p')));

  if (!existing03) {
    await db.insert(contents).values({
      workspaceId,
      competencyId: comp03Id,
      title: 'Uji Tuntas Rekanan, Three-Way Matching & Pengendalian Siklus P2P',
      slug: 'uji-tuntas-rekanan-three-way-matching-p2p',
      type: 'materi',
      summary:
        'Pedoman verifikasi kepatuhan legalitas vendor (ISO 9001/27001), pencegahan benturan kepentingan (COI), kontrol dokumen Three-Way Matching, dan audit deteksi Split PO sesuai SOP Pasal 4-8.',
      readingTimeMinutes: 8,
      body: `# Uji Tuntas Rekanan, Three-Way Matching & Pengendalian Siklus P2P

## 1. Uji Tuntas Legalitas & Kualifikasi Vendor (SOP Pasal 4-5)
Pengadaan pada level korporat mensyaratkan integritas dokumen administrasi mutlak:
1. **NIB & KSWP Aktif**: Membuktikan kepatuhan perpajakan dan izin usaha yang sah.
2. **Kesehatan Keuangan**: Rasio Likuiditas *Current Ratio* $\\ge 1.2$ untuk menjamin rekanan memiliki modal kerja cukup.
3. **Keabsahan Sertifikasi ISO 9001 & ISO 27001**:
   - **Aturan Mutlak**: Sertifikat wajib masih aktif pada tanggal batas akhir pemasukan penawaran.
   - **Komitmen Perpanjangan Batal**: Surat pernyataan perpanjangan atau tanda terima permohonan sertifikat yang sedang diproses di lembaga sertifikasi **BUKAN dokumen pengganti sah**. Peserta dengan sertifikat kedaluwarsa wajib langsung digugurkan (*GUGUR*).
4. **Benturan Kepentingan (Conflict of Interest / COI)**:
   - Dilarang keras melibatkan rekanan yang memiliki hubungan afiliasi kepemilikan saham silang atau hubungan kekeluargaan dengan Direksi, Tim Pengadaan, atau Pengguna Anggaran.

---

## 2. Pengendalian Siklus Procure-to-Pay (P2P): Three-Way Matching (SOP Pasal 6)
Sebelum bagian Keuangan melakukan pencairan pembayaran, wajib dilakukan verifikasi pencocokan tiga dokumen (*Three-Way Matching*):
1. **Purchase Order (PO) Sah**: Membuktikan adanya pesanan resmi dengan harga dan kuantitas yang disetujui.
2. **Berita Acara Serah Terima (BAST) / Goods Receipt**: Wajib ditandatangani oleh **Pengelola Gudang / Pemeriksa Fisik Independen** yang membuktikan barang telah diterima secara fisik dalam kondisi baik.
3. **Faktur Pajak & Invoice**: Menagihkan pembayaran sesuai kuantitas yang telah diverifikasi di BAST.

> *Larangan*: Pembayaran dilarang diproses apabila BAST belum ditandatangani oleh petugas gudang independen, meskipun surat pesanan telah lengkap.

---

## 3. Audit Forensik: Deteksi Split PO (SOP Pasal 7)
- **Modus**: Memecah paket pengadaan besar bernilai Rp 144.000.000 menjadi 3 PO berurutan (misal: 3 x Rp 48.000.000) dalam waktu berdekatan kepada rekanan yang sama.
- **Tujuan Fraud**: Menghindari batas kewajiban tender terbuka (misal batas pengadaan langsung Rp 50.000.000) atau menghindari ambang batas persetujuan Direksi.
- **Sanksi**: Tindakan ini merupakan pelanggaran berat kepatuhan. Pembayaran wajib dibekukan dan perkara dieskalasi ke Komite Audit Internal.

---

## 4. Pertahanan Tekanan Akhir Tahun / Q4 CAPEX (SOP Pasal 8)
Pada akhir tahun buku (Desember), sering terjadi tekanan dari manajemen untuk mempercepat realisasi anggaran agar belanja modal tidak hangus (*budget lapse*).
- **Ketentuan Tegas**: Tekanan waktu akhir tahun tidak boleh dijadikan alasan untuk mengabaikan uji tuntas rekanan.
- **Tindakan Procurement Officer**: Jika calon rekanan belum menyerahkan laporan keuangan auditan atau sertifikat keselamatan kerja, petugas wajib menolak penerbitan PO dan menerbitkan Nota Peringatan Kepatuhan resmi ke Komite Kepatuhan.`,
      isPublished: true,
    });
  }

  // 4. Populate Corpus Citations (Layer 1: Corpus-Task Traceability)
  const allContents = await db
    .select()
    .from(contents)
    .where(eq(contents.workspaceId, workspaceId));

  const allChunks = await db
    .select({
      id: sourceChunks.id,
      locationTag: sourceChunks.locationTag,
      sourceCode: sources.code,
    })
    .from(sourceChunks)
    .innerJoin(sources, eq(sourceChunks.sourceId, sources.id));

  const entChunks = allChunks.filter((chk) => chk.sourceCode === 'SRC-ENT-PROC-2026');

  for (const cnt of allContents) {
    if (cnt.slug === 'strategic-sourcing-dan-matriks-kraljic') {
      const targetChunk = entChunks.find((c: any) => c.locationTag.includes('Prinsip & Kraljic'));
      if (targetChunk) {
        await db
          .insert(contentSourceCitations)
          .values({
            contentId: cnt.id,
            sourceChunkId: targetChunk.id,
            relevanceScore: '1.00',
            annotation: 'Rujukan resmi SOP Pasal 1-2 mengenai 5 Pilar Pengadaan & 4 Kuadran Matriks Kraljic',
          })
          .onConflictDoNothing();
      }
    } else if (cnt.slug === 'kalkulasi-total-cost-of-ownership-tco') {
      const targetChunk = entChunks.find((c: any) => c.locationTag.includes('Formulasi TCO'));
      if (targetChunk) {
        await db
          .insert(contentSourceCitations)
          .values({
            contentId: cnt.id,
            sourceChunkId: targetChunk.id,
            relevanceScore: '1.00',
            annotation: 'Formula baku perhitungan Total Cost of Ownership (TCO) & batas overhead margin wajar',
          })
          .onConflictDoNothing();
      }
    } else if (cnt.slug === 'uji-tuntas-rekanan-three-way-matching-p2p') {
      const chunkAudit = entChunks.find((c: any) => c.locationTag.includes('Uji Tuntas'));
      const chunkP2P = entChunks.find((c: any) => c.locationTag.includes('P2P Control'));
      if (chunkAudit) {
        await db
          .insert(contentSourceCitations)
          .values({
            contentId: cnt.id,
            sourceChunkId: chunkAudit.id,
            relevanceScore: '1.00',
            annotation: 'Kriteria mutlak uji tuntas rekanan ISO 27001 & larangan surat komitmen pengganti',
          })
          .onConflictDoNothing();
      }
      if (chunkP2P) {
        await db
          .insert(contentSourceCitations)
          .values({
            contentId: cnt.id,
            sourceChunkId: chunkP2P.id,
            relevanceScore: '0.95',
            annotation: 'Prinsip verifikasi Three-Way Matching dan larangan pemecahan paket pengadaan (Anti-Split PO)',
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log('✓ 3 Enterprise Procurement Reading Modules & Citations Seeded Successfully!');
}
