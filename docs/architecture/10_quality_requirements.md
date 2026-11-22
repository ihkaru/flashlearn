---
arc42_section: 10
verified_commit: 9f770ab
verified_timestamp: 2026-11-22T07:30:00+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 10. Quality Requirements

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `9f770ab` (branch: `main`)
> - **Verified Timestamp**: `2026-11-22T07:30:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section specifies the Quality Tree and concrete Quality Scenarios using the Q42 Quality Model, tracing directly to the four quality goals defined in Section 1.2.

---

## 10.1 Quality Tree

```text
FlashLearn Quality Tree
├── Correctness (#correctness)
│   ├── QS-01: Multi-Tier Oracle Determinism & Fail-Fast Integrity
│   └── QS-05: Procedural Parity, DAG Acyclicity & Scaffolding Soundness
├── Maintainability (#maintainability)
│   └── QS-02: Single Responsibility Budget, Type Safety & Zero-Mock Compliance
├── Performance (#performance)
│   └── QS-03: Sub-50ms Non-LLM API Latency & Low-RAM Container Footprint
└── Security (#security)
    └── QS-04: Cryptographic W3C VC 2.0, Merkle Audit Trail & XSS/Secret Hygiene
```

---

## 10.2 Concrete Quality Scenarios (Q42 Model)

### QS-01: Multi-Tier Oracle Determinism & Fail-Fast Integrity
- **Quality Property**: #correctness
- **Stimulus**: A learner submits numerical calculations for a Class A task (in `expectedFormulas` or `variables` format), or submits a Class B / Adversarial case study while the AI Gateway is offline or misconfigured.
- **Environment**: Production API or hermetic test runner.
- **Response**: `OracleEvaluatorClassA` enforces $\le \pm 1\%$ default relative tolerance and throws `ORACLE_CLASS_A_MISCONFIGURED` if no verifiable criteria exist; `OracleEvaluatorClassB` and `OracleEvaluatorAdversarial` throw `AI_EVALUATOR_UNAVAILABLE` (HTTP 503) instead of silently passing. `GateAuthorizationEngine` blocks gates requiring $\ge 2$ observations until `passed_variant_codes` meets `requiredObservationsCount`.
- **Measurement**: 100% pass on hermetic test suite (`apps/api/tests/llm_and_oracle_integrity.test.ts`); 0 silent auto-passes.

### QS-02: Single Responsibility Budget, Type Safety & Zero-Mock Compliance
- **Quality Property**: #maintainability
- **Stimulus**: Developer or coding agent modifies source files across `apps/` or `packages/`.
- **Environment**: Local verification and pre-commit / CI gates.
- **Response**: `bun run lint:srp` (`scripts/check_srp_limits.ts`) enforces hard < 400 lines/file limit, `tsc --noEmit` enforces strict TypeScript compilation across `packages/shared`, `packages/cli`, and `apps/api`, `detect-mocks .` blocks mock frameworks and fake latency in production code, and `bun run lint:arc42:strict` verifies documentation consistency.
- **Measurement**: 0 hard SRP errors across 320+ audited files; 0 `tsc` errors; 0 `detect-mocks` violations; 0 `arc42-lint --strict` errors/warnings.

### QS-03: Sub-50ms Non-LLM API Latency & Low-RAM Container Footprint
- **Quality Property**: #performance
- **Stimulus**: 50 concurrent learners inspect DAG progression, fetch learning bundles, and stream Socratic guidance via SSE.
- **Environment**: Single ARM64 Linux Docker container (`oven/bun:1.4-alpine`) under 256MB RAM ceiling.
- **Response**: Elysia handles non-LLM routes without event-loop blocking; Tarjan SCC graph validation finishes in $< 2\text{ms}$; SSE streams forward upstream LLM tokens with `X-Accel-Buffering: no`.
- **Measurement**: Target P95 latency $< 50\text{ms}$ for DB-backed non-LLM endpoints and container RSS $< 256\text{MB}$ under sustained 50-user load *(aspirational — automated load benchmark pending in `DEBT-04`)*.

### QS-04: Cryptographic W3C VC 2.0, Merkle Audit Trail & XSS/Secret Hygiene
- **Quality Property**: #security
- **Stimulus**: Candidate claims a verified authority credential, interacts with Socratic AI, or renders untrusted Markdown content.
- **Environment**: Public verification endpoints (`/api/v1/credentials/verify`, `/api/v1/gates/verify/:grantId`) and browser SPA.
- **Response**: `W3cCredentialCryptoEngine` signs and verifies Ed25519 `DataIntegrityProof` (`eddsa-rdfc-2022`); `merkle-transcript.ts` detects any single-character modification or turn reordering; `MarkdownRenderer.svelte` strips `onclick` attributes via `DOMPurify`; `db.ts`/`AiGatewayService.ts` reject missing production secrets.
- **Measurement**: 100% pass on `packages/cli/tests/phase18_merkle.test.ts` and `apps/api/tests/llm_and_oracle_integrity.test.ts`; 0 hardcoded production secrets in source.

### QS-05: Procedural Parity, DAG Acyclicity & Scaffolding Soundness
- **Quality Property**: #correctness
- **Stimulus**: A new domain blueprint JSON is validated or a competency learning bundle is generated for any arbitrary domain.
- **Environment**: CLI certification pipeline and `GetCompetencyLearningBundleUseCase`.
- **Response**: `validateDomainBlueprint` verifies zero cyclic prerequisites (Tarjan SCC), valid references, and 100%-weighted rubrics; `BackwardScaffoldingGenerator` produces domain-agnostic isomorphic worked examples with distinct scaled values and trap annotations; `audit_domain_curriculum.ts` verifies 5-pillar completeness.
- **Measurement**: 100% pass on `packages/shared/tests/cognitive_archetypes_and_scaffolding.test.ts`, `packages/cli/tests/cli_phases.test.ts`, and `bun run audit:domain` (score 100/100 on reference blueprint).

---

## 10.3 Quality Scenario Tracking Matrix

| Scenario ID | Quality Goal Tag | Current State | Verification Mechanism |
|---|---|---|---|
| QS-01 | #correctness | measured | `bun test apps/api/tests/llm_and_oracle_integrity.test.ts` |
| QS-02 | #maintainability | measured | `bun run lint:srp`, `tsc --noEmit`, `detect-mocks .`, `bun run lint:arc42:strict` |
| QS-03 | #performance | aspirational | Planned k6/autocannon 50-VU load test & Coolify container memory telemetry |
| QS-04 | #security | measured | `bun test packages/cli/tests/phase18_merkle.test.ts` & `apps/api/tests/llm_and_oracle_integrity.test.ts` |
| QS-05 | #correctness | measured | `bun run audit:domain` & `bun test packages/shared/tests/cognitive_archetypes_and_scaffolding.test.ts` |
