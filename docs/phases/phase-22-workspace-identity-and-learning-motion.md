# Phase 22: Workspace UI De-duplication, Distinct Workspace Identity & Cognitive Learning Motion

- **Parent Roadmap**: [docs/ROADMAP.md](../ROADMAP.md)
- **Prinsip Riset (November 2026)**:
  - **Multi-Workspace Differentiation (Linear / Notion / Arc / Slack)**: *"The app feels like home; the workspace feels like a distinct room inside that home."* Menggunakan *restrained tonal framing* dengan palet aman WCAG AA (>= 4.5:1), monogram + aksen terlokalisasi, tanpa gradien AI slop atau tema gelap/neon berlebihan.
  - **Cognitive-Load-Friendly E-Learning Motion**: Animasi hanya untuk tujuan fungsional (kontinuitas spasial langkah, konfirmasi jawaban, momentum progres), durasi ringkas (`150–260ms`), 100% GPU-composited (`transform` & `opacity` saja — nol reflow `width`/`height`/`margin`), dan degradasi statis penuh saat `@media (prefers-reduced-motion: reduce)`.

---

## 1. Audit Redundansi UI Workspace (As-Is)

1. **`DomainTrackSelector` duplikat & salah tempat di tab `Topik Belajar`** (`apps/web/src/pages/workspace.svelte:210-218`):
   - Pada workspace kurikulum buku (*The Software Architect Elevator*, *FoSA 2nd Ed*, *Profit First*), daftar `domains` adalah Unit Kuliah (`U01..U05`) yang sudah tampil rapi di `WorkspaceUnitAccordion`.
   - Merender `DomainTrackSelector` di atas tab utama memakan ~280px layar awal, memunculkan jargon *"Lintasan Kualifikasi Wewenang / Otoritas Tingkat 1"* di atas buku teknis, dan klik pill-nya tidak memfilter modul sama sekali.
   - **Solusi**: Tampilkan `DomainTrackSelector` **hanya** saat `activeViewTab === 'competencies'` (di mana `selectedDomainId` benar-benar mengendalikan `<CompetencyDagView>`).
2. **Filter Pill Kosong & Duplikat** (`apps/web/src/pages/workspace.svelte:249-293`):
   - Saat semua 41 modul bertipe `interactive_module`, UI tetap menampilkan `Semua (41)`, `Interaktif (41)` (identik!), `Materi (0)`, dan `Kuis (0)` (tombol mati).
   - **Solusi**: Sembunyikan pill bertipe `count === 0`, dan tampilkan baris filter hanya jika ada **>= 2 jenis konten aktif** (atau tombol `Arsip (N)` khusus owner saat ada item terhapus).

---

## 2. Sistem Identitas Visual per-Workspace (`workspaceTheme.ts`)

Buat utilitas deterministik `apps/web/src/lib/workspaceTheme.ts` yang memetakan `workspace.slug || workspace.id` ke **6 palet editorial terkurasi** (seluruhnya lulus kontras WCAG AA >= 4.5:1 dengan teks putih):

| Theme Key | Accent (`--ws-accent`) | Soft Surface (`--ws-accent-soft`) | Border (`--ws-accent-border`) | Dark Ink (`--ws-accent-ink`) |
| :--- | :---: | :---: | :---: | :---: |
| `teal` | `#0f766e` | `#f0fdfa` | `#99f6e4` | `#115e59` |
| `indigo` | `#3730a3` | `#eef2ff` | `#c7d2fe` | `#312e81` |
| `amber` | `#b45309` | `#fffbeb` | `#fde68a` | `#92400e` |
| `emerald` | `#15803d` | `#f0fdf4` | `#bbf7d0` | `#166534` |
| `rose` | `#9f1239` | `#fff1f2` | `#fecdd3` | `#881337` |
| `cobalt` | `#1d4ed8` | `#eff6ff` | `#bfdbfe` | `#1e40af` |

**Penerapan Terkendali (Anti-Slop)**:
- **Kartu Workspace di Home** (`home.svelte`): monogram badge memakai warna aksen workspace masing-masing agar memori visual terbawa sejak halaman beranda.
- **Workspace Header** (`WorkspaceHeader.svelte`): garis tepi atas `4px` (`border-top: 4px solid var(--ws-accent)`) + monogram tinted + label domain/jumlah modul ringkas.
- **Workspace View** (`workspace.svelte` & `WorkspaceUnitAccordion.svelte`): tab aktif, CTA utama, dan strip *"Lanjutkan Sesi Terakhir"* mengikuti `--ws-accent` / `--ws-accent-soft`.
- **Content Detail** (`content-detail.svelte`): breadcrumb konteks ringkas di bagian atas menampilkan titik aksen + nama workspace agar pengguna tetap sadar berada di ruang belajar mana saat mendalami bab.

---

## 3. Mikro-Animasi Belajar 120Hz GPU-Composited

Diterapkan di `apps/web/src/styles/learning-motion.css` (diimpor global di `main.ts`) dan dipakai di `InteractiveModuleViewer.svelte`, `WorkspaceUnitAccordion.svelte`, serta `workspace.svelte`:
- **Step Continuity (`fl-step-enter`)**: `opacity: 0 → 1` + `transform: translateY(6px) → translateY(0)` (`180ms cubic-bezier(0.22, 1, 0.36, 1)`) setiap berpindah langkah di `InteractiveModuleViewer`.
- **GPU Progress Bar (`fl-progress-fill`)**: menggunakan `transform: scaleX(ratio)` dengan `transform-origin: left` (`240ms cubic-bezier(0.22, 1, 0.36, 1)`) alih-alih menganimasikan `width` yang memicu layout reflow.
- **Answer Feedback (`fl-feedback-correct` / `fl-feedback-nudge`)**: pulse halus `scale(1 → 1.015 → 1)` (`220ms`) saat benar, dan geseran lembut `translateX(±4px)` (`220ms`) saat perlu coba lagi.
- **Reduced Motion Compliance**: `@media (prefers-reduced-motion: reduce)` menonaktifkan seluruh `animation` dan `transition` berbasis gerak dengan tetap mempertahankan perubahan status warna/border secara instan.

---

## 4. Kriteria Verifikasi
- `bun run build` (`apps/web`) & `bun run lint:srp` lulus 0 error.
- Verifikasi visual & fungsional bahwa:
  - `DomainTrackSelector` tidak lagi muncul di tab `Topik Belajar` (hanya di `Peta Kompetensi`).
  - Filter pill kosong (`0`) & duplikat tidak lagi muncul.
  - Dua workspace berbeda (*The Software Architect Elevator* vs *Profit First*) menampilkan warna aksen/monogram berbeda yang harmonis.
  - Seluruh kelas animasi hanya menganimasikan `transform`/`opacity` dan terlindungi `@media (prefers-reduced-motion: reduce)`.
