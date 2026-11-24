---
arc42_section: 8
verified_commit: d680042
verified_timestamp: 2026-11-24T13:26:03Z
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 8. Cross-Cutting Concepts

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `d680042` (branch: `main`)
> - **Verified Timestamp**: `2026-11-24T13:26:03Z`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Cross-cutting concepts span across all building blocks of FlashLearn to preserve security, persistence safety, LLM reliability, cryptographic verifiability, and UI quality.

---

## 8.1 Security & Identity Management

1. **Dual-Channel Authentication (`apps/api/src/infrastructure/http/middlewares/auth.ts`)**:
   - **Interactive Web Sessions**: Authenticated via Google Identity Services OAuth 2.0 (`GoogleAuthVerifier` -> `POST /api/v1/auth/google`), 1-click Demo Learner login (`POST /api/v1/auth/demo-login`), and signed JWT tokens (`JwtTokenService`, `Authorization: Bearer <jwt>`). Unauthenticated visitors browse public workspaces as `guest`.
   - **Headless & Agent Automation**: Scoped API keys (`fl_live_...`, stored as SHA-256 hashes in `api_keys`) accepted via either `Authorization: Bearer fl_live_...` or `x-api-key: fl_live_...`.
2. **Role-Based Access Control (RBAC)**:
   Defined in `packages/shared/src/types/user.ts` and `apps/api/src/infrastructure/database/schemas/core.ts` as three concrete roles:
   - `guest`: Unauthenticated public visitor viewing public workspaces, reading materials, and taking public quizzes.
   - `creator`: Authenticated user/learner/author who can persist learning progress, submit task attempts, claim gates/W3C credentials, author own workspaces, and issue scoped API keys.
   - `superadmin`: Platform administrator with cross-workspace moderation, role management, dispute arbitration, and master API key privileges.

---

## 8.2 Safe Persistence, Deduplication & Migration Governance

1. **Explicit Drizzle SQL Builders (`db.select()`)**:
   - All 18 repositories (`apps/api/src/infrastructure/repositories/`) and all seed modules (`apps/api/src/infrastructure/database/seed.ts`, `seeds/*.ts`) use explicit parameterized SQL query builders (`db.select().from(...).where(...)`), with zero `db.query.*` calls across the codebase.
2. **Compound Unique Constraints & Idempotency (Migrations `0007` & `0010`)**:
   - `idx_competencies_ws_code`: `(workspace_id, code)`
   - `idx_sources_ws_code`: `(workspace_id, code)`
   - `idx_gates_ws_level`: `(workspace_id, level)`
   - `idx_contents_ws_slug`: `(workspace_id, slug)`
   - `idx_tasks_comp_title`: `(competency_id, title)`
   - `idx_content_artifacts_content_kind`: `(content_id, kind)` (idempotent CLI artifact upserts)
   - Partial unique indexes `idx_lcp_content_user` and `idx_lcp_content_session` on `learner_content_progress` supporting seamless resume for both logged-in users and anonymous guest sessions (`x-learner-session`).
   - Plus `idx_mastery_user_comp_unique` `(user_id, competency_id)`, `idx_gate_req_unique` `(gate_id, competency_id)`, and `idx_content_chunk_unique` `(content_id, source_chunk_id)`.
3. **Database Migration Safety (`migrate.ts`)**:
   - Migrations in `apps/api/drizzle/` (`0000`–`0010`) execute sequentially under PostgreSQL advisory lock `84920384` (`pg_advisory_lock`) with schema integrity checks on exit.
4. **Zero Hardcoded Production Credentials**:
   - `db.ts` and `migrate.ts` throw immediately in `NODE_ENV=production` if `DATABASE_URL` is absent; `AiGatewayService` fails fast (`AI_GATEWAY_NOT_CONFIGURED`) if `AI_GATEWAY_KEY` is absent; `seed.ts` only seeds a master API key when `SEED_MASTER_API_KEY` is explicitly provided.

---

## 8.3 Fail-Fast Policy & LLM Integration Hygiene

FlashLearn enforces strict **Fail-Fast & Zero Silent Fallback** semantics:
- **Deterministic Oracles**: `OracleEvaluatorClassA` throws `ORACLE_CLASS_A_MISCONFIGURED` if a task defines zero verifiable formula/checklist criteria (preventing silent 100% auto-pass).
- **LLM Evaluators & Socratic Tutor**: `OracleEvaluatorClassB`, `OracleEvaluatorAdversarial`, and `AskSocraticTutorUseCase` propagate explicit `AI_EVALUATOR_UNAVAILABLE` / `AI_TUTOR_UNAVAILABLE` errors (HTTP `503`) when the upstream AI Gateway is unconfigured, unreachable, or returns invalid responses.
- **Resilient Gateway Transport (`AiGatewayService`)**: Uses configurable timeout (`AI_TIMEOUT_MS`, default 45s), `Bun.sleep` exponential backoff retries on HTTP 408/429/5xx and transient network failures, multi-turn `messages` forwarding, `response_format: { type: 'json_object' }` with automatic 400 compatibility retry, SSE streaming (`chatStream`), and `/api/v1/health/ai` diagnostics.
- Audited deterministically via `detect-mocks .`.

---

## 8.4 Tamper-Evident Merkle Audit Trail

1. **Transcript Integrity (`packages/shared/src/utils/merkle-transcript.ts`)**:
   - Computes deterministic SHA-256 Merkle root hashes over ordered chat turns, detects prompt-extraction attempts, and verifies transcript integrity upon attempt submission (`EvaluateAttemptUseCase`).
2. **Server-Side Socratic Hash Chain (`socratic-chat.controller.ts`)**:
   - `/api/v1/socratic/turn` chains each learner and tutor message hash (`sha256(session:turnIndex:sender:message:prevHash)`) and updates `socratic_chat_sessions.merkle_root`.
3. **Immutable Event Ledger (`audit_logs`)**:
   - Records `ORACLE_EVALUATED`, `LUMIS_CONVERSATION_RECORDED`, `ADVERSARIAL_EXTRACTION_FLAGGED`, `GATE_GRANT`, `GATE_PASSPORT_SUSPENDED_DRIFT`, and `CONTENT_GENERATED` events exportable via `ExportAuditBundleUseCase`.

---

## 8.5 Frontend Architecture, Security & UI Hygiene (`apps/web`)

1. **Framework & Reactivity**: Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$props`) + Framework7 v9.1.3.
2. **Typography**: Loaded from Google Fonts in `apps/web/index.html` and configured in `apps/web/src/styles/app.css` using **`Inter`** (body) and **`Plus Jakarta Sans`** (headings/brand).
3. **Restrained Vector Iconography & Zero-Emoticon Monograms**: Lightweight custom SVG registry (`apps/web/src/components/ui/Icon.svelte` + `iconPaths.ts`, 45 typed icons) applied selectively to icon-only controls and critical lock/verification states (zero decorative icon overload). Zero Unicode emoticons across all frontend source files, backed by `apps/web/src/lib/monogram.ts` (`getMonogram`) so legacy emoji `icon` fields stored in PostgreSQL render as clean 2-3 letter typographic monograms.
4. **XSS-Hardened Markdown Rendering (`MarkdownRenderer.svelte`)**: `marked@18` + `marked-katex-extension` + `highlight.js/lib/common` + custom `markedAlert` callouts, sanitized via `DOMPurify` with **zero inline `onclick` attributes** (code copy handled via delegated Svelte click listener reading `data-code`).
5. **Wrap-Safe & Accessible Mobile Ergonomics (`apps/web/src/styles/app.css`)**: Single-line flex-safe buttons (`.fl-btn` with `white-space: nowrap; flex-shrink: 0`), opt-in multi-line option wrapping (`.fl-btn-wrap`), horizontal scroll bars (`.fl-scroll-row`), safe fluid grids (`.fl-grid-cards` using `minmax(min(100%, 280px), 1fr)`), prose-only wrapping (`.fl-prose`), WCAG `:focus-visible` rings, `min-height: 44px` mobile touch targets, `prefers-reduced-motion` support, and user-triggered 3D Y-axis CSS flashcard flip animations without idle looping animations.
6. **Sandboxed HTML Artifact Isolation (`deck-sandbox-bridge.ts` & `AdaptiveDeckStage.svelte`)**: Interactive HTML slide decks and custom micro-simulations execute exclusively inside `<iframe sandbox="allow-scripts">` **without** `allow-same-origin` (opaque origin, zero cookie/JWT/DOM access). Pre-upload static audits (`auditHtmlArtifactSafety`) reject disallowed remote script origins and large inline base64 blobs, while `postMessage` listeners validate strict `event.source === iframeEl.contentWindow` identity.
