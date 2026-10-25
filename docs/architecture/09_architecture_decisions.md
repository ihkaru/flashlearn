---
arc42_section: 9
verified_commit: 724e04d
verified_timestamp: 2026-10-25T22:32:00+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 9. Architecture Decisions (ADRs)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `724e04d` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T22:32:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section documents architecturally significant decisions (ADRs) that shape the FlashLearn platform.

---

## ADR-01: Bun Runtime & Package Manager Enforcement
- **Status**: Accepted
- **Context**: Node.js and legacy npm workflows on constrained ARM64 containers exhibit significant memory overhead, slow installs, and cold starts exceeding 250MB RAM.
- **Decision**: Enforce Bun (`bun@1.4.2`) exclusively across all workspaces (`apps/api`, `apps/web`, `packages/shared`, `packages/cli`). Direct execution of `npm` and `npx` is blocked via shims.
- **Consequences**: Sub-second test execution, native TypeScript execution without transpilation steps, low container footprint (<25MB idle).
- **Risks Created**: RISK-01

---

## ADR-02: Dual-Loop Architecture & Graceful Downgrade Protocol
- **Status**: Accepted
- **Context**: Confronting candidates with strict Oracle tests immediately after brief readings causes "The Assessment-as-Instruction Fallacy", high cognitive load, and learned helplessness.
- **Decision**: Restructure every competency node into an integrated Dual-Loop Container: Tab 1 Safe Sandbox (Job Aid, Worked Example, Micro-Sandbox) and Tab 2 Gate Exam. If a candidate stalls in Tab 2, a confirmation modal downgrades the attempt into a practice session (`is_practice: true`), allowing step-by-step guidance without granting unearned authority credentials.
- **Consequences**: Candidates learn through schema acquisition before certification. Assessment integrity is preserved.
- **Risks Created**: RISK-02

---

## ADR-03: Backward Scaffolding Generation for Authoring Bottleneck
- **Status**: Accepted
- **Context**: Subject Matter Experts (SMEs) face a heavy authoring bottleneck when required to manually write detailed worked examples and job aids for dozens of competency nodes.
- **Decision**: Implement `BackwardScaffoldingGenerator` to derive isomorphic worked examples directly from task specifications and corpus chunks. Varied surface details (different numbers, names, and scales) are generated while preserving identical mathematical formulas and legal criteria.
- **Consequences**: Creators can deploy full domain curriculums by specifying only tasks and regulations.
- **Risks Created**: RISK-03

---

## ADR-04: Multi-Tier Oracle Evaluation Architecture (Classes A, B, and C)
- **Status**: Accepted
- **Context**: Single-tier LLM evaluation is prone to hallucinations on mathematical formulas and lacks human accountability on high-stakes authority decisions.
- **Decision**: Partition evaluation into three distinct classes:
  - Class A: Deterministic mathematical tolerances ($\pm 1\%$) and exact classification.
  - Class B: AI Judge with explicit role personas, Do's & Don'ts, and 100%-weighted rubric criteria.
  - Class C: Human expert signoff with double-blind multi-rater consensus (Gwet's AC1/AC2 coefficient).
- **Consequences**: Zero mathematical hallucination on financial calculations; structured qualitative evaluation on case studies.
- **Risks Created**: RISK-04

---

## ADR-05: W3C Verifiable Credentials 2.0 & Ed25519 Signatures
- **Status**: Accepted
- **Context**: Centralized digital badges and proprietary certification portals trap learner credentials inside proprietary walled gardens.
- **Decision**: Issue digital authority passports conforming to W3C Verifiable Credentials 2.0 and OpenBadges 3.0, signed cryptographically using Ed25519 keypairs. Verification is open to external verifiers via public portals and standard crypto libraries.
- **Consequences**: Portable, tamper-proof, decentralized credentials verifiable offline or by third-party enterprise HR systems.
- **Risks Created**: RISK-05

---

## ADR-06: Causal Schema Priming & Mandatory Unaided Practice Gate
- **Status**: Accepted
- **Context**: Empirical meta-analyses (Bastani et al., 2025) demonstrate that unguided AI tutoring during practice inflates assisted performance but drops unaided exam performance by 17% due to the "AI Crutch Paradox". In addition, traditional definition-recalling flashcards fail to build procedural mental models.
- **Decision**: Re-engineer flashcards into Causal Prediction Probes ("What-If" directionality) and Micro-Debugging error spotting before the sandbox. Enforce a mandatory Unaided Practice Checkpoint where the AI tutor is completely disabled before the Gate Exam tab unlocks.
- **Consequences**: Eliminates the illusion of competence, forcing genuine procedural schema retrieval before certification.
- **Risks Created**: RISK-06

---

## ADR-07: Autonomous Coding Agent CLI Generation Pipeline & Zero-Domain Hardcoding
- **Status**: Accepted
- **Context**: Hardcoding domain business rules (e.g. procurement regulations or engineering formulas) inside the application codebase destroys portability and creates high maintenance overhead when expanding to new enterprise domains.
- **Decision**: Mandate that all domain curricula (Corpus of Record, DAG edges, causal flashcards, analogical quizzes, worked examples, adaptive scaffolding, and oracle tests) must be 100% generated and certified by an autonomous Coding Agent through the Headless CLI (`bun run cli domain import / generate / certify`). The application codebase remains strictly domain-agnostic.
- **Consequences**: Enables zero-code onboarding of arbitrary regulatory and technical domains while enforcing automated invariant verification before database ingestion.
- **Risks Created**: RISK-07
