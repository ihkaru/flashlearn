---
name: flashlearn-curriculum-pipeline
description: Self-contained elastic 4-layer CLI curriculum compiler for FlashLearn (2-minute simple topics to 1,000+ page multi-book PDF/EPUB/PPTX courses). Implements Two-Phase Long-Running Agent Harness (Initializer + 1-chapter-at-a-time Incremental Worker), granular chapter-ledger.json task tracking, Extract-then-Author against Lost-in-the-Middle, Key Point Recall (>=85%) & Faithfulness Ratchet auditing, 15 curated pedagogies (CC BY-SA 4.0), Clement & Brown Bridging Analogies, cross-PC remote CRUD (`push/diff/prune/pull`), external visual HTML decks (e.g. guizang-ppt-skill AGPL-3.0), and native persistent asset uploads.
---

# FlashLearn Adaptive Elastic Curriculum Pipeline v3 (`flashlearn-curriculum-pipeline`)

Gunakan skill ini untuk menyusun, memperbarui, maupun mengelola materi pembelajaran di FlashLearn — mulai dari **topik sederhana 2–3 menit** hingga **kompilasi ebook teknis 300–1.000+ halaman (PDF / EPUB / PPTX)** — secara **100% lintas PC melalui HTTP CLI** (`flashlearn`) tanpa akses database lokal maupun Tailscale.

---

## 1. Invarian Utama (Wajib Ditegakkan)

1. **Kontrak Mode Jujur (`lossless_full` vs `executive_map`)**:
   - **`lossless_full` (Default untuk Buku/Textbook)**: Wajib mematuhi **Batas Granularitas Bab** dan **Ratchet Key Point Recall >= 85%**. Hanya workspace mode ini yang boleh mencantumkan label *"Kurikulum Utuh / Lossless"*.
   - **`executive_map` (Peta Ringkas / Ikhtisar Multi-Bab)**: Diperbolehkan hanya jika diminta secara eksplisit oleh pengguna. **Dilarang keras** mengklaim *"100% lossless"* atau *"utuh"* pada judul maupun deskripsi; wajib menyatakan secara transparan *"Peta Ringkas (Executive Map)"*.
2. **Batas Granularitas Bab & Anti-Kompresi Berlebih (*Max 1 Chapter per Module*)**:
   - Untuk buku Skala L dalam mode `lossless_full`, **maksimal 1 bab = 1 modul**. **Dilarang menggabungkan 3–5 bab sekaligus menjadi 1 modul** karena terbukti memicu kompresi ekstrem (~10–12% teks sumber) dan hilangnya studi kasus/tabel/nuansa penting.
   - **Bab Gemuk (*Mega-Chapter*)**: Jika 1 bab melebihi **40 halaman** atau **12.000 kata** atau memuat **>= 3 pola/studi kasus besar**, **wajib dipecah menjadi 2–3 modul berurutan** (mis. `Bab 12A`, `Bab 12B`).
   - Kelompokkan modul ke dalam **Unit Pertemuan Kuliah** berdurasi maksimal **<= 120 menit** (target ideal **45–90 menit**), dan jaga tiap modul sesi tetap nyaman (**5–15 menit**).
   - `coverage.unmappedSliceIds = []` hanyalah syarat **struktural minimum** (belum membuktikan *lossless* secara semantik). Kelengkapan semantik wajib dibuktikan lewat **Key Point Recall >= 85%** pada `chapter-ledger.json`.
3. **Elastisitas Skala & Anti-*Early Victory* (One-Chapter-at-a-Time)**:
   - **Skala S** (1 artikel / topik / <= 15 hal): 1 sesi langsung (`import-interactive`), profil `micro_know` atau `bridging_understand`.
   - **Skala M** (1 paper / SOP / 16–100 hal): 1–2 sesi memakai `flashlearn plan` (1–3 Unit Kuliah).
   - **Skala L** (ebook 100–1.000+ hal, 15–50+ bab): **WAJIB Two-Phase Harness Multi-Sesi**. **Dilarang** mengarang seluruh isi buku 20–40 bab sekaligus dalam 1 giliran dari Daftar Isi (*TOC*) atau memori model. Kerjakan **1–2 bab per iterasi** dengan konteks segar berbasis `chapter-ledger.json` & `HANDOFF.md`.
4. **Invarian Anti-Istilah Mendadak & Aturan Contoh Akrab (*Zero Unexplained Jargon & Familiar Example First*)**:
   - **Dilarang Memunculkan Istilah/Akronim Tanpa Penjelasan (di SELURUH Blok 1–5 & Slide)**: Setiap istilah teknis, istilah asing, akronim, atau nama lembaga yang belum diperkenalkan di modul sebelumnya **WAJIB** dijelaskan singkat dalam bahasa Indonesia sederhana pada kemunculan pertamanya (*inline plain-language gloss*) **DAN** dimasukkan ke `glossary` lengkap dengan `highSchoolAnchor`.
   - **Contoh Harus Akrab dengan Pembelajar**: Gunakan **contoh akrab pembelajar** terlebih dulu sebagai jangkar pemahaman utama, lalu jika studi kasus asli buku tetap disertakan agar *lossless*, perkenalkan konteksnya secara utuh dalam 1 kalimat sederhana beserta padanan akrabnya.
5. **Batas Lisensi & Isolasi Arsitektur**:
   - **FlashLearn Core, UILA v2, CLI PDF (`unpdf`) & EPUB/PPTX (`fflate`)**: MIT (lintas OS Windows/macOS/Linux/Termux, nol Poppler wajib, nol AGPL).
   - **15 Prinsip Pedagogi Terkurasi** *(diadaptasi dari `GarethManning/education-agent-skills`, CC BY-SA 4.0)*: dirangkum mandiri di Layer 2 dengan atribusi eksplisit.
   - **Visual Slide Deck Eksternal** *(mis. `guizang-ppt-skill`, GNU AGPL-3.0)*: wajib dijalankan di luar repositori FlashLearn saat authoring; output HTML diunggah sebagai data (`content_artifacts`) dan diputar terisolasi dalam `<iframe sandbox="allow-scripts">`. **Dilarang menyalin kode AGPL ke dalam repo FlashLearn.**

---

## 2. Konfigurasi CLI Lintas PC (Hanya Base URL & API Key)

Seluruh operasi *create, update, push, delete, restore, rollback, diff, prune, pull* berjalan murni lewat HTTP API menggunakan konfigurasi CLI dengan urutan prioritas **Flag (`--base-url`, `--api-key`) > Environment (`FLASHLEARN_BASE_URL`, `FLASHLEARN_API_KEY` / `FLASHLEARN_SUPERADMIN_API_KEY`) > File Lokal (`~/.flashlearn/config.json`, `chmod 600`)**.

```bash
# 1. Set sekali di PC mana pun (Windows / macOS / Linux / Termux)
flashlearn config set --base-url https://your-flashlearn.example.com --api-key "<fl_live_...>"
flashlearn auth whoami

# Atau jalankan dengan injeksi secret manager (tanpa menyimpan key di disk)
# env: FLASHLEARN_BASE_URL + FLASHLEARN_SUPERADMIN_API_KEY
flashlearn auth whoami
```

---

## 3. Layer 1: Ekstraksi Multi-Format Lossless & Inisialisasi Ledger Bab (Phase 1 — Initializer)

Pada **Phase 1 (dijalankan 1x di awal proyek buku)**, Agen Initializer hanya bertugas mengekstrak sumber mentah, mengekstrak diagram, dan membangun **daftar tugas atomik per bab** tanpa langsung mengarang seluruh modul.

```bash
# 1. Indeks 1 atau banyak buku (PDF + EPUB + PPTX + MD) & buat rencana kuliah <= 2 jam/unit
flashlearn plan init \
  --input "./books/ebook1.pdf,./books/ebook2.epub,./books/slides.pptx" \
  --dir "./work/nama-kursus" \
  --title "Judul Mata Kuliah / Topik" \
  --max-unit-minutes 90 \
  --decks selective

# 2. Cek cakupan struktural (unmappedSliceIds harus 0) & status seluruh Unit
flashlearn plan status --dir "./work/nama-kursus"
```

### Buat `chapter-ledger.json` (Daftar Tugas Atomik per Bab)
Segera setelah `plan init`, buat file `./work/nama-kursus/chapter-ledger.json` yang memetakan **1 baris = 1 bab (atau sub-bab untuk mega-chapter)** agar worker dapat mengiterasi satu per satu lintas sesi tanpa kehilangan konteks:

```json
{
  "mode": "lossless_full",
  "recallThreshold": 0.85,
  "chapters": [
    {
      "chapterId": "ch-01",
      "title": "Bab 1: Judul Bab",
      "sliceIds": ["slice-001", "slice-002"],
      "sourceWordCount": 6400,
      "moduleSlugs": ["01-judul-bab"],
      "status": "pending",
      "keyPointsTotal": 0,
      "keyPointsCovered": 0,
      "keyPointRecall": 0,
      "missingPoints": []
    }
  ]
}
```

- **Ekstraksi Diagram (Layer 1.5)**: Jika ada halaman PDF bertanda `needsVlmTriage: true` atau diagram/grafik/formulir penting di PDF/EPUB/PPTX, gunakan skill pendamping **`flashlearn-figure-extractor`** untuk mengekstrak gambar ke format WebP di `./assets/`, lalu tempelkan ke `payload.figures[]` lengkap dengan `caption`, `altText`, `sourcePage`, `stepId`, dan `annotations`.
- **Upload Aset Persisten**: `flashlearn plan push --upload-media` mengunggah gambar lokal otomatis ke endpoint persisten bawaan FlashLearn (`/api/v1/workspaces/:id/assets`, deduplikasi `sha256`, tanpa memerlukan server MediaVault eksternal).
- **Lanjutkan dari PC Lain**:
  ```bash
  flashlearn plan pull --workspace-id "<workspace-id-atau-slug>" --dir "./work/nama-kursus"
  ```

---

## 4. Layer 2: Perencanaan Pedagogi Elastis (15 Prinsip + 4 Profil KUD + Clement–Brown)

### A. Pilih Profil Pengetahuan (`knowledgeProfile`) — Jangan Paksa 1 Cetakan
| `knowledgeProfile` | Cocok Untuk | Alur Langkah di UI |
| :--- | :--- | :--- |
| **`micro_know`** | Fakta, klasifikasi, istilah, pengenalan 2–3 menit | **Ringkas 4 langkah**: Gagasan Inti → Contoh Nyata → Cek Cepat + Kalibrasi → Rangkuman *(tanpa paksaan titik buntu/rumus)*. |
| **`bridging_understand`** | Konsep abstrak/mekanis sebab-akibat | **Clement–Brown + UILA v2**: Masalah Nyata (+ Tebak 10 Detik) → Anchoring Lab / Analogi / Eksperimen Pikiran → Jembatan + `analogyBreakpoint` → *(Hinge Check)* → Aturan Inti → Simbol → Uji Prediksi 5-Axis → Rangkuman. |
| **`procedural_do`** | Langkah teknis, kode, rumus, audit SOP | Masalah Nyata → *(Hinge Check)* → Aturan Inti → Worked Example → **Erroneous Example (Temukan & Perbaiki Kesalahan)** → Uji Prediksi → *(Explain-Back)* → Rangkuman. |
| **`ill_structured_case`** | Hukum, kebijakan, strategi, sejarah, etika | Dilema Nyata → **Silang Sumber & Multi-Perspektif + Single-Point Rubric** → Uji Keputusan → **Explain-Back** → Rangkuman *(tidak memaksa rumus matematis)*. |

### B. 15 Prinsip Pedagogi Terkurasi *(diadaptasi dari GarethManning/education-agent-skills, CC BY-SA 4.0)*
1. **Backwards Design**: tetapkan bukti transfer akhir (Block 5 / Gate) dulu sebelum memecah prasyarat.
2. **Epistemic & KUD Routing**: petakan *Know / Understand / Do / Horizontal* ke `knowledgeProfile` yang sesuai.
3. **Semantic Waves (Maton)**: bergerak dari konkret → abstraksi → aplikasi nyata di tiap modul.
4. **Mental Model Mapping**: identifikasi miskonsepsi pemula sebelum menulis penjelasan.
5. **Cognitive Load Analysis**: satu fokus bab/sub-bab per modul; prompt Block 5 target <= 50 kata.
6. **Concrete–Pictorial–Abstract (CPA)**: pengalaman konkret → visual/diagram → simbol formal.
7. **Dual Coding Anti-Duplikasi**: slide visual memuat diagram/angka kunci; kartu teks di bawah hanya memuat 1 arahan aksi & alasan kausal singkat (jangan salin-tempel teks slide ke kartu).
8. **Variation Theory**: gunakan `contrastingCases` (*Sering keliru* vs *Yang sebenarnya terjadi*).
9. **Worked Example + Completion Fading**: contoh terbedah singkat sebelum latihan mandiri.
10. **Erroneous Examples**: contoh sengaja cacat (`erroneousExample`) untuk mengasah deteksi bug/kesalahan.
11. **Productive Failure Ringan**: `quickPrediction` 10 detik di Langkah 1 sebelum titik buntu dibuka.
12. **Hinge Question**: `hingeCheck` 20 detik di tengah modul + `remediationCard` singkat jika meleset.
13. **Confidence Calibration**: aktif otomatis di UI (`Yakin / Ragu / Menebak`) untuk menangkap *overconfident misconception* & *lucky guess*.
14. **Explain-Back & Vocabulary Tiering**: `explainBack` di akhir modul kompleks + glosarium berfokus pada istilah `tier: 2` (akademik lintas bidang) & `tier: 3` (teknis inti).
15. **Transfer Bridge & Interleaving**: soal Block 5 berupa prediksi kausal situasi baru, bukan hafalan teks.

### C. Clement & Brown Grounding Router (Untuk `bridging_understand`)
- **`experiential_anchor_bridge`**: prior knowledge kosong & *setup cost* <= 60 detik → wajib `anchoringLab` + `bridgingChain` + `analogyBreakpoint`.
- **`direct_analogy`**: pengalaman akrab sudah ada → wajib `physicalObject` + `analogyBreakpoint`.
- **`thought_experiment`**: melampaui skala/dimensi fisik → wajib `thoughtExperimentSteps` (>= 2 langkah).
- **`direct_formalism`**: aturan formal lebih cepat dipahami daripada membangun analogi (`hingeCheck` otomatis diletakkan **setelah** `mechanics` agar peserta melihat aturan inti & gambar sebelum dites).

### D. Komposisi Elastis Tanpa Batas Buatan (`Unbounded Composition, Bounded Attention`)
- **Bebas jumlahnya per modul (1..N)**: Jangan memaksakan bab padat ke 1 lab / 1 cek / 1 soal saja. Gunakan array opsional `additionalAnchoringLabs`, `additionalHingeChecks`, `additionalErroneousExamples`, `additionalStressTests`, beberapa `figures[]` (dapat memakai `stepId` spesifik atau beberapa gambar pembanding di satu langkah), serta `slideEndIndex` jika 1 tahap mencakup rentang beberapa slide (mis. Slide 2–4).
- **Tetap fokus per layar**: Pasangkan 1 ide inti dengan pendukung visual/interaksi kontekstualnya (Dual Coding); jika ada 2+ konsep atau simulasi berbeda, pisahkan ke langkah berurutan agar tidak terjadi *split-attention*.

---

## 5. Layer 3 & 4: Phase 2 Incremental Worker Loop (Extract-then-Author + Coverage Ratchet)

Jalankan loop ini secara iteratif (**1–2 bab per iterasi/sesi**) agar konteks tetap tajam, bebas *Lost-in-the-Middle*, dan terjaga kelengkapannya secara deterministik:

### Siklus Wajib per Bab (4 Tahap)
1. **Orientasi Awal (*Startup Bearings*)**:
   - Baca `HANDOFF.md`, `chapter-ledger.json`, dan `glossary-master.json`.
   - Ambil **hanya 1 bab** (atau 1–2 irisan terkait) yang masih berstatus `"pending"` lewat `flashlearn plan next --dir "./work/nama-kursus" --count 1`.
2. **Ekstrak Dulu, Baru Tulis (*Extract-then-Author*)**:
   - Baca **teks mentah bab** di `slices/*.md` secara langsung (jangan mengarang dari TOC atau memori).
   - Ekstrak daftar klaim atomik bab ke `claims/<chapterId>.keypoints.json` mencakup 6 kategori wajib:
     1. Definisi formal, hukum, & prinsip inti bab.
     2. Angka, rumus, matriks perbandingan, tabel peringkat bintang, & ambang batas.
     3. Studi kasus bernama & contoh nyata utama di buku.
     4. *Trade-off*, mode kegagalan (*failure modes*), & *antipattern*.
     5. Diagram / ilustrasi kunci beserta istilah di dalamnya.
     6. Pertanyaan evaluasi / *review questions* akhir bab (jika ada).
   - Ubah status bab di `chapter-ledger.json` menjadi `"extracted"`.
   - Susun `modules/<slug>.uila-v2.json` langsung berpatokan pada teks mentah + `claims/<chapterId>.keypoints.json`. Gunakan komponen elastis `1..N` (`additionalHingeChecks`, `additionalErroneousExamples`, `additionalStressTests`, `figures[]`) agar seluruh poin penting tertampung tanpa dipadatkan secara paksa. Ubah status menjadi `"authored"`.
3. **Audit Kelengkapan & Kesetiaan Sumber (*Key Point Recall + Faithfulness Ratchet*)**:
   - Hitung **`Key Point Recall`** = `keyPointsCovered / keyPointsTotal` terhadap `claims/<chapterId>.keypoints.json` dan catat poin yang belum masuk ke `missingPoints[]` (*Residual Fact Scan*).
   - Verifikasi **Faithfulness (*FActScore* / Groundedness)**: pastikan setiap angka, tabel, klaim, dan studi kasus benar-benar bersumber dari teks `slices/` bab tersebut (nol halusinasi).
   - **Aturan Ratchet (Anti-Pintasan)**:
     - Modul **DILARANG** dinaikkan ke status `"verified"` / `audited` atau di-push jika **`keyPointRecall < 0.85`** atau jika `missingPoints[]` masih menyisakan tabel inti, rumus, atau studi kasus utama bab.
     - **Dilarang menghapus item dari `claims/<chapterId>.keypoints.json`** demi meloloskan ambang batas secara artifisial. Jika ada poin terlewat, masukkan kembali ke draf modul (atau pecah menjadi modul tambahan `Bab XA` / `Bab XB`) lalu audit ulang hingga `>= 0.85`.
4. **Checkpoint, Push & Serah Terima Bersih**:
   ```bash
   # Validasi dry-run manifest & aset
   flashlearn plan push --dir "./work/nama-kursus" --module "<slug>" --upload-media --dry-run

   # Tandai audited hanya setelah Key Point Recall >= 0.85 lulus
   flashlearn plan mark --dir "./work/nama-kursus" --module "<slug>" --state audited

   # Push ke produksi (create/update workspace, unit/domain, modul, slide deck, & media)
   flashlearn plan push --dir "./work/nama-kursus" --module "<slug>" --upload-media
   ```
   - Perbarui `chapter-ledger.json` (`status: "published"`, `keyPointRecall`, `missingPoints: []`) dan tulis ringkasan progres + bab berikutnya di `HANDOFF.md` sebelum lanjut ke bab selanjutnya atau menutup sesi.
   - *(Opsional Slide Deck)*: Jika `needsSlideDeck: true`, buat deck HTML eksternal dengan `guizang-ppt-skill` ke `decks/<slug>.html`, set `<html lang="id" data-ui-lang="id">`, isi `window.__SPEAKER_NOTES__`, dan petakan `slideIndex` / `slideEndIndex`.

### Manajemen Remote CRUD Penuh di Produksi (Dari PC Mana Pun)
```bash
# Bandingkan plan lokal vs server produksi (new / modified / in_sync / remote_only)
flashlearn plan diff --dir "./work/nama-kursus"

# Hapus modul di produksi yang sudah dihapus dari plan lokal (cek dry-run dulu)
flashlearn plan prune --dir "./work/nama-kursus" --dry-run
flashlearn plan prune --dir "./work/nama-kursus" --yes

# Operasi CRUD satuan langsung ke server produksi
flashlearn workspace update <ws-id> --name "Judul Baru" --description "Deskripsi baru"
flashlearn content update <content-id> --manifest ./modules/<slug>.uila-v2.json --title "Judul Baru"
flashlearn content upload-artifact <content-id> --kind slide_deck_html --file ./decks/<slug>.html --upload-media
flashlearn content delete-artifact <content-id> --kind slide_deck_html --yes
flashlearn content delete <content-id> --yes
flashlearn content restore <content-id>
flashlearn content rollback <content-id> --version 1
```
