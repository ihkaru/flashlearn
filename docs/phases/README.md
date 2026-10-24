# FlashLearn Architecture & Implementation Specifications: Phases 11–16
**October 2026 Edition | Standards-Compliant, Agent-First, Cryptographically Verifiable**

This directory contains the independent research foundation, psychometric and mathematical models, domain architecture, database schemas, and verification gauntlets for FlashLearn Phases 11 through 16.

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

---

## Architectural Rules for All Phases
1. **Zero UI Touch**: All development strictly targets `apps/api/`, `packages/cli/`, and shared packages. `apps/web/` remains completely unmodified.
2. **Single Responsibility Principle (SRP)**: Monitored deterministically via `bun run lint:srp`. No file may exceed 400 lines; use cases and controllers target $< 200$ lines.
3. **Old Coder Evidence First**: Every phase is developed under the RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR loop with hermetic, parallelizable automated tests.
