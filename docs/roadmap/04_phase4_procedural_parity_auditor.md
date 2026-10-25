# Fase 4: Engine Auditor Kurikulum (Procedural Parity Check)
> **Bagian dari [Roadmap Arsitektur Kognitif FlashLearn v2.0](00_overview.md)**  
> *Target: Deterministic Static Code & Curriculum Analysis, Governance CLI, Anti-Defect Gate*

---

## 1. Tujuan Fase
1. Membangun gerbang audit otomatis (*Procedural Parity Auditor*) yang memvalidasi kesetaraan langkah kerja antara materi latihan di Tab 1 dengan tuntutan ujian di Tab 2.
2. Memastikan sistem secara deterministik menolak domain yang mengalami **`MISSING_SCAFFOLDING_DEFECT`** (misal: di ujian menuntut kalkulasi NPV 10% dan depresiasi 5 tahun, namun di modul hanya ada teks definisi umum tanpa contoh cara berhitungnya).
3. Mengintegrasikan audit ini ke dalam perintah pipeline pra-rilis (`scripts/audit_domain_curriculum.ts` dan `agy-ops gate`).

---

## 2. Aturan Invarian Audit (*Audit Invariants*)

```
[ Domain Blueprint / Workspace ]
               │
               ▼
   [ Procedural Parity Auditor ]
               │
   ┌───────────┴───────────┐
   │                       │
   ▼                       ▼
Lulus Paritas      Cacat Paritas Kognitif
   │                       │
   ▼                       ▼
Status: 100% READY     Status: REJECTED
                       Error: MISSING_SCAFFOLDING_DEFECT
                       ↳ Operasi X pada Task Y tidak memiliki
                         representasi Worked Example di Tab 1.
```

### A. Kriteria Pengecekan per Arketipe Kognitif:
1. **Untuk `algorithmic_quant`**:
   - Setiap variabel kalkulasi dan konstanta operasional dalam `oracleData.variables` atau rumus wajib memiliki variabel padanan di *Worked Example* Tab 1.
2. **Untuk `artifact_audit`**:
   - Setiap *Negative Anchor* atau klausul anomali yang wajib dideteksi pada dokumen ujian wajib terdaftar dalam katalog cacat / checklist di Tab 1.
3. **Untuk `ill_structured_case`**:
   - Setiap skenario adversarial dilemma di Tab 2 wajib memiliki minimal satu contoh kasus kontras (*contrasting case*) di Tab 1 yang mendemonstrasikan batasan kewenangan dan konsekuensi hukum.
4. **Untuk `rapid_fluency`**:
   - Setiap butir ujian *time-boxed* wajib memiliki kartu flashcard padanan di Tab 1.

### B. Format Output & Exit Code Deterministik:
* Exit code `0`: Domain memenuhi 100% Procedural Parity.
* Exit code `1`: Ditemukan jurang kognitif (*scaffolding gap*), disertai laporan rinci baris dan node yang cacat.

---

## 3. Kriteria Keberhasilan (Acceptance Criteria)

- [ ] Script `scripts/audit_domain_curriculum.ts` mampu mendeteksi ketiadaan worked example pada node secara deterministik.
- [ ] Menjalankan `bun run audit:domain` memvalidasi seluruh domain yang terpasang di database.
- [ ] Domain dengan jurang materi vs tugas tidak dapat dipublikasikan (*is_published = false*) hingga materi pelengkap dilengkapi.
