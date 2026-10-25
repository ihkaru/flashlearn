---
arc42_section: 10
verified_commit: 724e04d
verified_timestamp: 2026-10-25T22:32:00+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 10. Quality Requirements

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `724e04d` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T22:32:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section specifies the Quality Tree and concrete Quality Scenarios using the Q42 Quality Model, testing the four primary quality goals defined in Section 1.2.

---

## 10.1 Quality Tree

```
FlashLearn Quality Tree
├── Correctness (#correctness)
│   ├── QS-01: Oracle Evaluation & Checkpoint Determinism
│   └── QS-05: Procedural Parity & Scaffolding Soundness
├── Maintainability (#maintainability)
│   └── QS-02: Single Responsibility Principle & Zero-Mock Compliance
├── Performance (#performance)
│   └── QS-03: Sub-50ms API Latency & Low-RAM Footprint
└── Security (#security)
    └── QS-04: Cryptographic Credential & Tamper-Evident Merkle Ledger
```

---

## 10.2 Concrete Quality Scenarios (Q42 Model)

### QS-01: Mathematical & Deterministic Oracle Evaluation
- **Quality Property**: #correctness
- **Stimulus**: Learner submits calculation values for an `algorithmic_quant` task (e.g. TCO calculation with Capex, multi-year Opex, salvage value, and PPN 11%).
- **Environment**: Production API under concurrent attempt submissions.
- **Response**: The `OracleEvaluatorClassA` calculates the exact expected value based on oracle formulas, permits a strict tolerance of $\pm 1\%$, evaluates intermediate checkpoints, and returns diagnostic feedback isolating calculation errors.
- **Measurement**: 100% calculation attempts within $\pm 1\%$ pass; any deviation beyond tolerance is flagged with specific component line diagnostics.

### QS-02: Codebase Hygiene & Zero-Mock Invariant
- **Quality Property**: #maintainability
- **Stimulus**: Developer or automated AI coding agent adds new features or refactors domain entities.
- **Environment**: Continuous Integration pre-commit and pre-flight release gates.
- **Response**: Static linters `scripts/check_srp_limits.ts` and `detect-mocks .` audit all files. Any file exceeding 400 lines or containing mock framework imports in production directories immediately fails the build.
- **Measurement**: 0 file length violations across 312 files; 0 mock leaks detected in production pathways.

### QS-03: High-Speed Response & Low Memory Footprint
- **Quality Property**: #performance
- **Stimulus**: 50 concurrent learners explore DAG nodes, request learning bundles, and stream Socratic guidance.
- **Environment**: Single-container deployment running on ARM64 Linux under 256MB RAM ceiling.
- **Response**: Bun Elysia handles requests without event loop blocking; graph acyclicity (Tarjan SCC) resolves in $< 2\text{ms}$; P95 API response times stay below 50ms.
- **Measurement**: P95 latency $< 50\text{ms}$; total container memory consumption remains $< 120\text{MB}$.

### QS-04: Cryptographic Credentials & Merkle Audit Integrity
- **Quality Property**: #security
- **Stimulus**: Candidate completes terminal Gate 3, requesting official authority passport credential.
- **Environment**: Public verification portal accessing credential endpoints.
- **Response**: `W3cCredentialCryptoEngine` signs the credential using Ed25519; attempt logs are chained into a Merkle root hash. External verifiers validate the digital signature without accessing private databases.
- **Measurement**: 100% issued credentials validate against the public key; any modified attempt bit invalidates the Merkle root hash.

---

## 10.3 Quality Scenario Tracking Matrix

| Scenario ID | Quality Goal Tag | Current State | Verification Mechanism |
|---|---|---|---|
| QS-01 | #correctness | measured | `bun run audit:domain` & `packages/shared/tests/` |
| QS-02 | #maintainability | measured | `bun run lint:srp` & `detect-mocks .` |
| QS-03 | #performance | measured | Load testing & Coolify container memory metrics |
| QS-04 | #security | measured | `packages/cli/tests/phase18_merkle.test.ts` |
