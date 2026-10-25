---
arc42_section: 12
verified_commit: 0f9e4c2
verified_timestamp: 2026-10-25T22:00:00+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 12. Glossary

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `0f9e4c2` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T22:00:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section defines key pedagogical, domain, architectural, and security terms used throughout FlashLearn documentation and source code.

---

## 12.1 Pedagogical & Cognitive Architecture Terms

| Term | Category | Definition |
|---|---|---|
| **Active Recall** | Learning Science | The cognitive process of retrieving information from memory without passive prompting, strengthening neural pathways and long-term retention. |
| **Spaced Repetition (SM-2 / FSRS)** | Algorithm | An evidence-based scheduling technique where reviews are spaced at mathematically expanding intervals according to item difficulty and recall rating. |
| **Cognitive Load Theory (CLT)** | Psychology | Sweller's instructional theory differentiating between intrinsic load (task complexity), germane load (schema acquisition), and extraneous load (interface friction). |
| **Four-Component Instructional Design (4C/ID)** | Instructional Design | Van Merriënboer's framework structuring complex learning around authentic learning tasks, supportive information, procedural information, and part-task practice. |
| **Worked Example Effect** | Pedagogy | The phenomenon where novice learners develop problem schemas faster and with less extraneous load when analyzing fully solved expert solutions before solving unassisted problems. |
| **Faded Scaffolding** | Pedagogy | A progressive learning strategy where initial problems are heavily assisted (e.g. 70% pre-filled), systematically removing prompts and helpers until the learner performs fully unassisted. |
| **Causal Flashcard ("What-If" Probe)** | Cognitive Priming | An active-recall probe presenting an operational parameter shift requiring the learner to predict the directional outcome before flipping the card to reveal the expert rationale. |
| **Analogical Comparison** | Learning Science | An instructional exercise presenting two structurally isomorphic cases from different industries side-by-side to train the mind to recognize deep relational schemas. |
| **Micro-Debugging** | Assessment | An error-spotting drill presenting a completed worksheet containing a deliberate regulatory or numerical defect to build an early warning audit instinct ($g = 0.64$). |
| **Unaided Practice Gate** | Architectural Guardrail | A mandatory checkpoint in the sandbox requiring error-free task execution with all AI tutoring disabled before the high-stakes Gate Exam tab unlocks. |
| **Cognitive Archetypes** | Architecture | FlashLearn's 4 universal domain-agnostic task paradigms: (1) Analytical Calculation, (2) Multi-Variable Classification, (3) Adversarial Audit, and (4) System Dynamic Synthesis. |
| **Dual-Loop Learning Container** | UI/UX Pattern | An architectural pattern separating unpenalized exploration and granular diagnostic practice (Outer Sandbox) from high-stakes deterministic evaluation (Inner Gate Exam). |

---

## 12.2 Competency Graph & Task Terms

| Term | Category | Definition |
|---|---|---|
| **Directed Acyclic Graph (DAG)** | Data Structure | A graph structure representing competency progressions without circular dependencies, ensuring strict prerequisite verification before node unlock. |
| **Node** | Domain Model | An atomic competency unit within a domain blueprint containing theoretical modules, practice tasks, and authority gate evaluation criteria. |
| **Prerequisite** | Domain Model | A directed edge requiring verified completion and passing scores on upstream nodes before a downstream node becomes unlockable. |
| **Corpus of Record** | Grounding | Authoritative regulatory, legal, or procedural source documentation ingested into chunks and cited as mandatory grounding for all evaluation criteria. |
| **Diagnostic Step** | Assessment | An isolated sub-calculation or intermediate classification within a task allowing pinpoint failure analysis without confounding compound errors. |
| **Multi-Observation Entrustment** | Assessment Policy | A certification policy requiring demonstrated passing capability across at least two distinct isomorphic scenario variants to prevent fluke passes. |
| **Zero-Domain Hardcoding** | Architecture | The doctrine that the core application codebase contains zero hardcoded domain rules; all curricula are generated and certified via an autonomous CLI agent. |

---

## 12.3 Evaluation, Oracles & Security Terms

| Term | Category | Definition |
|---|---|---|
| **Oracle Class A** | Assessment Engine | Deterministic evaluation using mathematical formulas, AST parsers, or strict tolerance bands ($\pm 1\%$) executed locally without LLM inference. |
| **Oracle Class B** | Assessment Engine | AI judge evaluation using multi-agent debate or structured prompt rubrics strictly grounded in cited Corpus of Record passages. |
| **Oracle Class C** | Assessment Engine | Human panel adjudication for subjective, ethical, or high-consequence enterprise actions requiring human sign-off. |
| **Progressive Gate** | Authorization | A formal competency barrier requiring proof of mastery across prerequisites before granting operational privileges or digital credentials. |
| **Authority Passport** | Credentialing | A cryptographically verifiable digital credential proving that a learner has demonstrated authentic mastery of a specific capability. |
| **Merkle Audit Trail** | Security | A SHA-256 cryptographic hash tree anchoring attempt history, evaluation scores, and corpus citations to guarantee tamper-proof ledger integrity. |
| **W3C Verifiable Credential (VC)** | Standard | An open cryptographic standard for tamper-evident credentials issued with Ed25519 digital signatures and resolvable decentralized identifiers (DIDs). |
| **Zero-Mock Policy** | Engineering Doctrine | Strict invariant forbidding artificial latency, silent stubbing, or mock framework leakage in production execution paths. |
