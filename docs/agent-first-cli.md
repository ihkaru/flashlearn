# 🤖 FlashLearn Agent-First CLI Specification & Guide
**Standard:** Agent-DX (Developer Experience for AI Coding Agents) — October 2026 Standard  
**Package:** `@flashlearn/cli` (`packages/cli/`)  
**Executable:** `bun run cli` or `packages/cli/bin/flashlearn.ts`  
**Test Suite:** `packages/cli/tests/cli.test.ts` (100% Hermetic Pass)

---

## 🏛️ Filosofi & Prinsip Desain Agent-First (Oktober 2026)

Berbeda dengan CLI konvensional yang berfokus pada *Human DX* (warna terminal, spinner ANSI, tabel teks lebar, prompt konfirmasi interaktif `[y/N]`), **FlashLearn CLI** dirancang khusus untuk **AI Coding Agents (Claude Code, Cursor, Gemini, Subagents)** dengan standar:

1. **JSON sebagai Kontrak Default:**
   Output selalu berupa JSON berstruktur standar (*predictable top-level envelope*), baik ketika dipanggil secara headless maupun via pipa shell.
2. **Pemisahan Aliran Data Ketat (*Strict Stream Separation*):**
   - `stdout`: Khusus payload data JSON murni yang dapat langsung diparsing oleh parser JSON (`jq`, subagent tools).
   - `stderr`: Khusus amplop error terstruktur (`ErrorEnvelope`) dan log operasional. Tidak ada pencemaran teks ke `stdout`.
3. **Zero Interactivity (Non-Interaktif Mutlak):**
   Tidak pernah memblokir eksekusi pada `stdin`. Seluruh tindakan destruktif (`delete`, `supersede`, `revoke`) mewajibkan flag eksplisit `--yes` atau `--force`.
4. **Safety by Design & `--dry-run`:**
   Mendukung simulasi mutasi data tanpa memodifikasi database melalui flag `--dry-run`.
5. **Introspeksi Runtime Dinamis (*Dynamic Schema Introspection*):**
   AI agent dapat memanggil `flashlearn schema` atau `flashlearn schema <noun>` kapan saja untuk mengetahui seluruh argumen yang sah, tipe data, dan contoh pemanggilan tanpa menebak atau membaca teks dokumentasi panjang.
6. **Disiplin Context Window (Optimasi Token LLM):**
   Mendukung seleksi field melalui `--fields <field1,field2>` atau `--select` sehingga respons berukuran besar dapat dipangkas sebelum masuk ke context window LLM.
7. **Semantic Exit Codes:**
   Memungkinkan agent mengambil keputusan alur kontrol (*retry*, *fix syntax*, *abort*) seketika berdasarkan kode keluar proses:
   - `0`: Sukses.
   - `1`: Kesalahan permanen/umum.
   - `2`: Kesalahan sintaks/penggunaan argumen (`USAGE_ERROR`).
   - `64` (`EX_USAGE`): Validasi skema gagal / argumen wajib hilang (`VALIDATION_ERROR`).
   - `69` (`EX_UNAVAILABLE`): Kesalahan sementara / transient network (`TRANSIENT_ERROR` — *retryable*).
   - `77` (`EX_NOPERM`): Kredensial tidak sah / akses ditolak (`PERMISSION_DENIED`).
   - `127`: Noun atau subperintah tidak ditemukan (`COMMAND_NOT_FOUND`).
8. **HATEOAS Next-Actions Pattern:**
   Setiap respons sukses menyertakan array `nextActions` yang merekomendasikan perintah lanjutan logis berikutnya, mengubah CLI menjadi *self-navigating state machine*.

---

## 📦 Format Amplop JSON (Envelopes)

### 1. Success Envelope (`stdout`)
```json
{
  "schemaVersion": "1.0.0",
  "status": "success",
  "command": "flashlearn workspace create",
  "data": {
    "id": "ws_b39d10",
    "name": "Pengadaan Publik",
    "slug": "pbj-2026"
  },
  "nextActions": [
    {
      "command": "flashlearn source ingest --workspace-id ws_b39d10 --code PERPRES-12 --title \"Perpres Pengadaan\" --file ./doc.md",
      "description": "Ingest legal/SOP corpus"
    }
  ],
  "meta": {
    "durationMs": 14,
    "timestamp": "2026-10-24T03:20:41.780Z"
  }
}
```

### 2. Error Envelope (`stderr`)
```json
{
  "schemaVersion": "1.0.0",
  "status": "error",
  "command": "flashlearn workspace delete ws_b39d10",
  "error": {
    "code": "CONFIRMATION_REQUIRED",
    "message": "Destructive action requires --yes or --force flag in non-interactive environment.",
    "retryable": false,
    "suggestedFix": "Run with `--yes`: flashlearn workspace delete ws_b39d10 --yes"
  },
  "meta": {
    "durationMs": 1,
    "timestamp": "2026-10-24T03:20:55.186Z"
  }
}
```

---

## 🗂️ Taksonomi Lengkap Resource Pembelajaran (12 Resource — Zero Omission)

| Noun | Domain Entitas | Aksi yang Didukung |
|---|---|---|
| **`workspace`** | Batas wewenang & domain pembelajaran | `list`, `get`, `create`, `delete`, `import-blueprint` |
| **`source`** | Corpus of Record (regulasi, SOP) & Chunk Hash | `list`, `get`, `chunks`, `ingest`, `supersede`, `validate-citations` |
| **`competency`** | Directed Acyclic Graph (DAG) & Mastery Ledger | `graph`, `get`, `create`, `link-prerequisite`, `approve`, `mastery` |
| **`task`** | Bank Kasus & Kunci Oracle (Kelas A, B, C) | `list`, `get`, `create`, `socratic-hint` |
| **`attempt`** | Percobaan Peserta & Telaah Pakar Kelas C | `submit`, `list`, `pending-reviews`, `review` |
| **`gate`** | Gerbang Otorisasi Wewenang (Level 0–3) & Paspor | `list`, `create`, `passports`, `verify`, `grant` |
| **`content`** | Modul Materi, Kuis, & Gabungan Berversi | `list`, `get`, `create`, `delete`, `rollback` |
| **`quiz`** | Evaluasi & Pengumpulan Jawaban Kuis | `submit` |
| **`flashcard`**| Pengulangan Berjarak Spaced Repetition (SM-2) | `due`, `practice` |
| **`audit`** | Jejak Audit Tak Terbantahkan (D8) & SHA-256 | `list`, `bundle` |
| **`apikey`** | Kunci Akses Programatik Ter-hash SHA-256 | `list`, `create`, `revoke` |
| **`auth`** | Sesi Pengguna & Konfigurasi CLI Lokal | `whoami`, `config` |
| **`schema`** | Introspeksi Skema Runtime untuk AI Agents | `introspect` |

---

## 💻 Contoh Penggunaan Perintah Utama

### 1. Introspeksi Runtime Dinamis
```bash
# Daftar seluruh resource dan aksi yang tersedia
bun run cli schema

# Introspeksi skema argumen khusus untuk task
bun run cli schema task

# Hemat token dengan seleksi field
bun run cli schema competency --fields noun,description
```

### 2. Impor Blueprint Domain Murni (Zero Hardcoding)
```bash
# Impor seluruh domain pesawat Boeing 737 secara deklaratif
bun run cli workspace import-blueprint --file ./blueprints/ata-104-avionics.json
```

### 3. Ingest Dokumen Regulasi / SOP (Corpus of Record)
```bash
bun run cli source ingest \
  --workspace-id ws_123 \
  --code PERPRES-12-2021 \
  --title "Pengadaan Barang dan Jasa Pemerintah" \
  --file ./perpres-12.md
```

### 4. Konsultasi Tutor AI Sokrates (Anti-Spoiler Shield)
```bash
bun run cli task socratic-hint task_abc \
  --question "Bagaimana menentukan apakah keuntungan 15% melebihi batas regulasi?"
```

### 5. Ekspor Bundel Kepatuhan Regulasi Terdesentralisasi
```bash
bun run cli audit bundle --workspace-id ws_123 --output ./audit-export.json
```

---

## 🔒 Variabel Lingkungan & Kredensial
- `FL_API_URL`: Base URL backend API FlashLearn (default: `http://localhost:3000`).
- `FL_API_KEY`: Scoped API Key peserta/pakar (`fl_live_...`).
- `FL_TOKEN`: JWT session token pengguna.
- `FL_WORKSPACE`: Default workspace UUID yang digunakan pada sesi terminal aktif.
