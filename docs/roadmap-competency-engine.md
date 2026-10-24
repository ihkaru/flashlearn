# 🗺️ Roadmap Implementasi: Competency & Oracle Verification Engine
**Proyek:** FlashLearn Monorepo  
**Standar Arsitektur:** Hexagonal Architecture (Ports & Adapters) + ATA iSpec 2200 + Agent-First Specification (October 2026)  
**Status Implementasi:** ✅ Fase 01–16 Selesai & Terverifikasi Penuh (76/76 Automated Tests Pass across Monorepo)  
**Integrasi Terkini:** 🚀 Lumis In-App AI Chat Engine (`ihkaru/lumis`) & Bi-directional Socratic Bridge  
**Dokumen Terkait:** [GEMINI.md](../GEMINI.md), [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md), [AGENT.md](../AGENT.md)

---

## 🎯 Visi & Transformasi Inti

Mengubah FlashLearn dari platform konten sekuensial (Materi, Kuis, Flashcard) menjadi **Mesin Otorisasi Kompetensi Terverifikasi** untuk domain umum dengan perlindungan anti-spoiler, evaluasi oracle deterministik, verifikasi kriptografis, dan asisten percakapan cerdas (Lumis AI Chat).

```
[MODEL LAMA] : Workspace -> Content (Materi / Quiz) -> Submission -> Skor %
[MODEL BARU] : Domain Blueprint -> Source (Corpus) -> Competency DAG -> Task (Oracle A/B/C/Dilemma) 
               -> Mastery Ledger -> Gate Wewenang (Passport VC) -> Lumis AI Socratic Assistant
```

---

## 📋 Fase Implementasi Selesai (Phases 01–16)

### 📌 Fase 01: Corpus of Record & Deterministic Citation Engine [SELESAI ✅]
* **Tujuan:** Memastikan setiap materi dan klaim edukasi bertumpu pada dokumen hukum/SOP resmi yang beralamat (*addressable chunks*), bukan halusinasi model.
* **Komponen:** `sources`, `source_chunks`, `IngestSourceUseCase`, `CitationValidatorService`.
* **Kriteria:** `tests/phase01.test.ts` lulus 100% pada variasi sitasi valid vs fiktif.

### 📌 Fase 02: Peta Graf Kompetensi (DAG) & Mastery Ledger [SELESAI ✅]
* **Tujuan:** Mengorganisir silabus bukan sebagai daftar bab linear, melainkan Directed Acyclic Graph (DAG) prasyarat dengan rekam jejak penguasaan individu.
* **Komponen:** `competencies`, `competency_edges`, `mastery_records`, `CompetencyGraphEngine` (DFS cycle detection), `ApproveCompetencyUseCase`.
* **Kriteria:** `tests/phase02.test.ts` membuktikan dependensi melingkar ditolak seketika dan pembukaan node berjalan deterministik.

### 📌 Fase 03: Task Bank & Multi-Tier Oracle Evaluation Engine [SELESAI ✅]
* **Tujuan:** Menggantikan kuis pilihan ganda biasa dengan tugas nyata dan evaluasi multi-tier (Kelas A deterministik, Kelas B kasus pembanding dengan Negative Anchors / Traps).
* **Komponen:** `tasks`, `attempts`, `OracleEvaluatorClassA` (rumus & checklist), `OracleEvaluatorClassB` (LLM-as-a-judge dengan CoT RCAF & negative anchors), remediasi 3D flashcard.
* **Kriteria:** `tests/phase03.test.ts` lulus 100% pada verifikasi numerik dan deteksi jebakan fatal.

### 📌 Fase 04: Progressive Authorization Gates & Reviewer Manusia [SELESAI ✅]
* **Tujuan:** Memberikan wewenang tanggung jawab nyata secara bertingkat (Level 0–3) dengan mekanisme persetujuan manusia untuk area berisiko tinggi.
* **Komponen:** `gates`, `gate_requirements`, `user_gate_grants`, `ReviewClassCAttemptUseCase`, larangan *self-assessment*, penegakan Invarian 4 (hanya pakar manusia berhak mengesahkan Level 3).
* **Kriteria:** `tests/phase04.test.ts` membuktikan larangan swa-nilai dan pembukaan paspor setelah sign-off pakar.

### 📌 Fase 05: Deteksi Kedaluwarsa (Staleness Engine) & Pengulangan Berjarak [SELESAI ✅]
* **Tujuan:** Memastikan sertifikasi kompetensi tidak membusuk saat regulasi berubah dan menjaga retensi peserta via SM-2.
* **Komponen:** `ReactiveStalenessEngine`, algoritma SuperMemo SM-2 (`practiceFlashcard`), auto-suspension paspor wewenang saat sumber ditandai `superseded`.
* **Kriteria:** `tests/phase05.test.ts` lulus 100%.

### 📌 Fase 06: Grounded Socratic AI Tutor & In-Task Guided Reasoning [SELESAI ✅]
* **Tujuan:** Membimbing peserta yang kesulitan tanpa pernah membocorkan kunci jawaban atau formula rahasia (*Oracle Anti-Spoiler Shield*).
* **Komponen:** `AskSocraticTutorUseCase`, `SocraticTutorDrawer.svelte`, `POST /api/v1/tasks/:id/socratic-hint`.
* **Kriteria:** `tests/phase06.test.ts` memverifikasi panduan Sokrates berpagar rujukan pasal tanpa membocorkan formula atau nama jebakan.

### 📌 Fase 07: Immutable Audit Trail (D8) & Regulatory Compliance Exporter [SELESAI ✅]
* **Tujuan:** Memungkinkan auditor eksternal mengunduh bukti kepatuhan regulasi terdesentralisasi dengan integritas kriptografis tamper-evident.
* **Komponen:** `ExportAuditBundleUseCase`, `audit.controller.ts`, tabel `audit_logs` (D8), verifikasi SHA-256 hash chaining.
* **Kriteria:** `tests/phase07.test.ts` membuktikan pendeteksian manipulasi rekaman secara deterministik.

### 📌 Fase 08: Digital Authority Passport & Public Verification Portal [SELESAI ✅]
* **Tujuan:** Membuka portal verifikasi paspor wewenang publik tanpa login bagi pimpinan/auditor luar untuk mengecek status lisensi peserta.
* **Komponen:** `VerifyPublicPassportUseCase`, `gate.controller.ts` (`GET /api/v1/gates/verify/:grantId`), `verify-passport.svelte` di `/verify/:id`.
* **Kriteria:** `tests/phase08.test.ts` membuktikan verifikasi aktif, tampilan alasan suspensi, dan penolakan ID palsu.

### 📌 Fase 09: Universal Domain Blueprint Importer (Zero Hardcoding Enforcer) [SELESAI ✅]
* **Tujuan:** Menjamin sistem 100% netral domain tanpa hardcoding, dapat memuat domain apa pun (contoh: Boeing 737 ATA 104 Level III Avionics).
* **Komponen:** `DomainBlueprint` schema, `ImportDomainBlueprintUseCase`, `POST /api/v1/workspaces/import-blueprint`.
* **Kriteria:** `tests/phase09.test.ts` mengimpor domain avionik lengkap dengan chunk hash, DAG competencies, cycle validation, dan tugas kalibrasi pitot-static secara otomatis.

### 📌 Fase 10: Standalone Background Worker Daemon & Production Pipeline [SELESAI ✅]
* **Tujuan:** Menjalankan pemeliharaan kedaluwarsa regulasi di latar belakang tanpa memblokir thread HTTP server.
* **Komponen:** `apps/api/src/worker.ts`, script CLI `bun run worker` & `bun run worker:once`, penanganan graceful signal SIGINT/SIGTERM, integrasi advisory lock PostgreSQL `84920384`.
* **Kriteria:** `tests/phase10.test.ts` membuktikan siklus monitor background berjalan bersih tanpa kebocoran interval.

### 📌 Fase 11: Adversarial Dilemma & Stress Testing Engine [SELESAI ✅]
* **Tujuan:** Menguji ketahanan integritas peserta di bawah tekanan operasional (Situational Judgment Tests) dengan deteksi jebakan fatal dan pembuktian batas etika.
* **Komponen:** `TrapSensitivityIndex` ($\text{TSI}$), `BoundaryDefenseScore` ($\text{BDS}$), simulasi tekanan waktu & desakan otoritas semu.
* **Kriteria:** `tests/phase11.test.ts` membuktikan diskualifikasi otomatis pada jebakan fatal dan penghargaan pada pertahanan batas yang kokoh.

### 📌 Fase 12: Adaptive Topological Diagnostic Placement Engine [SELESAI ✅]
* **Tujuan:** Mempercepat onboarding peserta senior menggunakan Knowledge Space Theory (KST) di atas Directed Acyclic Graph.
* **Komponen:** `KnowledgeSpaceEngine`, `TopologicalPlacementService`, minimal-entropy fringe traversal, inferensi penguasaan leluhur instan.
* **Kriteria:** `tests/phase12.test.ts` membuktikan kelulusan capstone langsung menginferensikan seluruh node prasyarat.

### 📌 Fase 13: Double-Blind Multi-Rater Consensus Engine [SELESAI ✅]
* **Tujuan:** Penilaian independen Kelas C oleh dua rater secara double-blind dengan imunitas terhadap Prevalence Paradox via Gwet's $\text{AC}_1 / \text{AC}_2$.
* **Komponen:** `MultiRaterConsensusEngine`, sanitasi identitas peserta/penilai, eskalasi otomatis ke Chief Arbiter bila terjadi divergensi evaluasi.
* **Kriteria:** `tests/phase13.test.ts` memverifikasi kalkulasi Gwet AC1 dan rekonsiliasi arbiter.

### 📌 Fase 14: Predictive Competency Drift & Skill Half-Life Decay Modeling [SELESAI ✅]
* **Tujuan:** Memodelkan peluruhan retensi kompetensi menggunakan model DSR (Difficulty, Stability, Retrievability: $R(t) = (1 + 0.19 \frac{t}{S})^{-0.5}$).
* **Komponen:** `CompetencyDriftEngine`, auto-suspensi paspor wewenang bila retensi turun di bawah ambang batas ($R(t) < 0.85$).
* **Kriteria:** `tests/phase14.test.ts` memverifikasi peregangan stabilitas dan suspensi paspor wewenang saat terjadi peluruhan kritis.

### 📌 Fase 15: Autonomous Domain Synthesizer & Agent-Agnostic Skill Engine [SELESAI ✅]
* **Tujuan:** Menyintesis kurikulum domain lengkap dari dokumen regulasi markdown mentah dengan verifikasi invarian 3-tier dan algoritma Tarjan SCC.
* **Komponen:** `DomainBlueprintValidator`, Tarjan SCC Cycle Detector, evaluasi kelayakan 100% domain readiness.
* **Kriteria:** `tests/phase15.test.ts` memverifikasi sintesis domain sipil dan militer tanpa kesalahan siklus.

### 📌 Fase 16: Cryptographic Verifiable Credentials & OpenBadges 3.0 [SELESAI ✅]
* **Tujuan:** Menerbitkan paspor wewenang digital berbasis standar W3C Verifiable Credentials Data Model 2.0 dengan bukti Ed25519 Data Integrity Proof dan OpenBadges 3.0.
* **Komponen:** `VerifiableCredentialService`, kanonikalisasi RDFC-1.0 deterministik, verifikasi integritas offline tanpa koneksi server.
* **Kriteria:** `tests/phase16.test.ts` memverifikasi penandatanganan dan deteksi manipulasi 1-bit seketika.

---

## 🚀 Roadmap Peningkatan Terkini & Masa Depan (Phases 17–20)

### 📌 Fase 17: Bi-directional Lumis Agentic Socratic Bridge & Two-Way RPC [TERIMPLEMENTASI & DITINGKATKAN 🚀]
* **Tujuan:** Mengintegrasikan antarmuka chat ultra-ringan Lumis (`ihkaru/lumis`) secara bi-direksional ke seluruh fase pembelajaran FlashLearn tanpa tabrakan styling CSS (scoped iframe + RFC 6454 postMessage).
* **Fitur Utama:**
  1. **Two-Way PostMessage RPC v2:** Sinyal `lumis:ready`, `lumis:send_prompt`, `lumis:adopt_draft` untuk mengalirkan draf argumen langsung ke formulir tugas (`TaskExecutionForm`).
  2. **Grounded Socratic Context Injection:** Pengiriman konteks skenario tugas, kode kompetensi, klausul regulasi, dan larangan spoiler secara dinamis.
  3. **Resilience & Local Fallback:** Pendeteksian timeout koneksi Lumis cloud (7 detik) dengan tombol *Retry* dan fallback instan ke Socratic Drawer bawaan.
  4. **Adopsi Draf Argumen Cepat:** Tombol *📥 Terapkan ke Form Tugas* yang mengizinkan peserta memindahkan poin-poin refleksi ke input tugas tanpa copy-paste manual.
* **Spesifikasi Lengkap:** [`docs/phases/phase-17-lumis-agentic-chat-bridge.md`](./phases/phase-17-lumis-agentic-chat-bridge.md)

### 📌 Fase 18: Tamper-Evident Conversational Audit Trail & D8 Multi-Turn Hashing [RENCANA TINGKAT LANJUT 🔮]
* **Tujuan:** Memperluas audit trail kepatuhan regulasi FlashLearn (D8) untuk mengikat riwayat percakapan Lumis ke dalam paket bukti evaluasi (*Compliance Bundle*).
* **Komponen Rencana:**
  - Penyimpanan transkrip sesi percakapan berantai hash (SHA-256) per submisi tugas.
  - Mode audit reviewer pakar: panel inspeksi riwayat Socratic chat peserta sebelum pemberian tanda tangan wewenang Gate Level 3.
  - Deteksi upaya *jailbreak* / *prompt injection* yang berusaha mengekstrak kunci jawaban oracle.

### 📌 Fase 19: Topological Knowledge Space (KST) Chat-Guided Planning [RENCANA TINGKAT LANJUT 🔮]
* **Tujuan:** Memberdayakan Lumis untuk bertindak sebagai penasihat kurikulum personal yang membaca posisi graf prasyarat peserta secara live.
* **Komponen Rencana:**
  - Lumis menganalisis *minimal-entropy topological fringe* peserta dan merekomendasikan rute akselerasi belajar.
  - Dialog interaktif penjadwalan latihan revalidasi DSR ($R(t)$) yang disesuaikan dengan ritme kesibukan profesional pengguna.

### 📌 Fase 20: Decentralized Credential Mesh & Autonomous AI Agent Peer Evaluation [RENCANA TINGKAT LANJUT 🔮]
* **Tujuan:** Mengizinkan verifikasi lintas institusi menggunakan DID:PKH / Polygon ID dan simulasi evaluasi peer antar agen AI independen.

---

## 🛠️ Hubungan Antar Modul Monorepo (As-Is Codebase)

```
packages/shared/src/
├── types/
│   ├── source.ts          # Interface Source & Addressable Chunks
│   ├── competency.ts      # DAG Nodes & Edges
│   ├── task.ts            # Task Definition, Oracle Classes (A, B, C, Dilemma) & Socratic Hints
│   ├── gate.ts            # Authorization Gate Levels & Public Passport & W3C VC
│   ├── audit.ts           # Audit Trail & Tamper-Evident Bundle
│   └── workspace.ts       # Domain Blueprint Importer & Certification Schemas

apps/api/src/
├── domain/ports/          # Repository & Validator Interfaces
├── application/use-cases/ # 16 Fase Use Cases (Ingest, DAG, Oracles, Gates, KST, Consensus, DSR, VC)
├── infrastructure/        # Drizzle Tables, Deterministik Runners, AI Adapters, Controllers
└── worker.ts              # Background Daemon Service

apps/web/src/
├── stores/
│   ├── lumisChat.svelte.ts # State store percakapan Lumis Svelte 5 runes & two-way bridge
│   ├── api.ts              # API client wrapper
│   └── auth.ts             # Auth & profile store
├── components/
│   ├── chat/
│   │   └── LumisChatAssistant.svelte # Floating Lumis chat widget & scoped iframe RPC
│   ├── competency/
│   │   ├── CompetencyDagView.svelte    # Tampilan visual pohon belajar & prasyarat
│   │   ├── TaskExecutionForm.svelte    # Form pengerjaan tugas ber-oracle & auto-draft bridge
│   │   ├── SocraticTutorDrawer.svelte  # Drawer asisten Sokrates lokal (fallback)
│   │   └── DiagnosticPlacementModal    # Penempatan adaptif KST
│   └── reviewer/
│       └── ReviewCard.svelte           # Antarmuka pakar menilai Kelas C
└── pages/
    ├── verify-passport.svelte          # Verifikasi publik paspor wewenang kerja
    └── workspace.svelte                # Halaman utama workspace & integrasi fitur
```
