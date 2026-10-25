# Fase 2: Redesain UI Dual-Loop Modal (`TaskRunnerModal.svelte`)
> **Bagian dari [Roadmap Arsitektur Kognitif FlashLearn v2.0](00_overview.md)**  
> *Target: Frontend Web UX, Svelte 5 Runes, Penyatuan Mode Latihan vs Ujian Resmi*

---

## 1. Tujuan Fase
1. Mengubah `TaskRunnerModal.svelte` dari sekadar form ujian buntu menjadi **Wadah Pembelajaran Utuh (*Integrated Learning Container*)**.
2. Menyediakan 2 Tab di dalam modal:
   * **Tab 1: `Mode Belajar & Latihan` (Safe Sandbox)**
   * **Tab 2: `Mode Ujian Pembuktian` (Gate Exam)**
3. Menerapkan protokol **Graceful Downgrade to Practice Mode** jika pembelajar memerlukan bantuan langkah kerja di Tab 2, guna menjaga integritas sertifikasi wewenang.

---

## 2. Rincian Antarmuka & Perilaku Kognitif

```
┌────────────────────────────────────────────────────────────────────────┐
│  [AV-FOUND-01] Inspeksi Sensor Pitot-Static (Oracle Kelas A)        [X]│
├────────────────────────────────────────────────────────────────────────┤
│  [ Tab 1: Belajar & Latihan (Sandbox) ]   [ Tab 2: Ujian Gate (Resmi) ]│
├────────────────────────────────────────────────────────────────────────┤
│  KONTEN TAB 1 (Mode Belajar & Latihan):                                │
│  • Ringkasan Regulasi & Job Aid Checklist                              │
│  • Annotated Worked Example (Kasus Ahli yang Terbedah Baris per Baris) │
│  • Micro-Sandbox: Latihan Mandiri Bebas Penalti Skor                   │
│  • Tutor Sokratik: Mode Bimbingan Terbuka (Analogous Worked Example)   │
│                                                                        │
│  [ Tombol: Saya Sudah Paham, Buka Ujian Pembuktian -> ]                │
└────────────────────────────────────────────────────────────────────────┘
```

### A. Polimorfisme Tampilan Sesuai `cognitive_archetype`
* **`algorithmic_quant`**:
  * Tab 1: Menampilkan tabel rumus interaktif dan contoh perhitungan analogis.
  * Tab 2: Formulir **Multi-Checkpoint Oracle** (Input Capex, Input Opex, Input Salvage Value $\to$ Hasil Akhir) dengan diagnosa kesalahan per komponen.
* **`artifact_audit`**:
  * Tab 1: Menampilkan contoh dokumen yang sudah diberi penanda anomali (*highlight defect*).
  * Tab 2: Formulir penandaan cacat dokumen (*Spot-the-Defect*) terhadap dokumen uji mentah.
* **`ill_structured_case`**:
  * Tab 1: Menampilkan *Contrasting Cases* (perbandingan keputusan fatal vs keputusan bijak).
  * Tab 2: Formulir disposisi etika/hukum dengan analisis justifikasi mendalam.
* **`rapid_fluency`**:
  * Tab 1: Menampilkan dek kartu flashcard 3D dan kuis ingatan kilat.
  * Tab 2: Ujian berbasis batas waktu ketat (*time-boxed retrieval*).

### B. Protokol *Graceful Downgrade to Practice Mode*
* Di Tab 2 (Ujian Resmi), AI Tutor dilarang membocorkan rumus atau langkah kerja.
* Jika pembelajar menekan tombol *"Saya buntu, butuh panduan langkah"*:
  * Muncul dialog konfirmasi:
    > *"Membuka panduan langkah kerja akan mengubah sesi ini menjadi **Mode Latihan**. Nilai tidak akan dihitung untuk membuka Gerbang Otoritas, dan Anda akan diberikan variasi kasus baru saat mengulang ujian resmi. Buka panduan?"*
  * Jika disetujui: Sesi berubah menjadi sandbox tanpa penalti, dan status attempt ditandai `is_practice: true`.

---

## 3. Kriteria Keberhasilan (Acceptance Criteria)

- [ ] Pembelajar yang mengklik Node DAG dapat membaca materi terbedah dan mencoba micro-sandbox di Tab 1 sebelum mengambil ujian di Tab 2.
- [ ] Tombol ujian di Tab 2 hanya aktif jika pembelajar sudah membuka materi atau lulus micro-sandbox dasar.
- [ ] Protokol *Graceful Downgrade* berjalan dengan mulus tanpa merusak integritas verifikasi kredensial W3C VC di Tab 2.
- [ ] Komponen [TaskRunnerModal.svelte](file:///root/projects/flashlearn/apps/web/src/components/competency/TaskRunnerModal.svelte) dan subkomponennya tetap di bawah budget batas 400 baris kode per file.
