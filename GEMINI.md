# FlashLearn Developer Rules & Architecture Guide

Welcome to **FlashLearn**, an active-recall learning application built with Bun, TypeScript, Elysia.js, PostgreSQL (Drizzle ORM), Svelte 5, and Framework7 v9.1.3.

## 🚀 Quick Reference Commands
- **Install dependencies**: `bun install`
- **Run dev environment (all apps)**: `bun run dev`
- **Run backend API only**: `cd apps/api && bun run dev` (Runs on `http://localhost:3000`)
- **Run frontend Web only**: `cd apps/web && bun run dev` (Runs on `http://localhost:5173`)
- **Database migrations**: `cd apps/api && bun run db:generate` (generate SQL) & `bun run db:migrate` (safe migration runner)
- **API Documentation**: `http://localhost:3000/docs` (Scalar UI) or `http://localhost:3000/swagger`
- **Agent-First CLI**: `bun run cli <noun> <action>` (See [docs/agent-first-cli.md](docs/agent-first-cli.md))
- **Run SRP & File Length Linter**: `bun run lint:srp`
- **User Story Gap Auditor**: `bun run audit:stories` (See [AGENT.md](AGENT.md))
- **Coding Agent Manual**: See [AGENT.md](AGENT.md)
- **Run automated test suite**: `cd apps/api && bun test`
- **Cognitive Architecture Roadmap (v2.0)**: See [docs/roadmap/00_overview.md](docs/roadmap/00_overview.md)
- **Competency Engine Roadmap (v1.0)**: See [docs/roadmap-competency-engine.md](docs/roadmap-competency-engine.md)
- **Run Impeccable detector**: `npx impeccable detect`

---

## 🏛️ Architecture & Clean Code Mandates

### 1. Hexagonal Architecture (Ports & Adapters)
All backend logic in `apps/api` strictly conforms to Hexagonal boundaries:
- `src/domain/`: Pure domain entities, value objects, and repository ports (interfaces). No external dependencies.
- `src/application/use-cases/`: Single Responsibility Use Cases. Depends ONLY on domain ports.
- `src/infrastructure/`: Concrete adapters (Drizzle ORM, Google OAuth verifier, JWT token service, DI container, Elysia HTTP routes & controllers).

### 2. Dependency Injection & Interface-First
- NEVER instantiate repositories or services directly inside use cases or HTTP handlers.
- ALWAYS define an interface in `src/domain/ports/` before writing its implementation.
- Wire all implementations through the central DI container: `src/infrastructure/di/container.ts`.

### 3. Role-Based Access Control (RBAC)
- **`guest`**: Unauthenticated public learner. Can view public workspaces, read materials, take quizzes, and study generated flashcards.
- **`creator`**: Authenticated content author. Can create and manage their own workspaces, author materials/quizzes, and issue scoped API keys. Cannot edit other creators' workspaces.
- **`superadmin`**: System administrator. Can view, edit, and moderate ANY workspace in the entire database, manage user roles, and generate master API keys.

### 4. API Keys & Programmatic CRUD
- Keys are formatted as `fl_live_<random_bytes>`.
- The secret key is hashed with SHA-256 before storage in PostgreSQL (`api_keys` table).
- API requests authenticate via `Authorization: Bearer fl_live_...` or standard JWT.

### 5. Google OAuth Integration
- Client ID & Secret configured in `apps/api/.env` (shared with Cerdas stack in Infisical / Coolify).
- Flow: Frontend obtains ID Token (credential) via Google Identity Services (`gsi/client`) and posts to `/api/v1/auth/google`. The backend validates the cryptographic signature against Google's public JWKS.

### 6. Competency & Oracle Verification Evolution
The platform is transitioning into an evidence-based competency authorization engine for complex domains:
- Refer to [docs/roadmap-competency-engine.md](docs/roadmap-competency-engine.md) for Phase 01–05 specifications.
- **Invariant 1**: Mandatory deterministic citation verification against stored chunks (`source_chunks`).
- **Invariant 2**: Generator $\neq$ Verifier dual-agent boundary.
- **Invariant 4**: Strict Oracle classification (Class A: Deterministic script runner, Class B: Benchmarked case comparator, Class C: Human expert reviewer queue).

### 7. Cognitive Architecture & Scaffolding Roadmap (v2.0)
The platform is re-architected to eliminate the *Assessment-as-Instruction Fallacy* and bridge the scaffolding gap via **Dual-Loop Learning Architecture** and **4 Universal Cognitive Archetypes** (`cognitive_archetype`):
- **Overview & Invariants**: [docs/roadmap/00_overview.md](docs/roadmap/00_overview.md)
- **Phase 1 (Backend Core & Schema)**: [docs/roadmap/01_phase1_cognitive_archetypes_and_schema.md](docs/roadmap/01_phase1_cognitive_archetypes_and_schema.md)
- **Phase 2 (Dual-Loop UI Modal)**: [docs/roadmap/02_phase2_dual_loop_ui_task_runner.md](docs/roadmap/02_phase2_dual_loop_ui_task_runner.md)
- **Phase 3 (Backward Scaffolding Generator)**: [docs/roadmap/03_phase3_backward_scaffolding_generator.md](docs/roadmap/03_phase3_backward_scaffolding_generator.md)
- **Phase 4 (Procedural Parity Auditor)**: [docs/roadmap/04_phase4_procedural_parity_auditor.md](docs/roadmap/04_phase4_procedural_parity_auditor.md)
- **Phase 5 (Contrasting Domains Gauntlet)**: [docs/roadmap/05_phase5_contrasting_domains_validation.md](docs/roadmap/05_phase5_contrasting_domains_validation.md)

### 8. Safe Production Deployments & Migration Mandates (Coolify)
To guarantee zero-downtime and protect the end-to-end data pipeline from UI to database:
- **Pre-flight Advisory Lock**: `migrate.ts` automatically acquires PostgreSQL Advisory Lock `84920384` to prevent migration race conditions during rolling container deployments.
- **Safe Expand-and-Contract**: Never drop or rename columns in the same release as code changes. Add new columns as optional/nullable or with defaults.
- **Strict Migration Artifacts**: Always run `bun run db:generate` to generate tested `.sql` files into `apps/api/drizzle/` before committing. Coolify executes `bun run db:migrate` via `start.sh`.
- **Failure Isolation**: If a database migration fails, `start.sh` exits with code 1, aborting container startup so Coolify preserves the running healthy container without service disruption.

---

## 🎨 Impeccable Design & Frontend Discipline

- **No AI Slop**: Avoid purple gradient clichés, washed-out low-contrast gray text, and generic card grids.
- **Framework7 Svelte 5**: Use Framework7 v9.1.3 components with modern Svelte 5 runes (`$state`, `$derived`, `$props`).
- **Tactile Flashcard Physics**: Smooth 3D Y-axis card flip (`perspective: 1000px`, `transform-style: preserve-3d`) with spring transitions.
- **Design Tokens**: Defined in `DESIGN.md` and `PRODUCT.md`.

---

## 🗄️ Database Configuration
- **Database**: PostgreSQL 16+
- **Connection URI**: Configured via `DATABASE_URL` in `.env` (or via Infisical in production)
  ```
  DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>
  ```
