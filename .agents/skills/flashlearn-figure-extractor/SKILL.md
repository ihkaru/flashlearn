---
name: flashlearn-figure-extractor
description: Portable 3-path visual figure & diagram extractor for PDF, EPUB, and PPTX learning sources. Performs lossless embedded image extraction, targeted PDF page rendering & bounding-box auto-crop with WebP optimization, enforces Zero Unexplained Jargon figure annotations, and feeds FlashLearn's native persistent asset API without requiring any external storage server.
---

# FlashLearn Smart Visual Figure Extractor (`flashlearn-figure-extractor`)

Gunakan skill ini pada **Layer 1.5** (setelah `flashlearn plan init`) ketika buku PDF, EPUB, atau PPTX memuat **diagram, grafik, kurva, formulir contoh, atau skema mekanisme** yang secara nyata memperkuat pemahaman pembelajar (*Dual Coding*).

---

## 1. Aturan Seleksi 3-Jalur (Jangan Asal Screenshot!)

| Jenis Visual di Sumber | Jalur Wajib | Alasan |
| :--- | :--- | :--- |
| **A. Gambar Raster Tertanam** (EPUB `images/*`, PPTX `ppt/media/*`, PDF foto/diagram raster) | **Jalur 1 — Ekstraksi Lossless** (`--mode embedded`) → buang ikon/dekorasi `< 180×120 px` → optimasi WebP | Nol penurunan ketajaman, ukuran sangat ringan (~30–80 KB WebP). |
| **B. Diagram Vektor / Grafik / Kurva / Skema Kompleks di PDF** (tidak tersimpan sebagai gambar raster tunggal) | **Jalur 2 — Targeted Page Render + Auto-Crop** (`--mode render-pages` → baca halaman target / deteksi kotak diagram → `--mode crop`) → WebP | Hanya merender halaman kandidat (mis. bertanda `needsVlmTriage: true` atau ber-caption `Figure/Diagram/Chart`), bukan seluruh 600 halaman! |
| **C. Flowchart Teks Sederhana / Tabel Angka Biasa** | **Jalur 3 — Jangan Screenshot!** Ubah ke **Mermaid / SVG / Tabel HTML Terstruktur** | Tetap tajam di semua layar HP, mudah diterjemahkan ke bahasa pembelajar, dan terhindar dari label asing yang tak dijelaskan. |

---

## 2. Invarian Pedagogi & Anti-Jargon untuk Gambar

1. **Selektif, Bukan Spam**: Maksimal **1–2 gambar paling berdampak per modul** (hanya yang melengkapi teks secara visual, bukan halaman teks atau dekorasi).
2. **Wajib Keterangan Utuh (*Zero Unexplained Jargon*)**: Setiap entri di `payload.figures[]` wajib mengisi:
   - `caption`: judul deskriptif dalam bahasa modul (mis. Bahasa Indonesia).
   - `altText`: deskripsi aksesibel yang bermakna.
   - `stepKind`: langkah UI tempat gambar ditampilkan (`anomaly`, `bridging`, `mechanics`, `notation`, `micro_examples`, `ill_structured_case`).
   - `sourceRef` & `sourcePage`: jejak asal-usul halaman buku.
   - `annotations`: daftar `{ "label": "...", "explanation": "..." }` untuk menjelaskan singkat **setiap akronim atau istilah asing yang tampak di dalam gambar asli** (mis. `TAP`, `OPEX`, `Delta`).

---

## 3. Penggunaan Script Portabel (`scripts/extract_figures.py`)

Script portabel di folder skill ini memakai Python 3 standar (dengan dukungan opsional `pdfimages`, `pdftoppm`, dan `Pillow` bila terpasang — turun mulus tanpa memaksa instalasi vendor VLM tertentu):

```bash
# Jalur 1: Ekstrak gambar tertanam dari EPUB, PPTX, atau PDF (filter ukuran minimal & konversi WebP)
python3 scripts/extract_figures.py \
  --input "./source/book.pdf" \
  --out "./assets" \
  --mode embedded \
  --pages 70-75 \
  --min-width 180 --min-height 120

# Jalur 2A: Render halaman PDF kandidat (mis. bertanda needsVlmTriage) pada 180 DPI untuk inspeksi/bbox
python3 scripts/extract_figures.py \
  --input "./source/book.pdf" \
  --out "./assets/pages" \
  --mode render-pages \
  --pages 32,71,73 \
  --dpi 180

# Jalur 2B: Crop tepat kotak diagram (koordinat 0..1000 ternormalisasi: x,y,w,h) -> WebP optimal
python3 scripts/extract_figures.py \
  --input "./assets/pages/page-071.png" \
  --out "./assets" \
  --mode crop \
  --crop "40,120,920,480" \
  --name "fig-04-taps-table" \
  --source-ref "Profit First (2017)" \
  --source-page 71
```

Script menghasilkan file `.webp` (atau `.png` bila Pillow tidak tersedia) beserta **`assets/assets-manifest.json`** berisi metadata `sha256`, dimensi, dan `sourcePage`.

---

## 4. Persistence Tanpa Konfigurasi Memaksa (Native FlashLearn Asset API)

Cantumkan path relatif lokal di manifest modul (`modules/<slug>.uila-v2.json`):

```json
"figures": [
  {
    "id": "fig-04-taps",
    "assetUrl": "./assets/fig-04-taps-table.webp",
    "caption": "Tabel 6 Tangga Target Allocation Percentages (TAPs) Berdasarkan Pendapatan Riil",
    "altText": "Tabel 6 kolom A sampai F menunjukkan persentase target Profit, Owner's Comp, Tax, dan Operating Expenses.",
    "stepKind": "notation",
    "sourceRef": "Profit First (Mike Michalowicz, 2017)",
    "sourcePage": 71,
    "annotations": [
      { "label": "Real Revenue Range", "explanation": "Rentang Pendapatan Riil tahunan setelah dikurangi bahan baku & subkontraktor lepas (>=25%)." },
      { "label": "Owner's Comp", "explanation": "Porsi gaji rutin pemilik atas kerja aktif di bisnis." }
    ]
  }
]
```

Saat menjalankan `flashlearn plan push --dir "<workDir>" --upload-media` (atau `flashlearn asset upload`), CLI otomatis mengunggah gambar ke **endpoint persisten bawaan FlashLearn** (`POST /api/v1/workspaces/:workspaceId/assets`) menggunakan API Key FlashLearn yang sama:
- Otomatis *deduplicated* lewat `sha256` per workspace.
- Tersimpan secara persisten di backend pluggable server (default: tabel blob PostgreSQL terisolasi sehingga aman untuk kontainer *stateless*; opsional `local` volume atau `mediavault` bila operator mengaktifkannya lewat env var).
- Disajikan melalui `/api/v1/assets/:id` dengan header `Cache-Control: public, max-age=31536000, immutable` dan `ETag`.
