---
arc42_section: 11
verified_commit: ca8fea2
verified_timestamp: 2026-10-25T23:23:00+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 11. Risks and Technical Debt

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `2757f63` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T22:34:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section catalogues known architectural risks and technical debt in the FlashLearn codebase, providing mitigation strategies, ownership, and retirement roadmaps.

---

## 11.1 Architectural Risk Matrix

The following risks are tracked and actively mitigated across architectural components, including all risks created by architectural decisions in Section 9:

| Risk ID | Title / Summary | Severity | Likelihood | Mitigation Strategy | Owner |
|---|---|---|---|---|---|
| RISK-01 | Dependency on Bun runtime stability on ARM64 Linux containers | Medium | Low | Pinned Bun release (`1.4.2`), comprehensive hermetic CI tests, automated memory monitoring in container environments. | Platform Core |
| RISK-02 | Candidate abuse of practice-to-exam loop transitions (system gaming) | High | Medium | Dynamic problem parameter generation per attempt, separate DB storage for practice diagnostics vs. immutable signed gate audit records, progressive rate limiting. | Curriculum & Auth |
| RISK-03 | Quality drift in auto-generated backward scaffolding for edge-case blueprints | Medium | Medium | Strict schema validation before LLM pipeline execution, heuristic fallback generators for standard archetypes, human creator review flag. | AI Pipeline Team |
| RISK-04 | Upstream AI Gateway latency spikes or rate limits during Class B evaluations | High | Medium | Asynchronous evaluation queue with exponential backoff retries; pre-evaluation by Class A deterministic checkers before invoking LLM judge. | AI Integration |
| RISK-05 | Key management, rotation, and revocation overhead for Ed25519 digital authority passports | High | Low | Infisical universal secret management, public key distribution endpoints (`/.well-known/did.json`), and W3C Bitstring Status List 2021 revocation registry. | Security & Compliance |
| RISK-06 | Learner frustration or anxiety spike when AI tutor assistance is disabled in Unaided Practice | Medium | Medium | Progressive hint fading schedule (full explanations fade to statutory clause citations only) prior to complete AI shutdown. | UX & Cognitive Design |
| RISK-07 | AI hallucination in statutory clauses or numerical imbalances in CLI-generated domain blueprints | High | Low | Mandatory SHA-256 chunk citation matching against raw ingested text, Tarjan SCC acyclicity validator, and automated AST oracle solvability proofs. | CLI & Automation |

---

## 11.2 Technical Debt Register

The following items represent conscious technical compromises made during high-velocity development, prioritized for systematic resolution:

| Debt ID | Component | Description | Impact | Remediation Plan | Target Milestone |
|---|---|---|---|---|---|
| DEBT-01 | `apps/api` Seeds | Direct SQL inner-join query builders used in seed scripts (`enterprise_procurement_contents.data.ts`) rather than Drizzle ORM relational queries (`db.query.*`). | Minor syntactic maintenance overhead when extending seed fixtures. | Define explicit Drizzle `relations(...)` in `packages/shared/src/schema/database.ts` across `contents`, `sourceChunks`, and `nodes`. | Phase 2 / v0.9.0 |
| DEBT-02 | Monorepo Test Setup | Test runner split between `bun test` in backend/core and `vitest` in frontend UI workspace. | Minor workflow context switching between backend and frontend tests. | Harmonize unified test runner script in root `package.json` (`bun run test`) with consistent reporters. | Phase 3 / v1.0.0 |
| DEBT-03 | Oracle Class B Fixtures | Integration tests for LLM judge evaluations require network connectivity or live AI Gateway. | Inability to run full suite in completely disconnected/airgapped environments. | Implement zero-mock recorded response fixture replay engine compliant with Layer 2 empirical testing doctrine. | Phase 2 / v0.9.0 |
| DEBT-04 | Multi-Domain Scaffolding Templates | Scaffolding templates currently default to the Enterprise Procurement reference archetype. | New domain creation requires manual parameterization of diagnostic steps. | Extract archetype blueprints into generic domain configuration packs (`packages/shared/src/archetypes/`). | Phase 4 / v1.1.0 |

---

## 11.3 Quality Scenario Tracking & Mitigation

All quality scenarios defined in Section 10 (`QS-01` to `QS-04`) are actively monitored:
- **QS-01 (#correctness)**: Spaced repetition due calculation under high load is protected by atomic database indices and idempotency tokens.
- **QS-02 (#performance)**: Real-time DAG acyclicity verification is enforced via Tarjan's Strongly Connected Components algorithm ($O(V + E)$), verified sub-50ms for up to 500 nodes.
- **QS-03 (#maintainability)**: Maximum file size limit of 400 lines and SRP compliance enforced on every commit via `scripts/check-line-limits.sh` and `scripts/static_srp_analyzer.py`.
- **QS-04 (#security)**: Cryptographic authority passport tamper-proofing guaranteed via Ed25519 digital signatures and SHA-256 Merkle chain verification.
