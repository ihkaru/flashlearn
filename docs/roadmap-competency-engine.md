# 🗺️ Roadmap Implementasi: Competency & Oracle Verification Engine
**Proyek:** FlashLearn Monorepo  
**Standar Arsitektur:** Hexagonal Architecture (Ports & Adapters) + ATA iSpec 2200  
**Status Implementasi:** ✅ Fase 01–10 Selesai & Terverifikasi Penuh (32/32 Automated Tests Pass across 10 Phases)  
**Dokumen Terkait:** [GEMINI.md](../GEMINI.md), [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md)

---

## 🎯 Visi & Transformasi Inti

Mengubah FlashLearn dari platform konten sekuensial (Materi, Kuis, Flashcard) menjadi **Mesin Otorisasi Kompetensi Terverifikasi** untuk domain umum (contoh: Pengadaan Barang/Jasa Pemerintah / Procurement, Pemeliharaan Avionik Pesawat ATA 104, Regulasi Keuangan).

```
[MODEL LAMA] : Workspace -> Content (Materi / Quiz) -> Submission -> Skor %
[MODEL BARU] : Domain Blueprint -> Source (Corpus) -> Competency DAG -> Task (Oracle A/B/C) -> Mastery Ledger -> Gate Wewenang (Passport) -> Background Daemon
```

---

## 📋 Fase Implementasi Bernomor (Numbered Phases)

### 📌 Fase 01: Corpus of Record & Deterministic Citation Engine [SELESAI ✅]
**Tujuan:** Memastikan setiap materi dan klaim edukasi bertumpu pada dokumen hukum/SOP resmi yang beralamat (*addressable chunks*), bukan halusinasi model.
* **Komponen:** `sources`, `source_chunks`, `IngestSourceUseCase`, `CitationValidatorService`.
* **Kriteria:** `tests/phase01.test.ts` lulus 100% pada variasi sitasi valid vs fiktif.

---

### 📌 Fase 02: Peta Graf Kompetensi (DAG) & Mastery Ledger [SELESAI ✅]
**Tujuan:** Mengorganisir silabus bukan sebagai daftar bab linear, melainkan Directed Acyclic Graph (DAG) prasyarat dengan rekam jejak penguasaan individu.
* **Komponen:** `competencies`, `competency_edges`, `mastery_records`, `CompetencyGraphEngine` (DFS cycle detection), `ApproveCompetencyUseCase`.
* **Kriteria:** `tests/phase02.test.ts` membuktikan dependensi melingkar ditolak seketika dan pembukaan node berjalan deterministik.

---

### 📌 Fase 03: Task Bank & Multi-Tier Oracle Evaluation Engine [SELESAI ✅]
**Tujuan:** Menggantikan kuis pilihan ganda biasa dengan tugas nyata dan evaluasi multi-tier (Kelas A deterministik, Kelas B kasus pembanding dengan Negative Anchors / Traps).
* **Komponen:** `tasks`, `attempts`, `OracleEvaluatorClassA` (rumus & checklist), `OracleEvaluatorClassB` (LLM-as-a-judge dengan CoT RCAF & negative anchors), remediasi 3D flashcard.
* **Kriteria:** `tests/phase03.test.ts` lulus 100% pada verifikasi numerik dan deteksi jebakan fatal.

---

### 📌 Fase 04: Progressive Authorization Gates & Reviewer Manusia [SELESAI ✅]
**Tujuan:** Memberikan wewenang tanggung jawab nyata secara bertingkat (Level 0–3) dengan mekanisme persetujuan manusia untuk area berisiko tinggi.
* **Komponen:** `gates`, `gate_requirements`, `user_gate_grants`, `ReviewClassCAttemptUseCase`, larangan *self-assessment*, penegakan Invarian 4 (hanya pakar manusia berhak mengesahkan Level 3).
* **Kriteria:** `tests/phase04.test.ts` membuktikan larangan swa-nilai dan pembukaan paspor setelah sign-off pakar.

---

### 📌 Fase 05: Deteksi Kedaluwarsa (Staleness Engine) & Pengulangan Berjarak [SELESAI ✅]
**Tujuan:** Memastikan sertifikasi kompetensi tidak membusuk saat regulasi berubah dan menjaga retensi peserta via SM-2.
* **Komponen:** `ReactiveStalenessEngine`, algoritma SuperMemo SM-2 (`practiceFlashcard`), auto-suspension paspor wewenang saat sumber ditandai `superseded`.
* **Kriteria:** `tests/phase05.test.ts` lulus 100%.

---

### 📌 Fase 06: Grounded Socratic AI Tutor & In-Task Guided Reasoning [SELESAI ✅]
**Tujuan:** Membimbing peserta yang kesulitan tanpa pernah membocorkan kunci jawaban atau formula rahasia (*Oracle Anti-Spoiler Shield*).
* **Komponen:** `AskSocraticTutorUseCase`, `SocraticTutorDrawer.svelte`, `POST /api/v1/tasks/:id/socratic-hint`.
* **Kriteria:** `tests/phase06.test.ts` memverifikasi panduan Sokrates berpagar rujukan pasal tanpa membocorkan formula atau nama jebakan.

---

### 📌 Fase 07: Immutable Audit Trail (D8) & Regulatory Compliance Exporter [SELESAI ✅]
**Tujuan:** Memungkinkan auditor eksternal mengunduh bukti kepatuhan regulasi terdesentralisasi dengan integritas kriptografis tamper-evident.
* **Komponen:** `ExportAuditBundleUseCase`, `audit.controller.ts`, tabel `audit_logs` (D8), verifikasi SHA-256 hash chaining.
* **Kriteria:** `tests/phase07.test.ts` membuktikan pendeteksian manipulasi rekaman secara deterministik.

---

### 📌 Fase 08: Digital Authority Passport & Public Verification Portal [SELESAI ✅]
**Tujuan:** Membuka portal verifikasi paspor wewenang publik tanpa login bagi pimpinan/auditor luar untuk mengecek status lisensi peserta.
* **Komponen:** `VerifyPublicPassportUseCase`, `gate.controller.ts` (`GET /api/v1/gates/verify/:grantId`), `verify-passport.svelte` di `/verify/:id`.
* **Kriteria:** `tests/phase08.test.ts` membuktikan verifikasi aktif, tampilan alasan suspensi, dan penolakan ID palsu.

---

### 📌 Fase 09: Universal Domain Blueprint Importer (Zero Hardcoding Enforcer) [SELESAI ✅]
**Tujuan:** Menjamin sistem 100% netral domain tanpa hardcoding, dapat memuat domain apa pun (contoh: Boeing 737 ATA 104 Level III Avionics).
* **Komponen:** `DomainBlueprint` schema, `ImportDomainBlueprintUseCase`, `POST /api/v1/workspaces/import-blueprint`.
* **Kriteria:** `tests/phase09.test.ts` mengimpor domain avionik lengkap dengan chunk hash, DAG competencies, cycle validation, dan tugas kalibrasi pitot-static secara otomatis.

---

### 📌 Fase 10: Standalone Background Worker Daemon & Production Pipeline [SELESAI ✅]
**Tujuan:** Menjalankan pemeliharaan kedaluwarsa regulasi di latar belakang tanpa memblokir thread HTTP server.
* **Komponen:** `apps/api/src/worker.ts`, script CLI `bun run worker` & `bun run worker:once`, penanganan graceful signal SIGINT/SIGTERM, integrasi advisory lock PostgreSQL `84920384`.
* **Kriteria:** `tests/phase10.test.ts` membuktikan siklus monitor background berjalan bersih tanpa kebocoran interval.

---

## 🛠️ Hubungan Antar Modul Monorepo

```
packages/shared/src/
├── types/
│   ├── source.ts          # Interface Source & Addressable Chunks
│   ├── competency.ts      # DAG Nodes & Edges
│   ├── task.ts            # Task Definition, Oracle Classes (A, B, C) & Socratic Hints
│   ├── gate.ts            # Authorization Gate Levels & Public Passport
│   ├── audit.ts           # Audit Trail & Tamper-Evident Bundle
│   └── workspace.ts       # Domain Blueprint Importer Schemas

apps/api/src/
├── domain/ports/          # Repository & Validator Interfaces
├── application/use-cases/ # IngestSource, ValidateCitations, EvaluateAttempt, UnlockGate, SocraticTutor, ExportAudit, BlueprintImporter
├── infrastructure/        # Drizzle Tables, Deterministik Runners, AI Adapters, Controllers
└── worker.ts              # Background Daemon Service

apps/web/src/
├── pages/
│   ├── competency-graph/  # Tampilan visual pohon belajar & prasyarat
│   ├── reviewer-queue/    # Antarmuka pakar menilai Kelas C
│   └── verify-passport    # Verifikasi publik paspor wewenang kerja
└── components/competency/
    ├── TaskExecutionForm  # Form pengerjaan tugas ber-oracle
    └── SocraticTutorDrawer# Drawer asisten Sokrates anti-spoiler
```
