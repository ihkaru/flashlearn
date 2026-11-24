# Phase 21: Enterprise Security Hardening (November 2026 OWASP Compliance)

- **Parent Roadmap**: [docs/ROADMAP.md](../ROADMAP.md)
- **Audit Baseline**: Source-first security audit (OWASP API Security Top 10 2026, Bun/Elysia, Svelte 5, W3C VC, CLI parsing) + `osv-scanner 2.7.0`
- **Target**: Menutup seluruh celah batas kepercayaan (*trust boundary violations*) tingkat **Critical**, **High**, **Medium**, dan **Low** dengan regresi tes hermetik.

---

## 1. Matriks Temuan Audit Terverifikasi

### Critical (4 Temuan)
| ID | Komponen | Celah Batas Kepercayaan | Remediasi Terkecil & Efektif |
| :--- | :--- | :--- | :--- |
| **CRIT-01** | `apps/api/src/infrastructure/http/controllers/auth.controller.ts` | `/api/v1/auth/demo-login` aktif tanpa syarat di produksi dan menerbitkan JWT valid untuk email `creator` mana pun (account takeover). | Gate ketat dengan `ENABLE_DEMO_LOGIN === 'true'` && `NODE_ENV !== 'production'`, kunci ke 1 akun sandbox tetap (`learner@flashlearn.dev`) yang tidak pernah terhubung Google OAuth. |
| **CRIT-02** | `apps/api/src/infrastructure/services/JwtTokenService.ts` | Hardcoded fallback `JWT_SECRET` + `jwt.verify` tanpa `algorithms: ['HS256']`. | Hapus fallback di produksi (fail-fast jika `JWT_SECRET` kosong / `< 32` byte kecuali `NODE_ENV === 'test'`), kunci `algorithms: ['HS256']` pada `sign` & `verify`. |
| **CRIT-03** | `apps/api/src/infrastructure/http/controllers/credential.controller.ts`, `VerifyVerifiableCredentialUseCase.ts` | `POST /api/v1/credentials/verify` menerima `publicKeyPem` dari pemanggil tak tepercaya sehingga VC palsu lolos `{ valid: true }`. | Hapus `publicKeyPem` dari request HTTP publik; wajib resolusi kunci publik dari `workspace_keypairs` di DB & verifikasi `credential.issuer.id`. |
| **CRIT-04** | `gate.controller.ts`, `competency.controller.ts`, `reviewer.controller.ts`, `credential.controller.ts` | Rantai pemalsuan W3C VC Ed25519 asli: buat gate kosong lintas tenant, self-attest mastery (`POST /:id/mastery`), self-review Class C (`POST /reviewer/evaluate`), lalu terbitkan VC untuk `userId` mana pun. | Terapkan `assertWorkspaceOwner` pada `POST /gates/`, `POST /reviewer/evaluate` (+ larang self-review `attempt.userId === auth.user.id`), batasi `POST /:id/mastery` & `unaided-sandbox-pass` hanya untuk owner/superadmin, dan kunci `POST /credentials/issue` ke `auth.user.id` atau owner/superadmin. |

### High (5 Temuan)
| ID | Komponen | Celah Batas Kepercayaan | Remediasi Terkecil & Efektif |
| :--- | :--- | :--- | :--- |
| **HIGH-01** | `domain`, `competency`, `task`, `source`, `consensus`, `drift` controllers | Cross-tenant write/delete BOLA (IDOR): `creator` A bisa mengubah/menghapus domain, kompetensi, task, source (`supersede`), atau memicu drift/consensus di workspace `creator` B. | Buat helper terpusat `assertWorkspaceOwner` / `resolveWorkspaceAccess` dan tegakkan di setiap rute mutasi; kunci `POST /drift/process-batch` hanya untuk `superadmin` dan turunkan `userId`/`arbiterId` dari `auth.user.id`. |
| **HIGH-02** | `task`, `quiz`, `audit`, `reviewer`, `diagnostic`, `workspace`, `source`, `domain`, `competency`, `gate`, `drift`, `consensus` controllers | Sensitive read BOLA/IDOR: `GET /tasks/*` membocorkan `oracleData` & `adversarialSpec`; `GET /contents/:id/flashcards` membocorkan kunci jawaban kuis tanpa cek privasi; `GET /audit/logs` & `GET /tasks/:id/attempts` & `GET /reviewer/pending` lintas tenant. | Scrub `oracleData`/`adversarialSpec` kecuali owner; tegakkan visibilitas workspace pada seluruh rute baca; batasi `audit/*`, `reviewer/pending`, `drift/audit` ke owner/superadmin; scope `tasks/:id/attempts` dan `diagnostic/*` ke `auth.user.id` atau owner. |
| **HIGH-03** | `apps/api/src/infrastructure/http/controllers/socratic-chat.controller.ts` | `/session/:id`, `/active`, dan `/turn` tidak memanggil `resolveAuth` → proksi AI gratis tanpa autentikasi & manipulasi Merkle session user lain. | Wajibkan `resolveAuth` (401 jika unauthenticated), gunakan `auth.user.id`, dan verifikasi `session.userId === auth.user.id`. |
| **HIGH-04** | `apps/api/src/infrastructure/http/middlewares/auth.ts` & controllers | Array `permissions` pada API key terverifikasi tetapi tidak pernah ditegakkan. | Tambahkan `requirePermission(auth, scope)` dan tegakkan pada rute mutasi & manajemen API key. |
| **HIGH-05** | `apps/web/src/components/ui/MarkdownRenderer.svelte` | Fail-open Stored XSS: blok `catch` mengembalikan `content` mentah langsung ke `{@html html}` tanpa sanitasi. | Pada `catch`, kembalikan teks ter-escape aman / `DOMPurify.sanitize(content, { ALLOWED_TAGS: [] })`. |

### Medium (7 Temuan)
| ID | Komponen | Celah | Remediasi |
| :--- | :--- | :--- | :--- |
| **MED-01** | `DrizzleCredentialRepository.ts` | Private key Ed25519 disimpan plaintext di PostgreSQL. | Enkripsi envelope AES-256-GCM opsional/otomatis saat `CREDENTIAL_KMS_KEY` tersedia (backward-compatible untuk key lama saat migrasi). |
| **MED-02** | `media.controller.ts`, `MediaAssetUseCases.ts` | Aset workspace privat dikirim dengan `Cache-Control: public, max-age=31536000, immutable`. | Kembalikan `isPublic` dari use case; gunakan `Cache-Control: private, max-age=3600` + `Vary: Authorization, x-api-key` jika `!isPublic`. |
| **MED-03** | `interactive.controller.ts`, `SaveLearnerProgressUseCase.ts` | `sessionKey` diterima lewat query string (bocor ke log/Referer) dengan batas minimal 6 karakter; `SaveLearnerProgressUseCase` tidak memeriksa visibilitas workspace. | Tolak `sessionKey` dari query string (header-only), minimal 16 karakter; cek akses workspace di `SaveLearnerProgressUseCase`. |
| **MED-04** | `apps/api/src/index.ts` | CORS `origin: true, credentials: true` memantulkan semua origin; `/api/v1/health/ai` & `/docs` terbuka tanpa batas di produksi. | Batasi CORS lewat `CORS_ALLOWED_ORIGINS` (default aman); lindungi `/api/v1/health/ai` dengan `superadmin` di produksi; nonaktifkan `/docs` di produksi kecuali `ENABLE_API_DOCS=true`. |
| **MED-05** | `GoogleAuthVerifier.ts`, `LoginWithGoogleUseCase.ts` | Tidak memverifikasi `payload.email_verified === true`; fallback email superadmin hardcoded. | Wajibkan `payload.email_verified === true`; hapus fallback email hardcoded (hanya baca `SUPERADMIN_EMAILS`). |
| **MED-06** | `packages/cli/src/core/corpus/extract-epub.ts`, `extract-pptx.ts`, `xml-utils.ts` | Unbounded `unzipSync` (Zip Bomb OOM DoS) & crash `String.fromCodePoint` / `decodeURIComponent`. | Tambahkan `filter` ukuran & rasio kompresi (cap 100 MB, rasio <= 100:1), validasi range codepoint `<= 0x10FFFF`, dan `try/catch` pada `decodeURIComponent`. |
| **MED-07** | `packages/shared/src/utils/deck-sandbox-bridge.ts`, `OracleEvaluatorClassB.ts`, `OracleEvaluatorAdversarial.ts` | Bypass allowlist script (`//evil.tld` / unquoted `src=`) + tanpa CSP di sandbox deck; direct prompt injection pada AI Oracle. | Tambahkan `<meta http-equiv="Content-Security-Policy">` ketat di `buildSandboxedDeckHtml`, tolak protocol-relative/unquoted `src=`; bungkus `submissionText` dengan delimiter XML eksplisit & instruksi anti-injection di kedua Oracle. |

### Low & Supply-Chain CVEs
- **LOW-01**: `Dockerfile` runner stage berjalan sebagai `root` → ubah ke `USER bun`.
- **LOW-02**: Tambahkan header keamanan standar OWASP (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security` di produksi) + in-memory token-bucket rate limiter untuk `/api/v1/auth/*` dan `/api/v1/socratic/*` + containment check `resolve(candidate).startsWith(resolve(publicDir) + sep)`.
- **LOW-03**: Validasi magic bytes (`png`/`jpeg`/`gif`/`webp`) + batas ukuran `t.File({ maxSize: '10m' })` di `media.controller.ts`.
- **LOW-04**: Validasi slug `/^[a-z0-9-]+$/` di `CreateContentUseCase` & containment check di `packages/cli/src/core/plan/plan-remote-pull.ts`.
- **CVE-01 (`osv-scanner`)**: Perbarui paket rentan yang tersedia patch-nya (`vite`, `zod`, `esbuild`, `shell-quote`, `source-map-js`, `uuid`) dan audit penggunaan `xlsx`.

---

## 2. Verifikasi & Kriteria Lulus (The Gauntlet)
- Unit test regresi keamanan khusus (`apps/api/tests/phase21_security_hardening.test.ts` + `packages/shared/tests/` + `packages/cli/tests/`).
- `bun test` hijau di `packages/shared`, `packages/cli`, dan `apps/api`.
- `tsc --noEmit` & `vite build` bersih (0 error).
- `osv-scanner scan source -r .` berkurang drastis / nol Critical & High yang bisa di-patch.
- `bun run lint:srp`, `detect-mocks .`, dan `bun run lint:arc42:strict` lulus 100%.
