<script lang="ts">
  import Icon from '../ui/Icon.svelte';

  interface Props {
    taskTitle?: string;
    scenario?: string;
    oracleClass?: string;
  }

  let { taskTitle = '', scenario = '', oracleClass = 'A' }: Props = $props();

  let isExpanded = $state(true);
  let activeTab = $state<'recommended' | 'pasal1_2' | 'pasal3' | 'pasal4_5' | 'pasal6_7' | 'pasal8'>('recommended');

  const corpusArticles = [
    {
      id: 'pasal1_2',
      tag: 'Pasal 1-2 (Strategic Sourcing & Matriks Kraljic)',
      topics: ['Prinsip Strategic Sourcing', '4 Kuadran Kraljic', 'Kategori Belanja Korporat'],
      content: `1. Lima Pilar Pengadaan Enterprise:
- Efisiensi Finansial (TCO): Analisis biaya siklus hidup penuh, bukan hanya harga beli transaksi.
- Transparansi & Akuntabilitas: Seluruh tahapan terdokumentasi dan dapat diaudit secara forensik.
- Keadilan Bersaing: Akses setara bagi seluruh calon rekanan berkualifikasi sah.
- Mitigasi Risiko Pasokan: Mencegah kegagalan pasokan barang/jasa inti manufaktur.
- Kepatuhan ESG: Tanggung jawab lingkungan, sosial, dan tata kelola etis.

2. Klasifikasi Portofolio Belanja (Matriks Kraljic):
- Routine Items (Dampak Finansial Rendah, Risiko Pasokan Rendah):
  Contoh: ATK & consumable kantor.
  Strategi: Simplifikasi proses, standardisasi spesifikasi, dan e-procurement katalog.
- Leverage Items (Dampak Finansial Tinggi, Risiko Pasokan Rendah):
  Contoh: Sewa armada logistik, komoditas massal.
  Strategi: Tender kompetitif, konsolidasi volume belanja, dan negosiasi harga agresif.
- Bottleneck Items (Dampak Finansial Rendah, Risiko Pasokan Tinggi):
  Contoh: Suku cadang mesin pabrik langka/impor tunggal.
  Strategi: Pengamanan kontinuitas pasokan, buffer stock cadangan, dan pencarian rekanan alternatif.
- Strategic Items (Dampak Finansial Tinggi, Risiko Pasokan Tinggi):
  Contoh: Bahan baku polimer kimia custom inti produksi.
  Strategi: Kemitraan strategis kolaboratif jangka panjang (partnership), SLA ketat, dan mitigasi risiko bersama.`,
    },
    {
      id: 'pasal3',
      tag: 'Pasal 3 (Formulasi TCO & Biaya Siklus Hidup)',
      topics: ['Rumus TCO Pokok', 'Batas Overhead Vendor <= 15%', 'PPN 11%', 'Residual Value'],
      content: `1. Formulasi Standar Total Cost of Ownership (TCO):
TCO Sebelum Pajak = Harga Beli Pokok + Biaya Implementasi + (Biaya SLA Tahunan x Tahun Kontrak) - Nilai Sisa (Residual Value).

2. Pajak Pertambahan Nilai (PPN 11%):
Dihitung sebesar 11% dari total TCO sebelum pajak atas seluruh komponen yang merupakan objek kena pajak.
TCO Final = TCO Sebelum Pajak + Nilai PPN 11%.

3. Batas Kewajaran Overhead & Laba Rekanan:
Batas margin laba dan overhead vendor maksimal adalah 15%. Penawaran di atas 15% wajib diklarifikasi atau dinegosiasikan ulang.

4. Perlakuan Nilai Sisa (Residual Value):
Nilai taksiran wajar pelepasan aset pada akhir periode kontrak wajib diperlakukan sebagai faktor pengurang biaya kepemilikan.`,
    },
    {
      id: 'pasal4_5',
      tag: 'Pasal 4-5 (Uji Tuntas Rekanan & Benturan Kepentingan)',
      topics: ['Legalitas NIB & KSWP', 'Sertifikasi ISO 9001/27001', 'Conflict of Interest (COI)'],
      content: `1. Standar Mutlak Kualifikasi Administrasi Rekanan:
- Legalitas Usaha: NIB aktif dan KSWP berstatus valid dari Ditjen Pajak.
- Rasio Likuiditas Keuangan: Current Ratio laporan keuangan auditan minimal >= 1.2.
- Standar Mutu & Keamanan: Sertifikat ISO 9001 dan ISO 27001 wajib berstatus AKTIF pada tanggal pembukaan penawaran.

2. Aturan Ketat Masa Berlaku Sertifikat:
Surat komitmen perpanjangan atau bukti pendaftaran audit ISO BUKAN merupakan dokumen pengganti sertifikat yang sah. Rekanan dengan sertifikat kedaluwarsa WAJIB langsung digugurkan (GUGUR / DISKUALIFIKASI).

3. Larangan Benturan Kepentingan (COI):
Dilarang melibatkan rekanan yang memiliki hubungan afiliasi kepemilikan saham silang atau hubungan kekeluargaan dengan Direksi, Tim Pengadaan, maupun Pejabat Pembuat Komitmen (PPK).`,
    },
    {
      id: 'pasal6_7',
      tag: 'Pasal 6-7 (Pengendalian P2P & Anti-Split PO)',
      topics: ['Three-Way Matching', 'Pemisahan Fungsi BAST Independen', 'Pencegahan Split PO'],
      content: `1. Prinsip Pengendalian Three-Way Matching:
Pencairan pembayaran wajib mencocokkan tiga dokumen sah:
- Purchase Order (PO) sah yang disetujui pejabat berwenang.
- Berita Acara Serah Terima (BAST) / Goods Receipt fisik yang ditandatangani oleh Pengelola Gudang / Pemeriksa Independen.
- Faktur Pajak & Invoice resmi dari rekanan.
Pembayaran DILARANG diproses jika BAST belum diverifikasi fisik secara independen.

2. Larangan Pemecahan Paket Pengadaan (Anti-Split PO):
Dilarang keras memecah transaksi belanja modal sejenis menjadi beberapa PO kecil berurutan (misal: di bawah batas pengadaan langsung Rp 50.000.000) untuk menghindari kewajiban tender terbuka atau persetujuan Direksi. Modus split PO merupakan pelanggaran berat kepatuhan.`,
    },
    {
      id: 'pasal8',
      tag: 'Pasal 8 (Integritas Menghadapi Tekanan Q4 CAPEX)',
      topics: ['Pertahanan Tekanan Waktu', 'Larangan Intervensi Lisan', 'Nota Peringatan Kepatuhan'],
      content: `1. Pertahanan Tekanan Akhir Tahun:
Ancaman hangusnya anggaran belanja modal (CAPEX) pada akhir tahun atau desakan percepatan penyerapan anggaran DILARANG dijadikan pembenaran untuk mengabaikan uji tuntas rekanan atau melewati verifikasi kelayakan teknis.

2. Penolakan Instruksi Tanpa Dokumen Sah:
Petugas pengadaan wajib menolak instruksi lisan pimpinan yang bertentangan dengan prosedur tata kelola resmi.

3. Eskalasi Kepatuhan:
Jika terjadi intervensi atau intimidasi struktural, petugas wajib menerbitkan Nota Peringatan Kepatuhan resmi dan melaporkan perkara ke Komite Audit / Dewan Komisaris.`,
    },
  ];

  // Determine recommended article based on task context
  let recommendedArticleId = $derived.by(() => {
    const text = `${taskTitle} ${scenario}`.toLowerCase();
    if (text.includes('kraljic') || text.includes('sourcing') || text.includes('atk') || text.includes('polimer')) {
      return 'pasal1_2';
    }
    if (text.includes('tco') || text.includes('ownership') || text.includes('sla') || text.includes('server')) {
      return 'pasal3';
    }
    if (text.includes('iso') || text.includes('due diligence') || text.includes('uji tuntas') || text.includes('benturan')) {
      return 'pasal4_5';
    }
    if (text.includes('three-way') || text.includes('split po') || text.includes('p2p') || text.includes('bast')) {
      return 'pasal6_7';
    }
    if (text.includes('q4') || text.includes('anggaran') || text.includes('darurat') || text.includes('genset')) {
      return 'pasal8';
    }
    return 'pasal1_2';
  });

  let activeArticle = $derived.by(() => {
    const targetId = activeTab === 'recommended' ? recommendedArticleId : activeTab;
    return corpusArticles.find((a) => a.id === targetId) || corpusArticles[0];
  });
</script>

<div
  style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03);"
>
  <!-- Card Header -->
  <div
    style="padding: 12px 16px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); display: flex; justify-content: space-between; align-items: center; border-bottom: {isExpanded ? '1px solid #bbf7d0' : 'none'};"
  >
    <div style="display: flex; align-items: center; gap: 8px;">
      <span
        style="width: 26px; height: 26px; border-radius: 7px; background: #0f766e; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;"
      >
        <Icon name="book-open" size={14} />
      </span>
      <div>
        <div style="font-size: 0.86rem; font-weight: 800; color: #064e3b; display: flex; align-items: center; gap: 6px;">
          <span>Dokumen Acuan Resmi (Corpus of Record)</span>
          <span style="font-size: 0.7rem; font-weight: 700; background: #bbf7d0; color: #14532d; padding: 1px 6px; border-radius: 4px;">
            SOP-CORP-PROC-2026-08
          </span>
        </div>
        <div style="font-size: 0.72rem; color: #047857;">
          Dasar rujukan resmi terverifikasi yang digunakan Oracle untuk menguji solusi tugas Anda.
        </div>
      </div>
    </div>

    <button
      type="button"
      onclick={() => (isExpanded = !isExpanded)}
      class="fl-btn fl-btn-sm"
      style="border: 1px solid #bbf7d0; background: #ffffff; color: #0f766e; font-size: 0.76rem; font-weight: 700;"
    >
      <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} />
      <span>{isExpanded ? 'Sembunyikan' : 'Buka Rujukan'}</span>
    </button>
  </div>

  <!-- Card Body -->
  {#if isExpanded}
    <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
      <!-- Pasal Selector Pills -->
      <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; -webkit-overflow-scrolling: touch;">
        <button
          type="button"
          onclick={() => (activeTab = 'recommended')}
          class="fl-btn fl-btn-sm fl-pill-btn"
          style="font-size: 0.75rem; font-weight: 700; background: {activeTab === 'recommended' ? '#0f766e' : '#ffffff'}; color: {activeTab === 'recommended' ? '#ffffff' : '#334155'}; border: 1px solid {activeTab === 'recommended' ? '#0f766e' : '#cbd5e1'};"
        >
          <Icon name="sparkles" size={12} />
          <span>Rujukan Tugas Ini</span>
        </button>
        {#each corpusArticles as art}
          <button
            type="button"
            onclick={() => (activeTab = art.id as any)}
            class="fl-btn fl-btn-sm fl-pill-btn"
            style="font-size: 0.75rem; font-weight: 700; background: {activeTab === art.id ? '#0f766e' : '#ffffff'}; color: {activeTab === art.id ? '#ffffff' : '#475569'}; border: 1px solid {activeTab === art.id ? '#0f766e' : '#e2e8f0'};"
          >
            {art.tag.split(' ')[0]} {art.tag.split(' ')[1]}
          </button>
        {/each}
      </div>

      <!-- Active Article Content Box -->
      <div
        style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; font-size: 0.82rem; color: #1e293b; line-height: 1.5;"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px;">
          <div>
            <span style="font-weight: 800; font-size: 0.85rem; color: #0f766e;">
              {activeArticle.tag}
            </span>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 3px;">
              {#each activeArticle.topics as topic}
                <span style="font-size: 0.68rem; font-weight: 700; background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px;">
                  #{topic}
                </span>
              {/each}
            </div>
          </div>
          <span style="font-size: 0.68rem; color: #64748b; font-family: monospace; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            SHA-256 Validated
          </span>
        </div>

        <div style="white-space: pre-line; max-height: 240px; overflow-y: auto; font-family: -apple-system, BlinkMacSystemFont, 'Google Sans', Roboto, sans-serif;">
          {activeArticle.content}
        </div>
      </div>
    </div>
  {/if}
</div>
