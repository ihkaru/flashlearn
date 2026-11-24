# Phase 23: Scalable Quiz & Flashcard Drill Modules (10–600+ Soal, Interleaved)

- **Parent Roadmap**: [docs/ROADMAP.md](../ROADMAP.md)
- **Inspirasi Pedagogi (15 Prinsip Pendidikan)**: *Active Recall*, *Cognitive Load Chunking* (sesi mikro 10/20/30/50 soal alih-alih dinding 600 soal), *Interleaving* (acak lintas sub-topik), *Confidence Calibration* (`Yakin / Ragu / Menebak`), *Leitner Re-Queue* (kartu *Ulangi* kembali ke antrean), dan *Immediate Causal Feedback*.

---

## 1. Masalah As-Is
1. `QuizRunner.svelte` merender seluruh soal sekaligus dalam satu halaman vertikal — pada modul 100–600 soal (>2.400 tombol DOM), UI berat di mobile dan memicu *cognitive overload*.
2. `FlashcardDeck.svelte` hanya bisa dibuka *setelah* submit seluruh kuis; pembelajar tidak bisa langsung memilih **Mode Flashcard 3D** atau **Mode Latihan 1-per-1**.
3. `SubmitQuizUseCase` selalu membagi skor terhadap total bank soal (`content.questions.length`), sehingga mengerjakan sesi mikro 20 soal dari bank 600 soal salah dinilai `20/600 = 3%`.
4. `packages/cli` (`plan-remote-sync.ts`) hanya mendukung push `interactive_module`, belum mendukung modul `type: 'quiz'` yang disisipkan (*interleaved*) di antara unit materi dalam `curriculum-plan.json`.

---

## 2. Arsitektur Solusi

### A. Shared Contract (`packages/shared`)
- Tambahkan field opsional backward-compatible pada `QuizQuestion` & `FlashcardItem`: `topic?: string`, `sourceRef?: string`.
- Tambahkan `sessionMode?: 'full' | 'subset'` pada `QuizSubmissionRequest`.
- Tambahkan `contentType?: 'interactive_module' | 'quiz'` pada `PlanModuleEntry`.

### B. Backend API (`apps/api`)
- `POST /api/v1/contents/:id/check-question` (`quiz.controller.ts`): verifikasi 1 soal secara instan untuk *Active Practice Mode* tanpa membocorkan kunci jawaban pada `GET /api/v1/contents/:id`.
- `SubmitQuizUseCase.ts`: jika `sessionMode === 'subset'`, hitung skor dan `reviews` khusus terhadap `questionId` yang dikirim dalam sesi mikro tersebut.
- `GenerateFlashcardsUseCase.ts`: meneruskan `topic` & `sourceRef` ke setiap `FlashcardItem`.
- `content.controller.ts`: izinkan field opsional `topic` & `sourceRef` pada `questions[]` (`POST /` & `PUT /:id`).

### C. Agent CLI (`packages/cli`)
- `plan-remote-sync.ts`:
  - Mendukung modul `contentType: 'quiz'` (manifest JSON `schemaVersion: 'quiz-drill-v1'` berisi hingga 600+ soal dengan penjelasan, hint, difficulty, topic) agar bisa disisipkan bebas setelah materi mana pun di dalam unit workspace.
  - Sekaligus menutup `DEBT-07`: filter konten `deleted` di `diffPlanWithRemote`.

### D. Frontend UX (`apps/web`)
- **`QuizDrillSetupCard.svelte`**: Panel konfigurasi sesi ringkas: pilih Mode (**Latihan Aktif 1-per-1** / **Flashcard 3D** / **Mode Ujian**), Ukuran Sesi (`10 / 20 / 30 / 50 / Semua`), Filter Topik (`topic`), Filter Penguasaan (`Semua / Belum Dikuasai / Perlu Diulang`), dan toggle *Interleaving* (acak).
- **`ActivePracticeRunner.svelte`**: Layar fokus 1 soal per layar dengan *Confidence Calibration*, cek jawaban instan via API, penjelasan Markdown/KaTeX, `.fl-step-enter` & `.fl-progress-bar-fill` (`scaleX`), dan penyimpanan progres penguasaan per soal di `localStorage`.
- **`FlashcardDeck.svelte`**: Mendukung *Leitner Re-Queue* (rating *Ulangi* mengembalikan kartu ke antrean sesi), filter topik, shortcut keyboard (`Space`, `1–4`), dan warna aksen workspace (`var(--ws-accent)`).
- **`QuizRunner.svelte`**: Orkestrator ramping yang menggabungkan Setup → Active Practice / Flashcard 3D / Batch Exam (terpaginasi per sesi, tidak pernah merender 600 node DOM sekaligus).

---

## 3. Kriteria Verifikasi
- Unit test: `packages/shared`, `packages/cli` (quiz drill plan push dry-run & soft-delete diff filter), dan `apps/api` (`check-question` + `subset` scoring pada bank 600 soal).
- `bun run build` (`apps/web`), `tsc --noEmit`, `bun run lint:srp`, dan `arc42-lint --strict` lulus 100%.
