---
arc42_section: 12
verified_commit: 8e3fad0
verified_timestamp: 2026-11-22T09:28:30+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 12. Glossary

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `8e3fad0` (branch: `main`)
> - **Verified Timestamp**: `2026-11-22T09:28:30+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section defines key pedagogical, domain, architectural, LLM, and security terms used across FlashLearn documentation and source code.

---

## 12.1 Pedagogical & Cognitive Architecture Terms

| Term | Category | Definition |
|---|---|---|
| **Active Recall** | Learning Science | Retrieving information from memory without passive prompting to strengthen long-term retention. |
| **Spaced Repetition (SM-2)** | Algorithm | Evidence-based review scheduling (`SpacedRepetitionScheduler`) adjusting card repetition intervals and ease factors based on recall quality (`0`–`5`). |
| **DSR Power Forgetting Curve** | Psychometrics | Difficulty-Stability-Retrievability decay model (`CompetencyDriftEngine`: $R(t) = (1 + 0.19 \cdot t / S)^{-0.5}$) predicting procedural competence drift and triggering provisional gate suspension when $R < 0.70$. |
| **Worked Example Effect** | Pedagogy | Studying annotated solved isomorphic examples before independent execution reduces extraneous cognitive load and accelerates schema acquisition. |
| **Causal Flashcard ("What-If" Probe)** | Cognitive Priming | A typed flashcard (`causal_prediction`, `analogical_comparison`, `micro_debugging`) in `CausalProbeDeck.svelte` requiring active hypothesis selection before revealing causal rationale. |
| **Unaided Practice Gate** | Architectural Guardrail | Persisted sandbox milestone (`has_passed_unaided_sandbox`) that unlocks the formal Gate Exam tab (`GateExamTab.svelte`), where the AI Tutor is explicitly disabled (`disableAiTutor={true}`). |
| **Cognitive Archetypes** | Architecture | FlashLearn's 4 universal task paradigms (`algorithmic_quant`, `artifact_audit`, `ill_structured_case`, `rapid_fluency`) driving domain-agnostic scaffolding. |
| **Dual-Loop Learning Container** | UI/UX Pattern | Modal pattern (`TaskRunnerModal.svelte`) separating unpenalized learning/practice (`LearningSandboxTab`) from formal evaluation (`GateExamTab`). |

---

## 12.2 Competency Graph & Domain Blueprint Terms

| Term | Category | Definition |
|---|---|---|
| **Directed Acyclic Graph (DAG)** | Data Structure | Graph of competencies and directed prerequisite edges verified cycle-free using Tarjan's Strongly Connected Components (`verifyAcyclicity`) and DFS (`CompetencyGraphEngine.hasCycle`). |
| **Corpus of Record** | Grounding | Authoritative statutory, legal, or SOP documents ingested into SHA-256 hashed addressable `source_chunks` and rendered dynamically by `CorpusReferenceCard.svelte`. |
| **Multi-Observation Entrustment** | Assessment Policy | Gate policy (`requiredObservationsCount`) requiring verified passing attempts across multiple distinct isomorphic `scenario_variant_code` tasks stored in `passed_variant_codes`. |
| **Zero-Domain Hardcoding** | Architecture | Doctrine keeping core backend/frontend/shared packages free of industry-specific business logic; domains are imported declaratively via `flashlearn domain import-blueprint`. |

---

## 12.3 Evaluation, LLM Gateway & Security Terms

| Term | Category | Definition |
|---|---|---|
| **AI Gateway Service (`IAiGateway`)** | LLM Infrastructure | OpenAI-compatible HTTP/SSE adapter (`AiGatewayService`) with 45s configurable timeout, exponential backoff retries, multi-turn `messages` support, JSON mode, SSE streaming, and `/api/v1/health/ai` diagnostics. |
| **Oracle Class A** | Assessment Engine | Deterministic TypeScript evaluator (`OracleEvaluatorClassA`) enforcing $\pm 1\%$ default relative tolerance and failing fast on misconfigured tasks. |
| **Oracle Class B** | Assessment Engine | Grounded LLM judge (`OracleEvaluatorClassB` / `OracleEvaluatorAdversarial`) evaluating structured rubrics and negative anchors with strict fail-fast `503` behavior when the AI Gateway is unavailable. |
| **Oracle Class C** | Assessment Engine | Double-blind human expert adjudication (`MultiRaterConsensusEngine`) computing Gwet's AC1/AC2 reliability and escalating disputes to a Chief Arbiter. |
| **Progressive Gate** | Authorization | Competency barrier (Levels 0–3) evaluated by `GateAuthorizationEngine` before issuing a `UserGateGrant` authority passport. |
| **W3C Verifiable Credential (VC) 2.0** | Standard | Portable digital credential (`OpenBadgeCredential` / `DigitalAuthorityPassport`) signed with Ed25519 `DataIntegrityProof` (`eddsa-rdfc-2022`) via `W3cCredentialCryptoEngine`. |
| **Merkle Audit Trail** | Security | SHA-256 hash chain over Socratic conversations and attempt transcripts (`merkle-transcript.ts`, `socratic_chat_sessions`) detecting retroactive tampering. |
| **Zero-Mock & Fail-Fast Doctrine** | Engineering Policy | Invariant forbidding mock leakage, simulated sleeps, or silent fallback auto-passes in production execution paths (`detect-mocks .`). |
