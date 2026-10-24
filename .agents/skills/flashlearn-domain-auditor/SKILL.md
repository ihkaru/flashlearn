---
name: flashlearn-domain-auditor
description: Autonomous domain curriculum research & completeness auditor for FlashLearn. Given a domain blueprint, workspace, or SOP, it conducts real-time web research to verify curriculum currency, regulatory parity, corpus completeness, and strict alignment with FlashLearn's 5 core engine pillars (Corpus of Record, DAG prerequisites, multi-tier oracles, progressive gates, adversarial stress tests).
---

# 🧠 FlashLearn Domain Curriculum & Completeness Auditor (`flashlearn-domain-auditor`)

Skill ini digunakan oleh Coding Agent untuk melakukan audit komprehensif terhadap sebuah **Domain / Workspace** yang telah dibuat di FlashLearn. Skill ini menggabungkan **inspeksi deterministik struktur domain** dengan **riset web real-time (internet search)** untuk memastikan kurikulum domain tersebut:
1. **Proper & Complete**: Memenuhi standar industri terkini, regulasi hukum aktif (standar tahun 2026), sertifikasi relevan (ISO, NIST, dll.), dan studi kasus nyata.
2. **Sesuai Tujuan Utama FlashLearn**: Bukan sekadar kuis trivia hafalan biasa, melainkan *evidence-based competency authorization engine* dengan 5 pilar invarian.

---

## 🎯 5 Pilar Utama Tujuan Aplikasi FlashLearn (Quality Rubric)

Setiap domain di FlashLearn wajib mematuhi 5 pilar invarian arsitektur:

| No | Pilar FlashLearn | Standar Minimal Kepatuhan | Gejala Pelanggaran (Red Flags) |
|:---|:---|:---|:---|
| **1** | **Corpus of Record (Verbatim Grounding)** | Seluruh materi dibagi menjadi *chunks* terstruktur dengan `locationTag` eksplisit (Pasal, Ayat, Bab, Halaman) dan hash SHA-256. | Teks panjang tanpa tag lokasi spesifik; rangkuman generik tanpa rujukan regulasi/SOP resmi. |
| **2** | **Directed Competency DAG Topology** | Struktur prasyarat pembelajaran membentuk graf berarah asiklis (Acyclic DAG). Minimal 4 tier: Fondasi $\to$ Kalkulasi $\to$ Evaluasi $\to$ Dilema. | Graf memiliki siklus (*circular prerequisite trap*); node terisolasi (*orphan*); urutan prasyarat tidak logis. |
| **3** | **Multi-Tier Oracle & Assessment Rigor** | Kombinasi **Kelas A** (Deterministik: formula eksak/checklist angka) dan **Kelas B** (AI Judge: telaah kasus dengan *gold benchmark rationale*, sitasi wajib, dan *negative anchors/traps*). | Soal pilihan ganda trivia dangkal; tidak ada formula kalkulasi riil; tidak ada jebakan bias pada AI judge. |
| **4** | **Progressive Authorization Gates** | Memiliki jenjang wewenang berjenjang (Level 0: Observasi $\to$ Level 1: Operasional $\to$ Level 2: Spesialis Senior $\to$ Level 3: Otoritas Penuh). Syarat kelulusan $\ge 80\%$, Level 3 wajib *human-in-the-loop signoff*. | Tingkat otorisasi acak/datar; tidak merefleksikan kewenangan dunia nyata; threshold kelulusan terlalu rendah (< 70%). |
| **5** | **Adversarial Stress Testing & Dilemmas** | Minimal 1 skenario dilema integritas berisiko tinggi (*adversarial dilemma*) yang menguji ketahanan terhadap tekanan eksekutif, desakan waktu, atau celah hukum. | Domain hanya menguji skenario ideal "happy path"; tidak ada pengujian etika atau kepatuhan anti-fraud. |

---

## 🔄 Alur Kerja Agen 4-Langkah (The 4-Step Audit Loop)

Ketika diinstruksikan mengaudit domain (misal: `docs/samples/enterprise-procurement-blueprint.json` atau workspace slug):

### Langkah 1: Eksekusi Static Domain Analyzer
Jalankan alat audit deterministik monorepo untuk menginspeksi struktur 5 pilar dan mendapatkan daftar kueri riset web yang direkomendasikan:
```bash
# Terminal human-readable output
bun run audit:domain --file docs/samples/<nama-blueprint>.json

# Machine-readable JSON output untuk analisis terstruktur
bun run audit:domain --file docs/samples/<nama-blueprint>.json --json
```

### Langkah 2: Riset Web Real-Time (Mandatory Live Internet Research)
Sesuai **User Rule #11 (Real-Time Web Research)**, agen **DILARANG HANYA MENGASUMSIKAN PENGETAHUAN LAMA**. Lakukan pencarian web menggunakan `search_web` dengan konteks temporal terkini (tahun 2026):

1. **Riset Regulasi & Legalitas Terkini**:
   - Cari peraturan perundang-undangan, perpres, keputusan menteri, atau SOP asosiasi profesi terbaru yang mengatur domain tersebut di Indonesia atau internasional.
   - *Contoh*: `search_web query="standar regulasi pengadaan barang jasa enterprise corporate indonesia 2026 update terbaru"`
2. **Riset Standar Global & Sertifikasi Industri**:
   - Cari framework acuan global (misal ISO 20400 untuk Sustainable Procurement, ISO 37001 untuk Anti-Bribery, PMBOK, COBIT, TOGAF, NIST).
   - *Contoh*: `search_web query="standar ISO sustainable procurement SMAP anti penyuapan korporasi"`
3. **Riset Modus Kegagalan, Temuan Audit & Kasus Nyata**:
   - Cari temuan audit (BPK, BPKP, Internal Audit, KPK), sengketa pengadilan, celah kecurangan (*fraud red flags*), atau insiden nyata yang sering terjadi di industri.
   - *Contoh*: `search_web query="kasus sengketa audit temuan fraud pengadaan barang jasa split PO"`
4. **Riset Kurikulum & Taksonomi Kompetensi**:
   - Bandingkan daftar kompetensi yang ada di blueprint dengan standar silabus sertifikasi profesional resmi.

### Langkah 3: Analisis Gap & Penilaian Kelayakan (Completeness Evaluation)
Bandingkan temuan riset internet dengan isi domain blueprint:
- **Corpus Gaps**: Apakah ada regulasi penting yang belum dimasukkan ke dalam `sources` atau `chunks`?
- **Competency Gaps**: Apakah ada keahlian krusial yang luput dari DAG (misal: analisis ESG, deteksi benturan kepentingan, audit digital e-procurement)?
- **Oracle Realism Gaps**: Apakah skenario tugas sudah mencerminkan kondisi riil di lapangan beserta sanksi hukum/operasionalnya?
- **Adversarial Resilience**: Apakah ada skenario dilema yang cukup menantang calon pemegang otoritas?

### Langkah 4: Penyusunan Laporan Audit & Rekomendasi Patch Blueprint
Agen menyusun laporan terstruktur dengan format:
1. **Ringkasan Eksekutif & Skor Kesiapan (Readiness Score 0–100%)**.
2. **Kesesuaian 5 Pilar FlashLearn** (Evaluasi per pilar).
3. **Temuan Riset Internet & Benchmarking Industri** (Sertakan rujukan URL/dokumen hukum).
4. **Daftar Kesenjangan Kritis (Critical Gaps)**.
5. **Rekomendasi Tindakan & Patch JSON**: Siapkan potongan JSON konkret (*chunks*, *competencies*, *tasks*, atau *gates*) yang dapat langsung ditambahkan ke blueprint domain.

---

## 🛠️ CLI Script & Alat Otomasi Monorepo

Script auditor terletak di:
`scripts/audit_domain_curriculum.ts`

Dapat dijalankan melalui shortcut di root monorepo:
```bash
# 1. Audit blueprint spesifik
bun run audit:domain --file docs/samples/enterprise-procurement-blueprint.json

# 2. Strict mode (exit code 1 jika ada gap kritis atau skor < 85%)
bun run audit:domain --file docs/samples/enterprise-procurement-blueprint.json --strict

# 3. JSON mode untuk parsing agen otomatis
bun run audit:domain --file docs/samples/enterprise-procurement-blueprint.json --json
```

---

## 📋 Contoh Template Laporan Audit Domain

```markdown
# 📊 Laporan Audit Kelayakan Kurikulum Domain: [Nama Domain]
**Tanggal Audit**: [Bulan Tahun]  
**Skor Kesiapan**: [XX] / 100 ([PRODUCTION_READY / ADVISORY_GAPS / NON_COMPLIANT])

### 1. Evaluasi Keselarasan 5 Pilar FlashLearn
- **Pilar 1: Corpus of Record**: [PASS/WARN] - [Analisis spesifisitas chunk dan kutipan regulasi]
- **Pilar 2: Competency Topology**: [PASS/WARN] - [Analisis DAG dan prasyarat berarah]
- **Pilar 3: Multi-Tier Oracle**: [PASS/WARN] - [Keseimbangan Kelas A & Kelas B]
- **Pilar 4: Progressive Gates**: [PASS/WARN] - [Tingkat otorisasi L0-L3]
- **Pilar 5: Adversarial Stress**: [PASS/WARN] - [Keberadaan dilema integritas]

### 2. Temuan Riset Internet & Standar Industri 2026
- **Regulasi Acuan Terbaru**: [Sebutkan undang-undang / perpres / standar ISO yang berlaku]
- **Praktik Terbaik Industri**: [Sebutkan framework industri yang menjadi standar baku]
- **Modus Risiko & Fraud**: [Sebutkan risiko operasional nyata yang perlu diantisipasi]

### 3. Kesenjangan yang Ditemukan (Gaps)
1. **[GAP-01]**: [Deskripsi materi/kompetensi yang belum ada]
2. **[GAP-02]**: [Deskripsi oracle atau rubrik yang perlu dipertajam]

### 4. Usulan Rekomendasi Patch Blueprint (JSON)
\`\`\`json
{
  "sources": [...],
  "competencies": [...],
  "tasks": [...]
}
\`\`\`
```
