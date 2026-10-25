---
arc42_section: 8
verified_commit: ca8fea2
verified_timestamp: 2026-10-25T23:23:00+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 8. Cross-Cutting Concepts

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `2757f63` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T22:34:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Cross-cutting concepts span across all components and tiers of FlashLearn to maintain architectural integrity, operational reliability, and cryptographic trust.

---

## 8.1 Security & Identity Management

1. **Dual-Channel Authentication**:
   - **Interactive Web Sessions**: Authenticated via JWT bearer tokens and Google OAuth 2.0 (`GoogleAuthVerifier`). Guests can explore workspaces without an account via transient guest sessions.
   - **Headless & Agent Automation**: High-entropy master API keys (`fl_live_...`) passed via `Authorization: Bearer <key>` or `x-api-key` headers.
2. **Role-Based Access Control (RBAC)**:
   - `guest`: Read public modules, attempt quizzes and DAG sandbox tasks.
   - `learner`: Save persistent progress, take official gate exams, receive W3C Verifiable Credentials.
   - `creator`: Author and import domain blueprints, manage sources and competency graphs.
   - `superadmin`: Manage API keys, arbitrate dispute reviews, and configure global platform settings.

---

## 8.2 Safe Persistence, Deduplication & Migration Governance

1. **Drizzle ORM & Explicit SQL Builder Pattern**:
   - To prevent runtime relational mapping failures (`undefined is not an object`), all persistence logic uses explicit, deterministic SQL queries (`db.select().from(...).where(...)`).
2. **Hard Unique Constraints & Idempotent Seeding**:
   - Multi-tenant data integrity is protected by unique compound database indexes:
     - `idx_competencies_ws_code`: `(workspace_id, code)`
     - `idx_sources_ws_code`: `(workspace_id, code)`
     - `idx_gates_ws_level`: `(workspace_id, level)`
     - `idx_contents_ws_slug`: `(workspace_id, slug)`
     - `idx_tasks_comp_title`: `(competency_id, title)`
3. **Database Migration Safety**:
   - Migrations in `apps/api/drizzle/` execute sequentially with PostgreSQL advisory locks (`pg_advisory_lock`), preventing race conditions during simultaneous container deployments.

---

## 8.3 Fail-Fast Policy & Zero Silent Fallbacks

FlashLearn strictly enforces the **Fail-Fast Doctrine**:
- Missing prerequisites, unmapped domain models, or broken database invariants must throw typed errors (`Error: Competency not found`) immediately.
- Production code must never return silent stubs or fake successes (`return true;`, `return 0;`, `catch(e) {}`) to mask failures.
- Audited deterministically before every deployment via `detect-mocks .`.

---

## 8.4 Tamper-Evident Merkle Conversational Audit Trail

Every learner interaction—including Socratic AI tutor exchanges and Oracle submissions—is hashed into a cryptographic Merkle tree (`sha256`):
- Leaf hashes represent individual conversational turns and code submissions.
- The Merkle root hash is stored alongside the official `attempts` ledger record.
- Any retroactive tampering with conversation logs invalidates the cryptographic root hash, guaranteeing audit readiness under international compliance standards.

---

## 8.5 UI Design Hygiene & 120Hz Native Compositing

All UI components in `apps/web` conform to enterprise hygiene invariants:
1. **GPU Compositor-Only Animations**: Transitions use `transform: translate3d` and `opacity` with `will-change: transform` to guarantee smooth 120fps/144fps rendering on mobile displays without triggering CPU layout reflows.
2. **Zero Emoticon Policy**: Unicode emojis are prohibited in system UI controls; vector icons from `lucide-svelte` and Framework7 SVG icons are used exclusively.
3. **Typography**: Enforced Google Sans family (`Google Sans`, `Google Sans Text`, `Google Sans Code`) in styling and theme configurations.
4. **Mobile Ergonomics**: All interactive elements maintain touch envelopes $\ge 44\text{px}$ with `[overflow-wrap:anywhere]` to eliminate layout breakage on small viewports.
