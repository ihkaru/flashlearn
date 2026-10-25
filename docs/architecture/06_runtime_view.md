---
arc42_section: 6
verified_commit: 1cf9418
verified_timestamp: 2026-10-25T20:10:07+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 6. Runtime View

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `1cf9418` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T20:10:07+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

The Runtime View describes the dynamic behavior of FlashLearn components across critical operational scenarios.

---

## 6.1 Scenario 1: Dual-Loop Competency Learning & Graceful Downgrade

When a candidate selects a competency node on the DAG, FlashLearn opens the integrated learning container:

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Budi Pembelajar
    participant Web as FlashLearn Web Client
    participant API as FlashLearn API Service
    participant Scaffolder as BackwardScaffoldingGenerator
    participant DB as PostgreSQL Database

    Learner->>Web: Clicks on Competency Node (e.g. PROC-ENT-02)
    Web->>API: GET /api/v1/competencies/:id/learning-bundle (IF-01)
    API->>DB: Query Competency, Linked Tasks & Source Chunks (IF-03)
    DB-->>API: Return Entities
    API->>Scaffolder: generate(node, tasks, citations)
    Scaffolder-->>API: ScaffoldingBundle (JobAid, WorkedExample, MicroSandbox)
    API-->>Web: 200 OK (CompetencyLearningBundle)
    
    Web->>Learner: Renders Tab 1: Belajar & Latihan (Sandbox)
    Note over Learner,Web: Learner reviews checklist, explores worked example & common traps
    
    Learner->>Web: Clicks "Saya Sudah Paham & Siap Masuk Ujian Pembuktian"
    Web->>Learner: Switches to Tab 2: Ujian Pembuktian (Resmi)
    
    alt Learner Struggles in Tab 2
        Learner->>Web: Clicks "Buntu? Buka Panduan Langkah"
        Web->>Learner: Confirmation Modal (Downgrade to Practice Mode)
        Learner->>Web: Confirms Downgrade
        Web->>Learner: Switches back to Tab 1 (Marks session as is_practice: true)
    else Learner Solves Exam
        Learner->>Web: Submits Official Solution
        Web->>API: POST /api/v1/tasks/:id/attempt (IF-01)
    end
```

---

## 6.2 Scenario 2: Multi-Tier Oracle Evaluation & Merkle Attempt Hashing

Evaluates candidate submissions and commits an immutable cryptographic audit record:

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Budi Pembelajar
    participant Web as FlashLearn Web Client
    participant API as FlashLearn API Service
    participant OracleA as OracleEvaluatorClassA
    participant OracleB as OracleEvaluatorClassB
    participant AI as AI Gateway Service
    participant DB as PostgreSQL Database

    Learner->>Web: Submits Task Answer / Calculation
    Web->>API: POST /api/v1/tasks/:id/attempt (IF-01)
    API->>DB: Fetch Task, Rubric & Competency (IF-03)
    
    alt Task is Class A (Deterministic / Calculation)
        API->>OracleA: evaluate(submission, oracleData)
        OracleA-->>API: Score, Pass/Fail, Checkpoint Breakdown
    else Task is Class B (Case Study / Audit)
        API->>OracleB: evaluate(submission, rubric, rolePersona)
        OracleB->>AI: Grounded Evaluation Prompt with Corpus Chunks (IF-04)
        AI-->>OracleB: Structured Rubric Scores & Verdict
        OracleB-->>API: Score, Criteria Feedback, Pass/Fail
    end
    
    API->>API: Compute Merkle hash for conversation transcript & attempt
    API->>DB: Insert Attempt record & update Mastery Ledger (IF-03)
    API-->>Web: Attempt Response (Score, Passed, Rubric Details)
    Web->>Learner: Displays Feedback Card & updates DAG progress
```

---

## 6.3 Scenario 3: Progressive Gate Authorization & W3C VC Issuance

Validates prerequisite thresholds and issues cryptographic authority credentials:

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Budi Pembelajar
    participant Web as FlashLearn Web Client
    participant API as FlashLearn API Service
    participant GateEngine as GateAuthorizationEngine
    participant CryptoEngine as W3cCredentialCryptoEngine
    participant DB as PostgreSQL Database

    Learner->>Web: Requests Gate Passport Evaluation (Level 1/2/3)
    Web->>API: POST /api/v1/gates/:id/evaluate (IF-01)
    API->>DB: Query Candidate Mastery across all required competencies (IF-03)
    DB-->>API: Mastery Records & Verified Attempt IDs
    API->>GateEngine: evaluateGate(gate, candidateMastery)
    
    alt All Required Competencies Mastered (Score >= Passing threshold)
        GateEngine-->>API: Authorized: Grant Gate
        API->>CryptoEngine: issueVerifiableCredential(subject, gate, evidence)
        CryptoEngine->>CryptoEngine: Sign JSON-LD payload with Ed25519 Private Key
        API->>DB: Insert Gate Passport & Store Signed VC (IF-03)
        API-->>Web: Gate Granted (Passport Token, Signed VC)
        Web->>Learner: Displays Digital Passport & W3C VC Download Modal
    else Prerequisites Incomplete
        GateEngine-->>API: Denied: Missing Prerequisite Competencies
        API-->>Web: 400 Bad Request (Detailed Gap List)
        Web->>Learner: Highlights Missing DAG Nodes in Red/Amber
    end
```
