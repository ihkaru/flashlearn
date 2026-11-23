---
name: flashlearn-curriculum-pipeline
description: Self-contained elastic 4-layer CLI curriculum compiler for FlashLearn (2-minute simple topics to 600+ page multi-book PDF/EPUB/PPTX courses). Combines 15 curated pedagogies (CC BY-SA 4.0), Clement & Brown Bridging Analogies, lossless university-lecture unit slicing (<= 2h/unit), resumable multi-session Coding Agent handoff plans (`flashlearn plan`), cross-PC remote CRUD (`push/diff/prune/pull`), external visual HTML decks (e.g. guizang-ppt-skill AGPL-3.0), and MediaVault uploads.
---

# FlashLearn Adaptive Elastic Curriculum Pipeline v2 (`flashlearn-curriculum-pipeline`)

Gunakan skill ini untuk menyusun, memperbarui, maupun mengelola materi pembelajaran di FlashLearn — mulai dari **topik sederhana 2–3 menit** hingga **kompilasi 2–3 ebook PDF / EPUB / PPTX (600+ halaman)** — secara **100% lintas PC melalui HTTP CLI** (`flashlearn`) tanpa akses database lokal maupun Tailscale.

---

## 1. Invarian Utama (Wajib Ditegakkan)

1. **Zero Lossy Summarization (Pemecahan Lossless ala Kuliah)**:
   - Jangan memangkas detail, kasus tepi, bukti, tabel penting, atau sub-mekanisme dari buku panjang.
   - Pecah secara *lossless* menjadi **Unit Pertemuan Kuliah** berdurasi maksimal **<= 120 menit (<= 2 jam)** (target ideal **45–90 menit**), dan pecah tiap Unit menjadi **modul sesi 4–15 menit** agar pembelajar bisa berhenti dan melanjutkan kapan saja.
   - Pastikan `curriculum-plan.json` memiliki **`coverage.unmappedSliceIds = []`** (100% irisan buku tercakup).
2. **Elastisitas Skala & Multi-Sesi Coding Agent**:
   - **Skala S** (1 artikel / topik / <= 15 hal): 1 sesi langsung (`import-interactive`), profil `micro_know` atau `bridging_understand`.
   - **Skala M** (1 paper / SOP / 16–100 hal): 1–2 sesi memakai `flashlearn plan` (1–3 Unit Kuliah).
   - **Skala L** (2–3 ebook PDF/EPUB/PPTX, 100–600+ hal): **WAJIB Multi-Sesi** via `flashlearn plan init` → `plan next --count 2` (konteks agen tetap < 15k token!) → author & audit batch 2–3 modul → `plan push` → serah terima bersih lewat `HANDOFF.md` & `glossary-master.json` untuk Coding Agent berikutnya.
3. **Invarian Anti-Istilah Mendadak & Aturan Contoh Akrab (*Zero Unexplained Jargon & Familiar Example First*)**:
   - **Dilarang Memunculkan Istilah/Akronim Tanpa Penjelasan (di SELURUH Blok 1–5 & Slide)**: Setiap istilah teknis, istilah asing, akronim (mis. `TLO`, `FDA`, `LTV`, `COCA`, `NURBS`, `kurva-J`, `ekuitas`), atau nama lembaga yang belum diperkenalkan di modul sebelumnya **WAJIB** dijelaskan singkat dalam bahasa Indonesia sederhana pada kemunculan pertamanya (*inline plain-language gloss*) **DAN** dimasukkan ke `glossary` lengkap dengan `highSchoolAnchor`.
   - **Contoh Harus Akrab dengan Pembelajar**: Fungsi contoh/padanan adalah mempermudah pemahaman menggunakan hal yang **sudah dikenal pembelajar**. Jangan menjatuhkan contoh/merek asing secara mendadak (mis. sekadar menulis *"seperti Zipcar dengan keyless-entry dan collaborative consumption"* atau *"Sega Dreamcast"* di dalam kurung) karena justru menambah kebingungan baru.
   - **Urutan Wajib Saat Mengadaptasi Buku Asing secara Lossless**: (a) Gunakan **contoh akrab pembelajar** terlebih dulu sebagai jangkar pemahaman utama (mis. layanan ojek/sewa kendaraan lewat aplikasi, warung lokal vs jaringan nasional, izin BPOM), lalu (b) jika studi kasus asli buku (`Zipcar`, `SensAble`, `Xerox PARC`, dll.) tetap disertakan agar *lossless*, perkenalkan konteksnya secara utuh dalam 1 kalimat sederhana beserta padanan akrabnya.
4. **Batas Lisensi & Isolasi Arsitektur**:
   - **FlashLearn Core, UILA v2, CLI PDF (`unpdf`) & EPUB/PPTX (`fflate`)**: MIT (lintas OS Windows/macOS/Linux/Termux, nol Poppler wajib, nol AGPL).
   - **15 Prinsip Pedagogi Terkurasi** *(diadaptasi dari `GarethManning/education-agent-skills`, CC BY-SA 4.0)*: dirangkum mandiri di Layer 2 dengan atribusi eksplisit.
   - **Visual Slide Deck Eksternal** *(mis. `guizang-ppt-skill`, GNU AGPL-3.0)*: wajib dijalankan di luar repositori FlashLearn saat authoring; output HTML diunggah sebagai data (`content_artifacts`) dan diputar terisolasi dalam `<iframe sandbox="allow-scripts">`. **Dilarang menyalin kode AGPL ke dalam repo FlashLearn.**

---

## 2. Konfigurasi CLI Lintas PC (Hanya Base URL & API Key)

Seluruh operasi *create, update, push, delete, restore, rollback, diff, prune, pull* berjalan murni lewat HTTP API menggunakan konfigurasi CLI dengan urutan prioritas **Flag (`--base-url`, `--api-key`) > Environment (`FLASHLEARN_BASE_URL`, `FLASHLEARN_API_KEY` / `FLASHLEARN_SUPERADMIN_API_KEY`) > File Lokal (`~/.flashlearn/config.json`, `chmod 600`)**.

```bash
# 1. Set sekali di PC mana pun (Windows / macOS / Linux / Termux)
flashlearn config set --base-url https://learn.dvlpid.my.id --api-key "<fl_live_...>"
flashlearn auth whoami

# Atau jalankan dengan injeksi secret manager (tanpa menyimpan key di disk)
# env: FLASHLEARN_BASE_URL + FLASHLEARN_SUPERADMIN_API_KEY
flashlearn auth whoami
```

---

## 3. Layer 1: Ekstraksi Multi-Format Lossless & Pembuatan Rencana Kerja

```bash
# Indeks 1 atau banyak buku (PDF + EPUB + PPTX + MD) & buat rencana kuliah <= 2 jam/unit
flashlearn plan init \
  --input "./books/ebook1.pdf,./books/ebook2.epub,./books/slides.pptx" \
  --dir "./work/nama-kursus" \
  --title "Judul Mata Kuliah / Topik" \
  --max-unit-minutes 90 \
  --decks selective

# Cek cakupan lossless (unmappedSliceIds harus 0) & status seluruh Unit
flashlearn plan status --dir "./work/nama-kursus"
```

- Jika ada halaman PDF bertanda `needsVlmTriage: true` (halaman scan/diagram padat) atau diagram/grafik/formulir penting di PDF/EPUB/PPTX, gunakan skill pendamping **`flashlearn-figure-extractor`** (Layer 1.5) untuk mengekstrak gambar tertanam secara *lossless* maupun *auto-crop* diagram vektor ke format WebP di `./assets/`, lalu tempelkan ke `payload.figures[]` lengkap dengan `caption`, `altText`, `sourcePage`, dan `annotations` (penjelasan istilah asing pada gambar).
- Saat menjalankan `flashlearn plan push --upload-media` (atau `flashlearn asset upload`), gambar lokal otomatis diunggah ke **endpoint persisten bawaan FlashLearn** (`/api/v1/workspaces/:id/assets`, deduplikasi `sha256`, tanpa perlu server MediaVault eksternal; MediaVault eksternal bersifat opsional via `--mediavault-url`).
- Untuk melanjutkan pengerjaan dari **PC lain** atas workspace yang sudah ada di produksi:
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
5. **Cognitive Load Analysis**: satu konsep inti per modul; prompt Block 5 target <= 50 kata.
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
- **Bebas jumlahnya per modul (1..N)**: Jangan memaksakan materi padat ke 1 lab / 1 cek / 1 soal saja. Gunakan array opsional `additionalAnchoringLabs`, `additionalHingeChecks`, `additionalErroneousExamples`, `additionalStressTests`, beberapa `figures[]` (dapat memakai `stepId` spesifik atau beberapa gambar pembanding di satu langkah), serta `slideEndIndex` jika 1 tahap mencakup rentang beberapa slide (mis. Slide 2–4).
- **Tetap fokus per layar**: Pasangkan 1 ide inti dengan pendukung visual/interaksi kontekstualnya (Dual Coding); jika ada 2+ konsep atau simulasi berbeda, pisahkan ke langkah berurutan agar tidak terjadi *split-attention*.

---

## 5. Layer 3 & 4: Loop Multi-Sesi Coding Agent + Remote Full CRUD

Jalankan loop ini berulang antar sesi (2–3 modul per sesi agar fokus & kualitas maksimal):

```bash
# 1. Ambil paket kerja ramping (<15k token) + glossary yang sudah diajarkan
flashlearn plan next --dir "./work/nama-kursus" --count 2

# 2. Tulis manifest `modules/<slug>.uila-v2.json`
#    (Jika `needsSlideDeck: true`, buat deck HTML eksternal dgn guizang-ppt-skill ke `decks/<slug>.html`,
#     set `<html lang="id" data-ui-lang="id">`, isi `window.__SPEAKER_NOTES__`, dan petakan `slideIndex` 1:1)

# 3. Validasi dry-run & tandai checkpoint
flashlearn plan push --dir "./work/nama-kursus" --module "<slug>" --upload-media --dry-run
flashlearn plan mark --dir "./work/nama-kursus" --module "<slug>" --state audited

# 4. Push ke produksi (create/update workspace, unit/domain, modul, slide deck, & media)
flashlearn plan push --dir "./work/nama-kursus" --module "<slug>" --upload-media
```

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
