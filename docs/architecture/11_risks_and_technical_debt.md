---
arc42_section: 11
verified_commit: fed4511
verified_timestamp: 2026-11-24T23:50:30Z
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 11. Risks and Technical Debt

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `fed4511` (branch: `main`)
> - **Verified Timestamp**: `2026-11-24T23:50:30Z`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section catalogues known architectural risks and active technical debt in FlashLearn, keeping an honest ledger of gaps between current implementation and target maturity.

---

## 11.1 Architectural Risk Matrix

| Risk ID | Title / Summary | Severity | Likelihood | Mitigation Strategy | Owner |
|---|---|---|---|---|---|
| RISK-01 | Bun runtime compatibility regressions on ARM64 Linux containers | Medium | Low | Pin Bun `1.4.2` (`oven/bun:1.4-alpine`), maintain hermetic `bun test` suites and strict `tsc --noEmit` checks before deployment. | Platform Core |
| RISK-02 | Candidate gaming of Sandbox-to-Exam transitions or downgrade peeking | High | Medium | Persist `has_passed_unaided_sandbox` on backend, disable AI Tutor inside `GateExamTab.svelte`, separate `is_practice` attempts from official mastery, and enforce multi-observation variants (`requiredObservationsCount`). Planned: server-side instance burning on downgrade (`DEBT-03`). | Curriculum & Auth |
| RISK-03 | Generic heuristic wording in auto-generated backward scaffolding for niche domains | Medium | Medium | Derive scaffolding dynamically from `task.oracleData`, `adversarialSpec`, and DB `source_chunks` rather than hardcoded domain text; allow SME blueprint enrichment. | AI Pipeline Team |
| RISK-04 | Upstream AI Gateway downtime, 429 rate limits, or latency spikes blocking Class B / Adversarial / Socratic flows | High | Medium | 45s configurable timeout (`AI_TIMEOUT_MS`), exponential backoff retries (`Bun.sleep`), strict fail-fast HTTP `503` (zero silent auto-pass), and active `/api/v1/health/ai` monitoring. Planned: async evaluation retry queue (`DEBT-03`). | AI Integration |
| RISK-05 | Key management, rotation, and decentralized revocation for Ed25519 W3C credentials | High | Low | Store runtime secrets in Infisical/Coolify, validate credential `status` (`active`/`revoked`/`drift_suspended`) in PostgreSQL during verification. Planned: public `/.well-known/did.json` resolver and W3C Bitstring Status List (`DEBT-03`). | Security & Compliance |
| RISK-06 | Learner friction when AI Tutor is disabled during Unaided Practice & Gate Exam | Medium | Medium | Provide DB-grounded `CorpusReferenceCard`, Job Aid checklists, formulas, and causal priming probes before entering the unaided Gate Exam. | UX & Cognitive Design |
| RISK-07 | Hallucinated statutory citations or unsolvable parameters in agent-generated blueprints | High | Low | Enforce SHA-256 hashing of ingested source chunks, deterministic verbatim quote checks (`CitationValidatorService`), Tarjan SCC acyclicity, 100%-weighted rubric validation (`validateDomainBlueprint`), and Class A fail-fast config checks. | CLI & Automation |
| RISK-08 | Upstream transitive dependency CVEs (e.g. `vite`, `zod`, `shell-quote`, `xlsx`) | Medium | Medium | Run `osv-scanner scan source -r .` during release gates, upgrade patched dependencies promptly, and isolate unpatched optional libraries (`xlsx`). | Platform Core |

---

## 11.2 Technical Debt Register

| Debt ID | Component | Description | Impact | Remediation Plan | Target Milestone |
|---|---|---|---|---|---|
| DEBT-01 | `apps/web` Testing | Frontend workspace (`apps/web`) currently has no automated unit/component test runner (only `apps/api`, `packages/shared`, and `packages/cli` run `bun test`). | UI regressions rely on manual QA and `vite build` checks. | Add lightweight Svelte 5 component tests and smoke E2E checks integrated into root `bun run test`. | v1.1.0 |
| DEBT-02 | `apps/web` Component Decomposition | 20 Svelte components remain between 200–392 lines (above 200-line soft SRP guidance, below 400-line hard cap). *(Zero-emoticon hygiene, wrap-safe CSS, restrained iconography, and Guided Interactive Bridging modules are completed.)* | Elevated component size on largest modals/pages. | Decompose largest pages (`QuizRunner.svelte`, `ContentEditorModal.svelte`, `workspace.svelte`, `InteractiveModuleViewer.svelte`) into smaller subcomponents. | v1.1.0 |
| DEBT-03 | Planned Cognitive & Security Evolutions | Several target enhancements from the architecture roadmap are not yet implemented in code: Dual-Agent Class B Critic, 4-tier adaptive fading (70/30/0%), Graceful Downgrade server-side instance burning, `/.well-known/did.json` endpoint, W3C Bitstring Status List, organizational decay attestation endpoint, and async LLM evaluation queue. | Documented honestly as roadmap items rather than active runtime guarantees. | Deliver incrementally in dedicated vertical slices with hermetic tests before promoting to As-Is status. | v1.2.0 |
| DEBT-04 | Live Load & DB Integration CI | Integration tests `apps/api/tests/phase01`–`phase16.test.ts` require a running PostgreSQL instance, and 50-VU load benchmarks for `QS-03` have not yet been automated in CI. | Full DB integration and `QS-03` performance telemetry cannot run in DB-less sandboxes. | Provision ephemeral Postgres service container + k6 load benchmark in CI alongside hermetic `llm_and_oracle_integrity.test.ts`. | v1.1.0 |
| DEBT-05 | Credential Execution Artifact Hash | Column `issued_credentials.execution_artifact_hash` exists in schema (`0009`), but `IssueVerifiableCredentialUseCase` does not yet populate it with the aggregated Merkle hash of verified attempt transcripts. | W3C VCs do not yet embed attempt transcript Merkle digests automatically. | Compute and attach aggregated attempt `conversationHash` / artifact digest in `IssueVerifiableCredentialUseCase`. | v1.1.0 |
| DEBT-06 | Turnkey Bootstrap Seeds | Five canonical domain seed modules remain under `apps/api/src/infrastructure/database/seeds/` executed by `start.sh` for turnkey onboarding. | Couples starter domain content to backend container startup rather than pure CLI ingestion. | Export the 5 canonical seeds into versioned JSON blueprint files ingested via `flashlearn domain import-blueprint`. | v1.2.0 |
| DEBT-07 | `packages/cli` Soft-Delete Filtering in `plan diff` | **Resolved (Phase 23)**: `diffPlanWithRemote` now filters out `deleted`/`archived` remote items so pruned legacy modules no longer clutter diff output. | Closed | Completed in `plan-remote-sync.ts`. | v1.1.0 |
| DEBT-08 | Native CLI Enforcement of `chapter-ledger.json` & Recall Ratchet | The v3 Two-Phase Curriculum Harness (`chapter-ledger.json`, `Key Point Recall >= 85%`) is currently enforced at the agent-skill layer rather than as a deterministic CLI gate. | Relies on authoring agent discipline rather than hard CLI validation during `plan push`. | Add `flashlearn plan audit --min-recall 0.85` and ledger verification into `packages/cli` (Phase 23). | v1.2.0 |

---

## 11.3 Quality Scenario Tracking & Mitigation

All quality scenarios defined in Section 10 (`QS-01` to `QS-05`) are tracked against concrete verification commands:
- **QS-01 (#correctness)**: Verified deterministically by `bun test apps/api/tests/llm_and_oracle_integrity.test.ts` (Class A fail-fast + $\pm 1\%$ tolerance, Class B/Adversarial fail-fast HTTP 503, Multi-Observation `GateAuthorizationEngine`).
- **QS-02 (#maintainability)**: Enforced on every change via `bun run lint:srp` (`scripts/check_srp_limits.ts`), `tsc --noEmit` across `packages/shared`, `packages/cli`, and `apps/api`, `detect-mocks .`, and `bun run lint:arc42:strict`.
- **QS-03 (#performance — aspirational)**: Tracked under `DEBT-04`; mitigation includes zero-blocking Elysia handlers, pooled `postgres.js` (`max: 10`), `X-Accel-Buffering: no` SSE streaming, and upcoming automated 50-VU load testing + container RSS telemetry.
- **QS-04 (#security)**: Verified via `bun test packages/cli/tests/phase18_merkle.test.ts`, `apps/api/tests/llm_and_oracle_integrity.test.ts`, DOMPurify XSS hardening (`MarkdownRenderer.svelte`), and fail-fast secret enforcement in `db.ts` and `AiGatewayService.ts`.
- **QS-05 (#correctness)**: Verified via `bun test packages/shared/tests/cognitive_archetypes_and_scaffolding.test.ts`, `packages/cli/tests/cli_phases.test.ts`, and `bun run audit:domain` (`scripts/audit_domain_curriculum.ts`).
