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
3. **Filter & Limit from Last Line (Optimasi Token LLM):**
   - `--tail <n>` / `--last <n>`: Memotong dan mengambil HANYA $N$ baris/item terakhir (sangat krusial untuk log audit, chunk terbaru, attempt terakhir tanpa menghabiskan context window).
   - `--limit <n>` & `--offset <n>`: Paginasi maju dari awal daftar.
   - `--filter <k=v>`: Menyaring item berdasarkan key-value atau pencarian substring (misal `--filter role=creator` atau `--filter action=ORACLE_EVALUATED`).
   - `--fields <f1,f2>`: *Field masking* untuk memproyeksikan hanya properti yang dibutuhkan agent.
4. **Sistem Bantuan Terstruktur Lengkap (*Comprehensive Help System*):**
   - Tingkat Global: `flashlearn --help` menyajikan taksonomi seluruh 13 noun dan flag global.
   - Tingkat Noun: `flashlearn <noun> --help` menyajikan daftar aksi dan contoh pemanggilan.
   - Tingkat Aksi Granular: `flashlearn <noun> <action> --help` menyajikan tipe argumen, status wajib/opsional, dan contoh konkret.
5. **Zero Interactivity (Non-Interaktif Mutlak):**
   Tidak pernah memblokir eksekusi pada `stdin`. Seluruh tindakan destruktif (`delete`, `supersede`, `revoke`) mewajibkan flag eksplisit `--yes` atau `--force`.
6. **Safety by Design & `--dry-run`:**
   Mendukung simulasi mutasi data tanpa memodifikasi database melalui flag `--dry-run`.
7. **Introspeksi Runtime Dinamis (*Dynamic Schema Introspection*):**
   AI agent dapat memanggil `flashlearn schema` atau `flashlearn schema <noun>` kapan saja untuk mengetahui seluruh argumen yang sah, tipe data, dan contoh pemanggilan tanpa menebak atau membaca teks dokumentasi panjang.
8. **Semantic Exit Codes:**
   Memungkinkan agent mengambil keputusan alur kontrol (*retry*, *fix syntax*, *abort*) seketika berdasarkan kode keluar proses:
   - `0`: Sukses.
   - `1`: Kesalahan permanen/umum.
   - `2`: Kesalahan sintaks/penggunaan argumen (`USAGE_ERROR`).
   - `64` (`EX_USAGE`): Validasi skema gagal / argumen wajib hilang (`VALIDATION_ERROR`).
   - `69` (`EX_UNAVAILABLE`): Kesalahan sementara / transient network (`TRANSIENT_ERROR` — *retryable*).
   - `77` (`EX_NOPERM`): Kredensial tidak sah / akses ditolak (`PERMISSION_DENIED`).
   - `127`: Noun atau subperintah tidak ditemukan (`COMMAND_NOT_FOUND`).
9. **HATEOAS Next-Actions Pattern:**
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

### 1. Introspeksi Runtime Dinamis & Sistem Bantuan Lengkap
```bash
# Bantuan global & taksonomi 13 resource
bun run cli --help

# Bantuan spesifik satu noun
bun run cli task --help

# Bantuan granular level aksi (argumen, tipe data, contoh)
bun run cli task create --help

# Daftar seluruh schema argumen untuk agen
bun run cli schema task
```

### 2. Diagnosa Kondisi & Kesiapan Domain (Agent Gap Analysis)
AI Coding Agent dapat memeriksa kesehatan, kelengkapan, dan statistik sebuah domain untuk mengetahui apa yang masih kurang/belum valid:
```bash
# Diagnosa kondisi domain, topologi DAG, gap analisis, dan rekomendasi aksi
bun run cli workspace describe pbj-2026

# Output menyajikan:
# - statistics (jumlah sumber, chunks, kompetensi, tasks, gates, materi)
# - dagIntegrity (deteksi siklus, root nodes, terminal nodes)
# - gaps (kompetensi tanpa task, gerbang otorisasi yang belum dibuat, node belum disahkan pakar)
# - readiness (skor kesiapan 0-100% dan status PRODUCTION_READY / INCOMPLETE_DRAFT)
# - recommendations (daftar perintah CLI konkret untuk melengkapi gap yang ditemukan)
```

### 3. Optimasi Token LLM: Filter & Limit from Last Line
```bash
# Ambil HANYA 5 catatan audit terakhir (memotong ribuan log agar hemat token)
bun run cli audit list --workspace-id ws_123 --last 5

# Ambil 3 chunk terakhir dari sebuah regulasi
bun run cli source chunks src_123 --tail 3

# Filter berdasarkan status dan ambil 2 entri terakhir dengan proyeksi field tertentu
bun run cli competency graph --workspace-id ws_123 --filter status=mastered --last 2 --fields id,code,title
```

### 3. Pembuatan Seluruh Materi & Tahapan Pembelajaran via CLI
```bash
# A. Buat modul Materi bacaan
bun run cli content create \
  --workspace-id ws_123 \
  --title "Prinsip Dasar Pengadaan" \
  --type materi \
  --body "# Bab 1: Transparansi\nSemua proses wajib terbuka..."

# B. Buat modul Kuis dengan daftar pertanyaan & kunci terstruktur
bun run cli content create \
  --workspace-id ws_123 \
  --title "Kuis Batasan Biaya" \
  --type quiz \
  --questions '[{"id":"q1","question":"Berapa batas overhead?","options":[{"id":"o1","text":"15%","isCorrect":true}],"explanation":"Maksimal 15%"}]'

# C. Buat Task Oracle Kelas A (Kalkulasi Deterministik)
bun run cli task create \
  --competency-id comp_123 \
  --title "Kalkulasi HPS Laptop" \
  --scenario "Hitung HPS dengan dasar 100jt, overhead 15%, PPN 11%" \
  --type calculation \
  --oracle '{"expectedFormulas":{"total":{"expectedValue":127650000,"tolerance":100}}}' \
  --rubric '[{"id":"total","title":"Total Akurat","weight":100,"description":"Sesuai acuan"}]'

# D. Buat Gerbang Otorisasi Wewenang (Level 3: Mandiri)
bun run cli gate create \
  --workspace-id ws_123 \
  --level 3 \
  --title "Wewenang Tanda Tangan Mandiri" \
  --description "Hak menandatangani paket pengadaan risiko tinggi"
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
