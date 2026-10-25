---
arc42_section: 1
verified_commit: 1cf9418
verified_timestamp: 2026-10-25T20:10:07+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 1. Introduction and Goals

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `1cf9418` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T20:10:07+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

FlashLearn is an enterprise-grade accelerated learning and high-assurance competency certification platform. It transitions professional workplace education from passive memorization ("The Assessment-as-Instruction Fallacy") into active, cognitive-apprenticeship-based mastery. FlashLearn synthesizes strict regulatory and operational corpora (*Corpus of Record*) into directed acyclic prerequisite competency graphs (DAGs), provides interactive safe-practice sandboxes with isomorphic worked examples, verifies candidate performance via multi-tier oracles (Classes A, B, and C), and issues tamper-evident authority credentials aligned with W3C Verifiable Credentials and OpenBadges 3.0.

---

## 1.1 Requirements Overview & Core Capabilities

1. **Dual-Loop Learning Architecture**:
   Every competency node serves as an integrated container providing two strictly demarcated modes:
   - **Tab 1: Mode Belajar & Latihan (Safe Sandbox)**: Operational Job Aids (checklists, formulas, statutory citations), Annotated Worked Examples with common trap analyses, and micro-sandboxes for penalty-free schema acquisition.
   - **Tab 2: Mode Ujian Pembuktian (Gate Exam)**: Rigorous, independent Oracle assessments where candidates prove capability under high-stakes conditions with Graceful Downgrade support.
2. **Universal Cognitive Archetypes**:
   Domain-agnostic categorization supporting four cognitive modes:
   - `algorithmic_quant`: Exact multi-variable financial and engineering calculations.
   - `artifact_audit`: Systematic compliance and defect detection across technical/legal documents.
   - `ill_structured_case`: Multi-stakeholder ethical, legal, and operational dilemmas under pressure.
   - `rapid_fluency`: Time-critical memory items and emergency protocols via active recall flashcards.
3. **Corpus of Record Traceability**:
   Every training task and assessment criteria links deterministically to verbatim legal, regulatory, or technical source chunks verified with SHA-256 cryptographic hashes.
4. **Progressive Authorization Gates (Levels 0–3)**:
   Tiered authority levels (Observation $\to$ Junior $\to$ Senior $\to$ Head/Terminal Authority) unlocking real-world operational permissions only when preceding prerequisite nodes are mastered.
5. **W3C Verifiable Credentials & OpenBadges 3.0**:
   Issuance of cryptographic digital credentials signed with Ed25519 keys, tamper-checked via Merkle audit trees and verifiable publicly without proprietary vendor lock-in.

---

## 1.2 Quality Goals (Q42 Model)

The following high-priority quality goals govern all architectural decisions and implementations across FlashLearn:

| Priority | Quality Tag | Quality Goal | Description & Target Metric |
|---|---|---|---|
| 1 | #correctness | Oracle Evaluation & Pedagogical Parity | Zero unfair task defects ("Draw the Rest of the Owl"). Evaluator Class A ensures mathematical tolerance $\le \pm 1\%$; Class B provides non-hallucinatory grounded AI judgment. |
| 2 | #maintainability | Strict Single Responsibility & Zero-Mock Invariant | 100% of codebase files remain under the 400-line budget limit (`bun run lint:srp`). Zero mock leaks or silent stubs in production paths (`detect-mocks .`). |
| 3 | #performance | High-Speed Response & Low-RAM Efficiency | Sub-50ms API request latency on P95. Efficient single-binary multi-stage container deployment under 256MB RAM ceiling running on ARM64. |
| 4 | #security | Merkle Audit Trail & Cryptographic Credentials | Tamper-evident hash-chained audit trails for all learner attempts, Ed25519 digital passport signatures, and strict role-based access control (RBAC). |

---

## 1.3 Stakeholders & Personas

| Role | Name / Persona | Goals & Expectations |
|---|---|---|
| **Learner** | *Budi Pembelajar* | Needs structured cognitive guidance, clear worked examples, safe practice without test anxiety, and recognized portable authority credentials. |
| **Domain Creator** | *SME / Lead Architect* | Needs automated backward scaffolding generation to avoid authoring bottlenecks when defining complex curriculum blueprints. |
| **Enterprise Auditor** | *Compliance Officer* | Needs 100% deterministic traceability from exam tasks back to legal regulation clauses (Corpus of Record) and tamper-proof attempt ledgers. |
| **System Operator** | *DevOps Engineer* | Demands hermetic tests, deterministic automated CI/CD deployment via Coolify, Bun runtime efficiency, and zero runtime crashes. |
