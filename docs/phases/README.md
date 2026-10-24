# FlashLearn Architecture & Implementation Specifications: Phases 11–20
**October 2026 Edition | Standards-Compliant, Agent-First, Cryptographically Verifiable**

This directory contains the independent research foundation, psychometric and mathematical models, domain architecture, database schemas, and verification gauntlets for FlashLearn Phases 11 through 17+, as well as future horizon roadmaps.

---

## Catalog of Implementation Specifications

| Phase | Specification Document | October 2026 Standard & Focus | Key Mathematical / Algorithmic Model |
| :--- | :--- | :--- | :--- |
| **Phase 11** | [**`phase-11-adversarial-dilemma.md`**](./phase-11-adversarial-dilemma.md) | Situational Judgment Tests (SJT) & Behavioral Red-Teaming | Trap Sensitivity Index ($\text{TSI}$), Boundary Defense Score ($\text{BDS}$) |
| **Phase 12** | [**`phase-12-adaptive-topological-placement.md`**](./phase-12-adaptive-topological-placement.md) | Knowledge Space Theory (KST) Computerized Adaptive Testing | Quasi-Ordinal Knowledge Space, Minimal-Entropy Topological Fringe Search, BLIM |
| **Phase 13** | [**`phase-13-double-blind-multi-rater-consensus.md`**](./phase-13-double-blind-multi-rater-consensus.md) | Double-Blind Human Assessment Governance & Arbitration | Gwet’s $\text{AC}_1 / \text{AC}_2$ (Prevalence Paradox Immunity), Chief Arbiter Escalation |
| **Phase 14** | [**`phase-14-predictive-competency-drift.md`**](./phase-14-predictive-competency-drift.md) | Dynamic Competency Half-Life & Procedural Decay | DSR Model (Difficulty, Stability, Retrievability: $R(t) = (1 + 0.19 \frac{t}{S})^{-0.5}$) |
| **Phase 15** | [**`phase-15-autonomous-domain-synthesizer.md`**](./phase-15-autonomous-domain-synthesizer.md) | Dual-Stage Grounded Curriculum Synthesis from SOPs | LLM Structure Generator + Adversarial Citation Verifier + Tarjan SCC Acyclicity |
| **Phase 16** | [**`phase-16-cryptographic-verifiable-credentials.md`**](./phase-16-cryptographic-verifiable-credentials.md) | Portable, Offline-Verifiable Digital Passports | W3C Verifiable Credentials Data Model 2.0 + OpenBadges 3.0 + Ed25519 Data Integrity |
| **Phase 17** | [**`phase-17-lumis-agentic-chat-bridge.md`**](./phase-17-lumis-agentic-chat-bridge.md) | Bi-directional Agentic Socratic Bridge & Two-Way RPC | RFC 6454 PostMessage RPC v2, Socratic Anti-Spoiler Guardrail, Direct Argument Adoption |
| **Phase 18** | [**`roadmap-future-enhancements.md`**](./roadmap-future-enhancements.md#phase-18) | Tamper-Evident Conversational Audit Trail & Merkle Hashing | SHA-256 Merkle Transcript Chaining ($H_k$), Adversarial Extraction Guardrail, Reviewer Inspector |
| **Roadmap** | [**`roadmap-future-enhancements.md`**](./roadmap-future-enhancements.md) | Master Horizons Roadmap (Phases 18–20) | Conversational Audit Trail (P18 ✅), KST Chat Planner (P19), Decentralized Mesh (P20) |

---

## Architectural Rules for All Phases
1. **Single Responsibility Principle (SRP)**: Monitored deterministically via `bun run lint:srp`. No file may exceed 400 lines; use cases and controllers target $< 200$ lines.
2. **Old Coder Evidence First**: Every phase is developed under the RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR loop with hermetic, parallelizable automated tests.
3. **Zero Hardcoding**: All models and engines operate 100% domain-agnostically across any regulatory corpus.
