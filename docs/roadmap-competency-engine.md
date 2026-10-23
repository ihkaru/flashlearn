# 🗺️ Roadmap Implementasi: Competency & Oracle Verification Engine
**Proyek:** FlashLearn Monorepo  
**Standar Arsitektur:** Hexagonal Architecture (Ports & Adapters) + ATA iSpec 2200  
**Status Implementasi:** ✅ Fase 01–05 Selesai & Terverifikasi (22/22 Automated Tests Pass)  
**Dokumen Terkait:** [GEMINI.md](../GEMINI.md), [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md)

---

## 🎯 Visi & Transformasi Inti

Mengubah FlashLearn dari platform konten sekuensial (Materi, Kuis, Flashcard) menjadi **Mesin Otorisasi Kompetensi Terverifikasi** untuk domain umum (contoh: Pengadaan Barang/Jasa Pemerintah / Procurement).

```
[MODEL LAMA] : Workspace -> Content (Materi / Quiz) -> Submission -> Skor %
[MODEL BARU] : Domain -> Source (Corpus) -> Competency DAG -> Task (Oracle A/B/C) -> Mastery Ledger -> Gate Wewenang
```

---

## 📋 Fase Implementasi Bernomor (Numbered Phases)

### 📌 Fase 01: Corpus of Record & Deterministic Citation Engine [SELESAI ✅]
**Tujuan:** Memastikan setiap materi dan klaim edukasi bertumpu pada dokumen hukum/SOP resmi yang beralamat (*addressable chunks*), bukan halusinasi model.

* **Milestone 01.1 — Skema Database Sumber:**
  - Tambahkan tabel `sources` dan `source_chunks` di `apps/api/src/infrastructure/database/schema.ts`.
  - Simpan metadata: `workspaceId`, `code`, `version`, `status` (`active` | `superseded`), `owner`, `effectiveDate`.
  - Simpan potongan teks beralamat: `locationTag` (Pasal, Ayat, SOP No), `content`, `sha256Hash`.
* **Milestone 01.2 — Ingestion & Addressable Chunker:**
  - Buat use case `IngestSourceUseCase` di `apps/api/src/application/use-cases/source/`.
  - Parser Markdown/teks untuk memecah dokumen regulasi menjadi chunk terkunci per pasal/ayat.
* **Milestone 01.3 — Deterministic Citation Validator:**
  - Implementasikan `CitationValidatorService` di backend yang mengecek:
    1. Apakah `sourceCode` dan `locationTag` benar-benar ada di database `source_chunks`?
    2. Apakah teks kutipan (*verbatim quote*) cocok secara substring dengan naskah asli?
  - Ditolak otomatis secara deterministik jika sitasi tidak ditemukan atau tidak cocok.
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Unit test `tests/phase01.test.ts` lulus 100% pada variasi sitasi valid vs fiktif.
  - Endpoint API `POST /api/v1/sources` dan `POST /api/v1/sources/validate-citations` siap digunakan.

---

### 📌 Fase 02: Peta Graf Kompetensi (DAG) & Mastery Ledger [SELESAI ✅]
**Tujuan:** Mengorganisir silabus bukan sebagai daftar bab linear, melainkan Directed Acyclic Graph (DAG) prasyarat dengan rekam jejak penguasaan individu.

* **Milestone 02.1 — Skema Database Graf & Mastery:**
  - Tambahkan tabel `competencies`, `competency_edges`, dan `mastery_records`.
  - Dukung atribut `oracleClass` (`A`, `B`, `C`), `riskLevel` (`low`, `medium`, `high`), dan `isExpertApproved`.
* **Milestone 02.2 — Core Domain & Topological Prerequisite Engine:**
  - Implementasikan algoritma DFS Cycle Detection pada `CompetencyGraphEngine`.
  - Buat query evaluator: `evaluateLearnerProgression` untuk mengunci dan membuka node belajar berikutnya sesuai prasyarat.
* **Milestone 02.3 — Governance & Persetujuan Pakar:**
  - Implementasikan use case `ApproveCompetencyUseCase` yang mencatat identitas pakar sebelum silabus aktif.
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Test suite `tests/phase02.test.ts` membuktikan dependensi melingkar ditolak seketika dan pembukaan node berjalan deterministik.

---

### 📌 Fase 03: Task Bank & Multi-Tier Oracle Evaluation Engine [SELESAI ✅]
**Tujuan:** Menggantikan kuis pilihan ganda biasa dengan tugas nyata dan evaluasi multi-tier (Kelas A deterministik, Kelas B kasus pembanding).

* **Milestone 03.1 — Skema Bank Tugas & Hasil Percobaan:**
  - Tambahkan tabel `tasks` dan `attempts`.
  - Simpan rubrik terstruktur, passing score, dan tipe tugas (`calculation`, `case_study`, `checklist`).
* **Milestone 03.2 — Evaluator Oracle Kelas A (Deterministik):**
  - Implementasikan `OracleEvaluatorClassA` untuk memverifikasi hitungan (PPN 11%, batas laba 15%, checklist kelengkapan).
  - Menghasilkan 3D remediation flashcard jika perhitungan salah.
* **Milestone 03.3 — Evaluator Oracle Kelas B (AI Judge berbasis Rubrik & Negative Traps):**
  - Implementasikan `OracleEvaluatorClassB` menggunakan `AiGatewayService` (`router.dvlpid.my.id`).
  - Membandingkan analisis peserta dengan solusi emas dan mendeteksi jebakan fatal (*fatal traps / negative anchors*).
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Test suite `tests/phase03.test.ts` lulus 100% (Kelas A deterministik & Kelas B fatal trap detection).

---

### 📌 Fase 04: Progressive Authorization Gates & Reviewer Manusia [SELESAI ✅]
**Tujuan:** Memberikan wewenang tanggung jawab nyata secara bertingkat (Level 0–3) dengan mekanisme persetujuan manusia untuk area berisiko tinggi.

* **Milestone 04.1 — Skema & Aturan Gerbang Otorisasi:**
  - Tambahkan tabel `gates`, `gate_requirements`, dan `user_gate_grants`.
  - Definisi level wewenang:
    - **Level 0**: Observasi (Lulus dasar Kelas A).
    - **Level 1**: Kerja Dampingan / Review Penuh (Lulus tugas kasus Kelas B).
    - **Level 2**: Mandiri Ringan / Review Sampel.
    - **Level 3**: Mandiri Risiko Tinggi (Wajib persetujuan Kelas C oleh Pakar Manusia).
* **Milestone 04.2 — Reviewer Manusia Kelas C & Invarian 4:**
  - Implementasikan `ReviewClassCAttemptUseCase` dan antrean penelaahan pakar (`ListPendingClassCReviewsUseCase`).
  - Larangan swa-nilai (*self-assessment violation guard*): peserta dilarang menilai tugasnya sendiri.
  - Invarian 4: Kenaikan ke Level 3 mutlak ditolak jika hanya dinilai AI tanpa tanda tangan digital Pakar Manusia (`human_expert:...`).
* **Milestone 04.3 — Append-Only Audit Trail:**
  - Implementasikan tabel `audit_logs` untuk mencatat setiap keputusan kenaikan gerbang, ID penilai, timestamp, dan snapshot bukti.
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Test suite `tests/phase04.test.ts` lulus 100%.

---

### 📌 Fase 05: Deteksi Kedaluwarsa (Staleness Engine) & Pengulangan Berjarak [SELESAI ✅]
**Tujuan:** Memastikan sertifikasi kompetensi tidak membusuk saat regulasi berubah dan menjaga retensi peserta.

* **Milestone 05.1 — Reactive Staleness Invalidation:**
  - Ketika sebuah `Source` ditandai `superseded` (misal terbit Perpres revisi baru):
    1. Otomatis ubah `mastery_records` terkait menjadi `stale`.
    2. Tangguhkan paspor wewenang `user_gate_grants` yang terikat menjadi `provisional`.
    3. Catat audit trail `SOURCE_SUPERSEDED` dan `STALENESS_TRIGGERED`.
* **Milestone 05.2 — Spaced Repetition Flashcard Scheduler (SM-2):**
  - Algoritma jadwal pengulangan untuk aturan/formula kritis yang jarang dipakai tetapi berisiko fatal jika lupa.
  - Penyesuaian interval dinamis (1 hari -> 3 hari -> perkalian ease factor) dan reset saat blackout.
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Test suite `tests/phase05.test.ts` lulus 100%.

* **Milestone 02.3 — UI Visualizer Peta Kompetensi:**
  - Di `apps/web`: Buat halaman/komponen visualisasi graf kompetensi berbasis Framework7 & Svelte 5.
  - Tampilkan status node: `🔒 Locked`, `🟢 Ready`, `⚡ In Progress`, `🏆 Mastered`, `⚠️ Retest Required`.
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Prasyarat node tidak dapat dibuka jika node pendahulu belum berstatus `mastered`.
  - Visualizer graf menampilkan dependensi node dengan jelas di layar mobile dan desktop.

---

### 📌 Fase 03: Task Bank & Multi-Tier Oracle Evaluation Engine
**Tujuan:** Menggantikan kuis pilihan ganda statis dengan bank tugas nyata yang dinilai terhadap Oracle (Kelas A, B, C).

* **Milestone 03.1 — Skema Database Tasks & Attempts:**
  - Tambahkan tabel `tasks` (skenario, kunci oracle, kriteria rubrik) dan `attempts` (jawaban, bukti skor, penilai).
* **Milestone 03.2 — Kelas A: Runner Evaluasi Deterministik:**
  - Mesin penilai skrip untuk kalkulasi HPS (rumus HPS, PPN 11%, batas overhead/laba $\le 15\%$, checklist kelengkapan berkas).
  - Eksekusi instan tanpa campur tangan AI.
* **Milestone 03.3 — Kelas B: Komparator Kasus Lampau Terverifikasi:**
  - Pipeline evaluasi tugas berbasis kasus audit masa lalu.
  - Penilai menggunakan prompt *AI-as-a-Judge* terpisah (Verifier $\neq$ Generator) yang membandingkan penalaran peserta terhadap *Gold Reference Solution* dan rubrik matriks.
* **Milestone 03.4 — Integrasi Post-Task 3D Flashcard:**
  - Hubungkan tugas yang salah dengan engine 3D Flashcard FlashLearn untuk review poin-poin krusial yang gagal.
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Tugas Kelas A dinilai 100% deterministik dengan zero false-positive.
  - Tugas Kelas B memberikan umpan balik berbasis rubrik terukur dan mencatat bukti ke `attempts`.

---

### 📌 Fase 04: Progressive Authorization Gates & Reviewer Manusia
**Tujuan:** Memberikan wewenang tanggung jawab nyata secara bertingkat (Level 0–3) dengan mekanisme persetujuan manusia untuk area berisiko tinggi.

* **Milestone 04.1 — Skema & Aturan Gerbang Otorisasi:**
  - Tambahkan tabel `gates` dan `gate_requirements`.
  - Definisi level:
    - **Level 0**: Observasi (Lulus dasar Kelas A).
    - **Level 1**: Kerja Dampingan / Review Penuh (Lulus tugas kasus Kelas B).
    - **Level 2**: Mandiri Ringan / Review Sampel.
    - **Level 3**: Mandiri Risiko Tinggi (Wajib persetujuan Kelas C oleh Pakar Manusia).
* **Milestone 04.2 — Portal Reviewer Kelas C:**
  - Di `apps/web`: Antrean evaluasi khusus untuk pengguna berstatus `creator` / `reviewer`.
  - Pakar dapat meninjau dokumen analisis peserta, memberi catatan rubrik, dan menyahkan status `mastered`.
* **Milestone 04.3 — Append-Only Audit Trail:**
  - Implementasikan tabel `audit_logs` untuk mencatat setiap keputusan kenaikan gerbang, ID penilai, timestamp, dan snapshot bukti.
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Kenaikan ke Level 3 mutlak ditolak jika hanya dinilai oleh AI tanpa tanda tangan digital Pakar Manusia.
  - Log audit tidak dapat diubah (*append-only*).

---

### 📌 Fase 05: Deteksi Kedaluwarsa (Staleness Engine) & Pengulangan Berjarak
**Tujuan:** Memastikan sertifikasi kompetensi tidak membusuk saat regulasi berubah dan menjaga retensi peserta.

* **Milestone 05.1 — Reactive Staleness Invalidation:**
  - Ketika sebuah `Source` ditandai `superseded` (misal terbit Perpres baru):
    1. Otomatis tandai seluruh `Content` turunan menjadi `stale`.
    2. Ubah `mastery_records` terkait menjadi `retest_required`.
    3. Cabut sementara wewenang `Gate` yang terikat hingga peserta menyelesaikan modul pembaruan.
* **Milestone 05.2 — Spaced Repetition Flashcard Scheduler:**
  - Algoritma jadwal pengulangan untuk aturan/formula kritis yang jarang dipakai tetapi berisiko fatal jika lupa.
* **Kriteria Penerimaan (Acceptance Criteria):**
  - Simulasi revisi regulasi langsung memicu notifikasi pembaruan dan memblokir gerbang wewenang terkait secara otomatis.

---

## 🛠️ Hubungan Antar Modul Monorepo

```
packages/shared/src/
├── types/
│   ├── source.ts          # Interface Source & Addressable Chunks
│   ├── competency.ts      # DAG Nodes & Edges
│   ├── task.ts            # Task Definition & Oracle Classes (A, B, C)
│   ├── gate.ts            # Authorization Gate Levels
│   └── audit.ts           # Audit Trail Event Schemas

apps/api/src/
├── domain/ports/          # Repository & Validator Interfaces
├── application/use-cases/ # IngestSource, ValidateCitations, EvaluateAttempt, UnlockGate
└── infrastructure/        # Drizzle Tables, Deterministik Runners, AI Adapters

apps/web/src/
├── pages/
│   ├── competency-graph/  # Tampilan visual pohon belajar & prasyarat
│   ├── task-runner/       # Antarmuka pengerjaan kasus nyata & kalkulasi
│   ├── reviewer-queue/    # Antarmuka pakar menilai Kelas C
│   └── gate-passport/     # Sertifikat wewenang berbasis bukti
```
