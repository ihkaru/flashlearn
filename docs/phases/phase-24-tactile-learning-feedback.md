# Phase 24: Tactile Learning Feedback (Progressive Audio-Visual Streak & Mastery Milestones)

- **Parent Roadmap**: [docs/ROADMAP.md](../ROADMAP.md)
- **Prinsip Riset (November 2026)**:
  - **Escalating Multi-Sensory Feedback (*Game Feel / Juice*)**: Progressive pitch escalation via **Web Audio API** (tangga nada pentatonik `< 2 kHz`, durasi `< 300ms`, 0 KB aset eksternal, latensi 0ms) agar capaian beruntun terasa hidup tanpa *auditory fatigue*.
  - **Self-Determination Theory (Ryan & Deci) & Anti-Overjustification**: Hanya merayakan **kompetensi nyata & kalibrasi** (*Calibrated Mastery* = Benar + Yakin, *Leitner Redemption*, tuntas sesi/bab) pada *peak moments* — nol gangguan saat membaca materi inti.
  - **Accessibility & Respectful Defaults**: **Muted by default** dengan toggle 1-klik persisten (`localStorage`), *Redundancy Rule* (visual selalu berpasangan dengan audio), non-blocking toast (`pointer-events: none`), dan degradasi statis penuh saat `@media (prefers-reduced-motion: reduce)`.

---

## 1. Tangga Eskalasi Momen Belajar

| Momen Belajar | Visual (Non-Blocking, GPU 120Hz) | Audio (Web Audio API, <320ms) | Haptik (Mobile) |
| :--- | :--- | :--- | :---: |
| **Benar (1–2x)** | Pill konfirmasi + pulse halus | Warm sine/triangle pluck (`C5` / `D5`, 180ms) | — |
| **Streak 3x Tepat** | Pill streak: `3x Tepat · Ritme pemahaman terjaga` | Nada pentatonik naik (`E5`, 210ms) | — |
| **Streak 5x Kalibrasi Tajam** | Banner aksen workspace: `5x Kalibrasi Tajam!` (atau `5x Beruntun!`) | Harmoni 2 nada hangat (*major third*, 260ms) | `18ms` |
| **Streak 10x+ / Sesi 100% / Modul Tuntas** | Banner selebrasi elegan (`var(--ws-accent)`) + ring pulse: `10x Tak Terhentikan!` / `Modul Tuntas!` | Ascending Major-7th arpeggio lembut (`C5→E5→G5→B5`, 320ms) | `[15, 30, 22]` |
| **Leitner Redemption** | Pill hijau: `Konsep Terkunci!` (kartu `Ulangi` akhirnya dikuasai) | Ascending perfect fifth (`G4→D5`, 240ms) | `14ms` |
| **Salah / Ulangi** | Gentle nudge (`translateX`), nol buzzer keras | Soft muted low thud (`190→140Hz`, 140ms) | — |

---

## 2. Arsitektur Komponen (`apps/web`)
- `apps/web/src/lib/learningFeedback.svelte.ts`: Singleton Svelte 5 runes state (`soundEnabled`, `activeToast`) + procedural Web Audio API synthesizer + haptik opsional.
- `apps/web/src/components/ui/LearningMilestoneToast.svelte`: Toast selebrasi non-blocking (`pointer-events: none`) beraksen warna workspace.
- `apps/web/src/components/ui/SoundToggleButton.svelte`: Toggle suara 1-klik persisten di bar atas halaman belajar (`content-detail.svelte`).
- Integrasi di `ActivePracticeRunner.svelte`, `FlashcardDeck.svelte`, `InteractiveModuleViewer.svelte`, dan `learning-motion.css`.

---

## 3. Kriteria Verifikasi
- `cd apps/web && bun run build` lulus 0 error.
- `bun run lint:srp` lulus 0 error (seluruh berkas < 300 baris).
- `arc42-lint --strict` 12/12 `FRESH`.
