# Fase 5: Validasi Empiris Lintas 2 Domain Kontras (The Gauntlet)
> **Bagian dari [Roadmap Arsitektur Kognitif FlashLearn v2.0](00_overview.md)**  
> *Target: End-to-End Verification, Zero-Mock Audit, 100% Domain-Agnostic Proof*

---

## 1. Tujuan Fase
1. Menguji seluruh arsitektur yang telah dibangun pada **2 domain industri yang saling bertolak belakang (*contrasting domains*)** tanpa satu baris pun kode hardcode industri di core engine.
2. Memverifikasi perjalanan pembelajar (*learner journey*) dari awal hingga akhir:
   Login $\to$ Buka Node DAG $\to$ Bedah Worked Example $\to$ Latihan di Micro-Sandbox $\to$ Lulus Ujian Pembuktian Gate $\to$ Penerbitan Paspor Otoritas (W3C VC).
3. Membuktikan bahwa platform berhasil mengeliminasi rasa frustrasi pembelajar dan bebas dari kelima *failure modes*.

---

## 2. Spesifikasi 2 Domain Kontras

```
                      [ CORE FLASHLEARN ENGINE ]
                       (100% Domain-Agnostic)
                                  │
          ┌───────────────────────┴───────────────────────┐
          │                                               │
          ▼                                               ▼
[ DOMAIN A: Pengadaan Korporat ]             [ DOMAIN B: Kelaikan Aviasi ATA 104 ]
• Sifat: Finansial, Regulasi, Hukum          • Sifat: Teknis Presisi, Fisika, Kritis
• Arketipe Utama:                            • Arketipe Utama:
  - algorithmic_quant (TCO & NPV)              - rapid_fluency (Memory Items Pilot)
  - artifact_audit (Three-Way Matching)        - artifact_audit (Inspeksi Pitot)
  - ill_structured_case (Anti-Fraud)           - ill_structured_case (Dilema Rilis)
```

### Domain A: Manajemen Pengadaan Tingkat Enterprise (Strategic Sourcing & P2P)
* Menguji kombinasi:
  - `algorithmic_quant`: Kalkulasi TCO Storage SAN Tier-1 (Capex, Opex 4 tahun, Residual Value, PPN 11%) via *Multi-Checkpoint Diagnostic*.
  - `artifact_audit`: Audit dokumen Three-Way Matching dan deteksi anomali Split PO.
  - `ill_structured_case`: Uji stres adversarial penolakan intervensi Direksi pada anggaran akhir tahun Q4.

### Domain B: Kelaikan Sistem Avionik Pesawat (CASR 145 / ATA 104)
* Menguji kombinasi:
  - `rapid_fluency`: Ujian hafalan kilat 3D Flashcard item darurat penerbangan (*engine fire memory items*).
  - `algorithmic_quant`: Kalkulasi toleransi deviasi altimeter master instrumen ($\le 15$ kaki).
  - `ill_structured_case`: Uji stres tekanan jadwal keberangkatan maskapai komersial vs catatan kalibrasi instrumen yang belum lengkap.

---

## 3. Protokol Pengujian & Bukti Kelulusan (*The Gauntlet*)

1. **Procedural Parity Verification**: Menjalankan `bun run audit:domain` pada kedua domain; kedua domain wajib lulus dengan skor 100% kesetaraan materi-tugas.
2. **Learner Ergonomics Testing**: Membuka antarmuka UI mobile dan desktop untuk memastikan transisi dari Tab 1 (Latihan) ke Tab 2 (Ujian) berjalan tanpa hambatan visual atau layout reflow.
3. **Assessment Integrity Testing**: Menguji protokol *Graceful Downgrade*; meminta contekan langkah pada Tab 2 terbukti mengubah sesi menjadi latihan dan tidak menerbitkan Paspor Otoritas palsu.
4. **Governance Pass**: Lulus `scripts/check_srp_limits.ts` (0 error) dan `detect-mocks .` (0 mock leak).
