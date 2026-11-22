---
arc42_section: 2
verified_commit: e0c0277
verified_timestamp: 2026-11-22T09:36:39Z
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 2. Architecture Constraints

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `3f27daa` (branch: `main`)
> - **Verified Timestamp**: `2026-11-22T14:10:12+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Architecture constraints restrict design freedom and implementation choices across the FlashLearn monorepo. Every contributor and autonomous coding agent must comply with these technical, organizational, and convention constraints.

---

## 2.1 Technical Constraints

| Constraint ID | Category | Constraint Description | Motivation & Impact |
|---|---|---|---|
| **TC-01** | Runtime & PM | **Bun 1.4.2 Enforced** | High performance, low memory footprint, and native TypeScript execution on Linux ARM64 containers (`oven/bun:1.4-alpine`). Direct calls to `npm`/`npx` are blocked by environment shims. |
| **TC-02** | Frontend | **Svelte 5 Runes + Framework7 v9.1.3** | Pure reactivity using `$state`, `$derived`, `$effect`, and `$props`. Legacy Svelte 4 stores (`svelte/store`) and `$:` reactive statements are prohibited (0 occurrences verified). |
| **TC-03** | Backend Engine | **Elysia.js 1.4 + Hexagonal Architecture** | TypeBox-validated HTTP controllers in `apps/api/src/infrastructure/http/`. Domain entities, ports, and domain services in `apps/api/src/domain/` have zero HTTP/ORM framework dependencies. |
| **TC-04** | Persistence | **PostgreSQL 16+ via Drizzle ORM (`db.select()`)** | Relational storage with hard unique indexes (`0007`), cascade safety, and advisory-locked SQL migrations (`migrate.ts`). All repositories and seed scripts use explicit SQL builders (`db.select()`) rather than unmapped relational `db.query.*` calls (0 `db.query` occurrences verified). |
| **TC-05** | Hosting & Container | **Coolify Containerized on ThinkStation** | Multi-stage Docker container (`Dockerfile`, `start.sh`) serving both Elysia API and compiled Vite SPA on port `3000`, fronted by Traefik with SSE buffering disabled (`X-Accel-Buffering: no`). |
| **TC-06** | Open Standards | **W3C Verifiable Credentials 2.0 & Ed25519** | Credentials conform to W3C VC 2.0 / OpenBadges 3.0 signed with `DataIntegrityProof` (`eddsa-rdfc-2022`) via Node/Bun native `node:crypto` Ed25519. |
| **TC-07** | LLM Connectivity | **OpenAI-Compatible Gateway Port (`IAiGateway`)** | All LLM calls route through `AiGatewayService` (`POST /chat/completions` JSON & SSE streaming, `GET /models` health check) configured via environment variables (`AI_GATEWAY_URL`, `AI_GATEWAY_KEY`, `AI_TIMEOUT_MS`). Zero hardcoded API keys in source. |

---

## 2.2 Organizational & Governance Constraints

| Constraint ID | Category | Constraint Description | Motivation & Impact |
|---|---|---|---|
| **OC-01** | Code Hygiene | **Strict File Length Budget (< 400 Lines)** | Every `.ts`, `.js`, and `.svelte` source file must stay under 400 lines (`bun run lint:srp` via `scripts/check_srp_limits.ts`), with a soft guidance target of < 200 lines for Svelte components. |
| **OC-02** | Integrity | **Zero-Mock & Fail-Fast Policy** | Production paths (`src/`) must contain zero mock libraries, zero fake latency (`setTimeout` sleeps), and zero silent fallbacks masking offline LLMs or misconfigured oracles. Audited deterministically via `detect-mocks .`. |
| **OC-03** | Agnosticism | **100% Domain-Agnostic Core Engine** | Core domain/application code (`apps/api/src/domain/`, `apps/api/src/application/`, `apps/web/src/`, `packages/shared/src/`) must not hardcode domain statutes or industry-specific scenarios (`BackwardScaffoldingGenerator` and `CorpusReferenceCard` derive dynamically from DB records). Canonical bootstrap seeds are isolated solely inside `apps/api/src/infrastructure/database/seeds/`. |
| **OC-04** | Methodology | **Old Coder Evidence-First Verification** | Every change must be backed by empirical command outputs (`tsc --noEmit`, `bun test`, `bun run lint:srp`, `detect-mocks .`, `bun run lint:arc42:strict`, Vite build). |

---

## 2.3 Conventions & Standards

| Constraint ID | Category | Constraint Description |
|---|---|---|
| **CV-01** | API Architecture | Hexagonal Ports & Adapters with constructor Dependency Injection wired centrally in `apps/api/src/infrastructure/di/base.container.ts` and `container.ts`. |
| **CV-02** | Graph Theory | Prerequisite DAGs verified acyclic via Tarjan's Strongly Connected Components (`packages/shared/src/utils/graph-validator.ts`) and DFS cycle checks (`CompetencyGraphEngine.hasCycle`). |
| **CV-03** | Versioning | Semantic Versioning 2.0.0 (`vMAJOR.MINOR.PATCH`) and forward-only numbered Drizzle SQL migrations (`apps/api/drizzle/0000`–`0009`). |
| **CV-04** | Documentation | Modular 12-file arc42 documentation under `docs/architecture/` with Git provenance headers enforced via `arc42-lint` and `.git/hooks/pre-commit`. |
