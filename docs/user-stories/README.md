# FlashLearn Master Catalog of Numbered User Stories
**Standards-Compliant, Evidence-First Enterprise Competency Architecture**
**Version: October 2026 | All 16 Phases Documented**

This catalog maps every architectural milestone of FlashLearn to an independent, numbered User Story with strict Gherkin acceptance criteria (Given-When-Then), role definitions, and verification proofs.

---

## Master User Story Index

| Story ID | Filename | Target Phase | Core Capability & Focus | Implementation Status |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | [**`01-corpus-of-record-and-citations.md`**](./01-corpus-of-record-and-citations.md) | Phase 1 | Legal/SOP text ingestion, SHA256 chunk hashing, deterministic quote verification | ✅ Production / Verified |
| **US-02** | [**`02-prerequisite-dag-and-competency-graph.md`**](./02-prerequisite-dag-and-competency-graph.md) | Phase 2 | Directed Acyclic Graph (DAG) competency hierarchy, cycle prevention, expert sign-off | ✅ Production / Verified |
| **US-03** | [**`03-multitier-oracle-evaluation-engine.md`**](./03-multitier-oracle-evaluation-engine.md) | Phase 3 | Class A calculation/checklist oracles, Class B AI Judge with negative anchor traps | ✅ Production / Verified |
| **US-04** | [**`04-progressive-authorization-gates.md`**](./04-progressive-authorization-gates.md) | Phase 4 | Progressive Gates (Level 0–3), Class C double-blind human expert sign-off queue | ✅ Production / Verified |
| **US-05** | [**`05-spaced-repetition-and-reactive-staleness.md`**](./05-spaced-repetition-and-reactive-staleness.md) | Phase 5 | 3D flashcards from attempt errors, SM-2 retention intervals, legal staleness invalidation | ✅ Production / Verified |
| **US-06** | [**`06-curriculum-aware-socratic-ai-tutor.md`**](./06-curriculum-aware-socratic-ai-tutor.md) | Phase 6 | Anti-spoiler Socratic AI tutor cross-referencing delivered materials without answer leaks | ✅ Production / Verified |
| **US-07** | [**`07-immutable-audit-trail-and-compliance.md`**](./07-immutable-audit-trail-and-compliance.md) | Phase 7 | Tamper-evident hash-chained audit ledger, regulatory compliance ZIP exporter | ✅ Production / Verified |
| **US-08** | [**`08-digital-authority-passport-portal.md`**](./08-digital-authority-passport-portal.md) | Phase 8 | Public passport verification portal, tamper-proof credentials, real-time revocation | ✅ Production / Verified |
| **US-09** | [**`09-universal-domain-blueprint-importer.md`**](./09-universal-domain-blueprint-importer.md) | Phase 9 | Universal domain blueprint ingestion (zero domain hardcoding enforcer) | ✅ Production / Verified |
| **US-10** | [**`10-background-worker-daemon.md`**](./10-background-worker-daemon.md) | Phase 10 | Background worker daemon, automated retest due scheduler, health monitoring | ✅ Production / Verified |
| **US-11** | [**`11-adversarial-dilemma-stress-testing.md`**](./11-adversarial-dilemma-stress-testing.md) | Phase 11 | Situational Judgment Tests (SJT), omission & urgency traps, TSI scoring, auto-veto | ✅ Production / Verified |
| **US-12** | [**`12-adaptive-topological-placement.md`**](./12-adaptive-topological-placement.md) | Phase 12 | Knowledge Space Theory (KST) on DAG, Minimal-Entropy Fringe Search, Fast Senior Path | 🚀 In Progress |
| **US-13** | [**`13-double-blind-multi-rater-consensus.md`**](./13-double-blind-multi-rater-consensus.md) | Phase 13 | Human assessment governance, Gwet’s $\text{AC}_1 / \text{AC}_2$ inter-rater reliability, Arbiter escalation | 📋 Planned |
| **US-14** | [**`14-predictive-competency-drift-modeling.md`**](./14-predictive-competency-drift-modeling.md) | Phase 14 | Dynamic DSR (Difficulty, Stability, Retrievability) decay model, automated micro-revalidation | 📋 Planned |
| **US-15** | [**`15-autonomous-domain-synthesizer-skill.md`**](./15-autonomous-domain-synthesizer-skill.md) | Phase 15 | Autonomous Markdown SOP ingestion skill (`flashlearn-domain-builder`), Tarjan SCC DAG validation | ✅ Production / Verified |
| **US-16** | [**`16-cryptographic-verifiable-credentials.md`**](./16-cryptographic-verifiable-credentials.md) | Phase 16 | W3C Verifiable Credentials 2.0, Ed25519 Data Integrity proofs, OpenBadges 3.0 | 📋 Planned |

---

## Architectural Rules for All User Stories
1. **Zero Domain Hardcoding**: All user stories must remain completely applicable to procurement, aviation maintenance, healthcare, cybersecurity, or finance.
2. **Review Evidence, Not Claims**: Every completed story must be backed by terminal proof: hermetic automated test results and deterministic exit codes.
3. **Strict SRP Enforcement**: Files created or modified during implementation must not exceed 400 lines (target $< 200$ lines for handlers and use cases).
