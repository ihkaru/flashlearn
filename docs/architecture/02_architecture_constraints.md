---
arc42_section: 2
verified_commit: ca8fea2
verified_timestamp: 2026-10-25T23:23:00+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 2. Architecture Constraints

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `2757f63` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T22:34:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

Architecture constraints restrict design freedom and implementation choices across the FlashLearn codebase. Every contributor and autonomous coding agent must comply with these technical, organizational, and convention constraints.

---

## 2.1 Technical Constraints

| Constraint ID | Category | Constraint Description | Motivation & Impact |
|---|---|---|---|
| **TC-01** | Runtime & PM | **Bun 1.4.2 Enforced** | High performance, memory safety, and native TypeScript execution on Linux ARM64 containers. Direct calls to `npm`/`npx` are blocked by shims. |
| **TC-02** | Frontend | **Svelte 5 Runes Only** | Pure reactivity using `$state`, `$derived`, and `$props`. Legacy Svelte 4 store patterns or reactive assignments (`$:`) are prohibited. |
| **TC-03** | Backend Engine | **Elysia.js + Hexagonal Architecture** | High-throughput TypeBox-validated HTTP routing. Clean domain separation: domain entities and ports have zero framework dependencies. |
| **TC-04** | Persistence | **PostgreSQL 16+ via Drizzle ORM** | PostgreSQL relational storage with strict foreign keys, cascade safety, and unique index invariants. Relational ORM queries (`db.query`) requiring unmapped schemas are replaced with deterministic SQL query builders (`db.select()`). |
| **TC-05** | Hosting & Container | **Coolify Containerized on ThinkStation** | Multi-stage Docker container deployed on ARM64 Linux under 256MB RAM constraints, fronted by Traefik with real-time SSE support. |
| **TC-06** | Open Standards | **W3C Verifiable Credentials 2.0 & Ed25519** | Standardized cryptographic identity proofs (OpenBadges 3.0 specification) with detached JWS Ed25519 signatures. |

---

## 2.2 Organizational & Governance Constraints

| Constraint ID | Category | Constraint Description | Motivation & Impact |
|---|---|---|---|
| **OC-01** | Code Hygiene | **Strict File Length Budget (< 400 Lines)** | Every source file must remain under 400 lines of code, audited deterministically via `bun run lint:srp` (`scripts/check_srp_limits.ts`). Bloated files must be decomposed into cohesive subcomponents. |
| **OC-02** | Integrity | **Zero-Mock & Zero Silent Fallback Policy** | Production pathways (`src/`, `lib/`, `app/`) must contain zero mock libraries (`unittest.mock`, `sinon`, `jest`), zero bodyless dummy returns (`return 0`, `Ok(())`), and zero swallowed exceptions. Audited via `detect-mocks .`. |
| **OC-03** | Agnosticism | **100% Domain-Agnostic Core Engine** | Core entities, controllers, and UI components must never hardcode industry terms (e.g. procurement, aviation, clinical). All domain specifics reside strictly in database blueprints. |
| **OC-04** | Methodology | **Old Coder Evidence-First TDD Doctrine** | Code reviews inspect execution evidence (terminal test output, compiler exit codes, and live UI captures), not speculative assertions. |

---

## 2.3 Conventions & Standards

| Constraint ID | Category | Constraint Description |
|---|---|---|
| **CV-01** | API Architecture | Request-Endpoint-Response (REPR) pattern combined with Hexagonal Domain/Application/Infrastructure layers. |
| **CV-02** | Graph Theory | Prerequisite DAGs verified via Tarjan's Strongly Connected Components (SCC) algorithm to prevent deadlocks and circular loops. |
| **CV-03** | Versioning | Semantic Versioning 2.0.0 (`vMAJOR.MINOR.PATCH`) aligned with deterministic pre-flight release gates. |
| **CV-04** | Documentation | arc42 modular numbered files with Git provenance headers and automated static consistency linting (`arc42-lint`). |
