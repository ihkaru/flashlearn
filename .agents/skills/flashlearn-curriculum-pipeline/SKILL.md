---
name: flashlearn-curriculum-pipeline
description: Self-contained 4-layer CLI curriculum compiler for FlashLearn. Transforms reference PDFs, papers, or SOPs into deep interactive learning modules combining curated pedagogy (CC BY-SA 4.0), Clement & Brown Bridging Analogies (Anchoring Micro-Lab -> Bridging Chain -> Analogy Breakpoint + Setup-Cost Router), HGD UILA v2 bundles (MIT), external visual HTML slide decks (e.g. guizang-ppt-skill under AGPL-3.0), MediaVault media uploads, and CLI-only ingestion into FlashLearn's guided Portrait/Landscape learner UX.
---

# FlashLearn 4-Layer Accelerated Comprehension Pipeline (`flashlearn-curriculum-pipeline`)

Gunakan skill ini saat menyusun materi pembelajaran mendalam dari PDF referensi, buku teks, paper, atau SOP langsung ke FlashLearn melalui **CLI-only admin workflow** (`flashlearn content import-interactive` atau `flashlearn domain import-curriculum`).

Tujuannya adalah **mempercepat pemahaman manusia** tanpa dinding teori pasif dan tanpa membuat antarmuka pembelajar ramai atau membingungkan.

---

## Batas Lisensi & Isolasi Arsitektur (Wajib)

| Komponen | Lisensi | Aturan Integrasi |
| :--- | :--- | :--- |
| FlashLearn Core + UILA v2 Types & Viewer (`packages/shared`, `apps/web`) | MIT | Tertanam langsung di repositori FlashLearn. |
| 8 Prinsip Pedagogi Terkurasi (diadaptasi dari `GarethManning/education-agent-skills`) | CC BY-SA 4.0 | Dirangkum mandiri di Layer 2 di bawah dengan atribusi eksplisit. |
| Visual Slide Deck Authoring (mis. `guizang-ppt-skill` fork `ihkaru` dengan i18n `id`/`en`/`zh`) | GNU AGPL-3.0 | **Wajib dijalankan secara eksternal di tahap authoring CLI**. Hasil HTML diunggah sebagai artefak data ke FlashLearn (`content_artifacts`) dan diputar generik di `<iframe sandbox="allow-scripts">` tanpa `allow-same-origin`. **Dilarang menyalin template/runtime AGPL ke dalam kode sumber repositori FlashLearn.** |

---

## Layer 1: Ekstraksi Korpus PDF Presisi Tinggi

1. Ekstrak PDF/gambar referensi ke Markdown terstruktur (tabel kompleks, persamaan, diagram terjaga) menggunakan ekstraktor VLM (`agy-doc-extract <input.pdf> -o ./work/corpus/`) atau parser dokumen pilihanmu.
2. Pertahankan rujukan verbatim (`sourceRef` + `locationTag`: Bab / Halaman / Pasal) agar setiap klaim materi & glosarium memiliki sumber asli (*Corpus of Record*).
3. Simpan aset gambar slide/diagram di folder `./work/ppt/images/` dengan pola `{slideNumber}-{slug}.{png|jpg}`. Saat unggah CLI dengan `--upload-media`, gambar otomatis diunggah ke MediaVault (`MEDIAVAULT_URL`) dan path relatif diubah ke URL HTTPS.

---

## Layer 2: Perencanaan Pedagogi Mandiri (8 Prinsip Terkurasi + Clement–Brown Router)

### A. 8 Prinsip Pedagogi Terkurasi *(diadaptasi dari GarethManning/education-agent-skills, CC BY-SA 4.0)*
Sebelum menulis konten atau slide, rancang kerangka belajar memakai 8 lensa ini secara berurutan:
1. **Backwards Design (`backwards-design-unit-planner`)**: Mulai dari kemampuan transfer akhir yang ingin dibuktikan peserta (Block 5 & Tugas Gate), baru tarik mundur prasyarat DAG dan aktivitas belajarnya.
2. **Mental Model Mapping (`mental-model-mapper`)**: Identifikasi asumsi awam dan miskonsepsi paling sering sebelum menulis penjelasan.
3. **Cognitive Load Analysis (`cognitive-load-analyser`)**: Pisahkan beban intrinsik vs ekstraneus; pecah dua mekanisme berbeda ke dua modul terpisah; batasi prompt pertanyaan Block 5 maksimal ~50 kata.
4. **Concrete-Pictorial-Abstract (`cpa-sequence-designer`)**: Alirkan pemahaman dari pengalaman konkret -> representasi visual/diagram -> simbol formal (jangan pernah membalik urutan ini bagi pemula).
5. **Dual Coding (`dual-coding-designer`)**: Pasangkan slide visual/diagram yang ringkas dengan penjelasan verbal/catatan yang saling melengkapi (jangan menyalin teks slide mentah-mentah ke catatan).
6. **Variation Theory (`variation-theory-task-designer`)**: Gunakan kontras (*Pemula Keliru* vs *Realitas Mekanis*) di Block 3 agar peserta membedakan ciri kritis suatu konsep dari detail permukaan.
7. **Worked Example with Completion Fading (`worked-example-fading-designer`)**: Sajikan 1 contoh terbedah singkat di Block 4 sebelum peserta berlatih mandiri di FlashLearn Sandbox & Gate Exam.
8. **Transfer Bridge (`transfer-bridge`)**: Rancang soal Block 5 sebagai prediksi kausal pada situasi baru (*near/far transfer*), bukan hafalan definisi teks.

### B. Clement & Brown Grounding Strategy Router (Wajib di Setiap Modul)
Jangan memaksakan analogi atau simulasi untuk semua konsep. Tentukan **tepat satu** `uila.groundingDecision.mode` untuk setiap modul:

| `groundingMode` | Kapan Dipilih | Kewajiban Struktur Payload (`InteractiveModulePayload`) |
| :--- | :--- | :--- |
| **`experiential_anchor_bridge`** | Prior knowledge **kosong** (`priorKnowledgeAssumed: "none"`), intuitif secara indrawi/sebab-akibat, **setup cost <= 60 detik**. | 1. **Fase Anchoring**: `block2_grounding.anchoringLab` interaktif (`state_machine_sandbox`, `mechanism_manipulator`, `wave_field_tapper`, `bridge_morph_slider`, atau HTML micro-sim terisolasi).<br>2. **Fase Bridging**: `bridgingChain` (pemetaan elemen jangkar -> konsep inti, boleh multi-tahap jika lompatannya jauh).<br>3. **Wajib `analogyBreakpoint`**: jelaskan di mana analogi berhenti berlaku + mekanisme nyatanya. |
| **`direct_analogy`** | Peserta **sudah punya pengalaman harian** yang sepadan (`familiar` / `partial`). | `physicalObject` + `isomorphicMapping` + **wajib `analogyBreakpoint`** (tanpa perlu membangun simulasi berat). |
| **`thought_experiment`** | **Batas skala/dimensi** melampaui simulasi fisik (4D, relativitas, konsensus jutaan node). | `thoughtExperimentSteps` (>= 2 langkah bertahap) + `analogyBreakpoint` (jika memakai metafora seperti Jenderal Bizantium). |
| **`direct_formalism`** | **Setup cost simulasi/analogi > belajar aturan langsung** (aturan formal 5 menit, formula langsung, sintaks kontrak). | Lewati analogi paksaan; fokus pada `block1_anomaly` -> `block3_coreMechanics` (Contrasting Cases) -> `block4_notationContract` (Worked Example). |

---

## Layer 3: Sintesis Dual-Artifact & Gerbang Audit Pra-Unggah

### Artefak A — Manifest Interaktif UILA v2 (`uila-v2.json`)
Susun JSON sesuai kontrak `InteractiveModulePayload` di `packages/shared/src/types/interactive.ts`:
- `schemaVersion: "uila-v2"`, `estimatedMinutes`, `learningObjective`.
- `uila.groundingDecision` + `block1_anomaly` + `block2_grounding` + `block3_coreMechanics` + `block4_notationContract` + `block5_stressTest` (>= 3 opsi, tepat 1 `isCorrect: true`, setiap distraktor memiliki `diagnosticAxis` + `causalRationale`, plus 4 tingkat `hintLadder`).
- Opsional `glossary` (dengan `highSchoolAnchor` setingkat SMA) dan `sourceCitations` (kutipan verbatim dari Layer 1).
- Seluruh entitas/simbol di `block5_stressTest` wajib sudah diperkenalkan di Blok 1–4 (*Zero Orphan Probe Entity*).

### Artefak B — Visual Slide Deck HTML (Eksternal, mis. `guizang-ppt-skill`)
Jika modul dilengkapi deck visual (disarankan 4–10 slide yang sinkron dengan `slideIndex` tiap langkah):
1. Bangun deck secara eksternal memakai `guizang-ppt-skill` (Style B Swiss Internationalist untuk STEM/teknik/data; Style A Magazine untuk humaniora/strategi).
2. Set bahasa Indonesia (`<html lang="id" data-ui-lang="id">`) dan isi `SPEAKER_NOTES` (`window.__SPEAKER_NOTES__`) sesuai urutan `data-slide-id`.
3. Validasi eksternal sebelum impor:
   - `node <guizang-skill-dir>/scripts/validate-presenter-mode.mjs ./work/ppt/index.html`
   - `node <guizang-skill-dir>/scripts/validate-swiss-deck.mjs ./work/ppt/index.html` *(khusus Style B Swiss)*
4. FlashLearn akan otomatis membungkus HTML saat render dengan bridge MIT aman (`buildSandboxedDeckHtml`), menyetel `low-power` di HP, menskalakan 1280x720 secara proporsional 16:9 di Portrait/Landscape, dan membaca `window.__SPEAKER_NOTES__` ke tombol **Catatan**.

---

## Layer 4: Ingesti CLI-Only ke FlashLearn (Idempoten & Non-Interaktif)

### Konfigurasi Base URL & API Key CLI (Infisical atau Lokal)
CLI membaca konfigurasi dengan urutan prioritas: **Flag (`--base-url` / `--api-url`, `--api-key`) > Environment (`FLASHLEARN_BASE_URL` / `FLASHLEARN_API_URL`, `FLASHLEARN_API_KEY` / `FLASHLEARN_SUPERADMIN_API_KEY`) > File Lokal (`~/.flashlearn/config.json`, `chmod 600`)**.

```bash
# Simpan base URL & API key lokal sekali jalan
flashlearn config set --base-url https://learn.dvlpid.my.id --api-key "$FLASHLEARN_SUPERADMIN_API_KEY"
flashlearn config get
flashlearn auth whoami

# Atau jalankan langsung dengan injeksi environment (mis. via secret manager)
# env: FLASHLEARN_BASE_URL + FLASHLEARN_API_KEY (atau FLASHLEARN_SUPERADMIN_API_KEY)
flashlearn auth whoami
```

### Opsi 1 — Impor 1 Modul Interaktif (Idempoten via `--slug`)
```bash
# 1. Dry-run: validasi UILA v2, Clement-Brown router, audit keamanan HTML, & cek aset gambar
bun run cli content import-interactive \
  --workspace-id <WORKSPACE_UUID> \
  --title "Judul Modul Mendalam" \
  --slug "judul-modul-stabil" \
  --manifest ./work/uila-v2.json \
  --deck ./work/ppt/index.html \
  --upload-media \
  --dry-run

# 2. Unggah permanen ke FlashLearn (otomatis create atau update jika slug sudah ada)
bun run cli content import-interactive \
  --workspace-id <WORKSPACE_UUID> \
  --title "Judul Modul Mendalam" \
  --slug "judul-modul-stabil" \
  --manifest ./work/uila-v2.json \
  --deck ./work/ppt/index.html \
  --upload-media
```

### Opsi 2 — Ganti / Unggah Slide Deck Saja pada Modul yang Sudah Ada
```bash
bun run cli content upload-artifact <CONTENT_UUID> \
  --kind slide_deck_html \
  --file ./work/ppt/index.html \
  --upload-media \
  --dry-run

bun run cli content upload-artifact <CONTENT_UUID> \
  --kind slide_deck_html \
  --file ./work/ppt/index.html \
  --upload-media
```

### Opsi 3 — Impor Paket Kurikulum Atomik (Blueprint + Banyak Modul)
Siapkan `curriculum-package.json` (contoh lengkap di `docs/samples/bridging-mastery-package/`):
```bash
bun run cli domain import-curriculum --dir ./work/compiled-package --upload-media --dry-run
bun run cli domain import-curriculum --dir ./work/compiled-package --upload-media
```

---

## Invarian UX Pembelajar (Jangan Dilanggar Saat Authoring)
- **Satu Arahan Per Layar**: Tulis tiap blok ringkas, konkret, dan bebas jargon mendadak agar `InteractiveModuleViewer.svelte` tetap terasa tenang di layar HP.
- **Lanjutkan Kapan Saja**: Semua langkah, slide, simulasi, dan percobaan diagnostik tersimpan otomatis (login maupun guest) dan muncul di strip **"Lanjutkan Belajar"**.
- **Istilah & Rujukan Tidak Mengganggu**: Taruh definisi latar di `glossary` dan pasal/halaman PDF di `sourceCitations` agar tetap terlipat rapi sampai pembelajar mengetuknya.
