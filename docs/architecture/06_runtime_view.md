---
arc42_section: 6
verified_commit: 0f9e4c2
verified_timestamp: 2026-10-25T22:00:00+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 6. Runtime View

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `0f9e4c2` (branch: `main`)
> - **Verified Timestamp**: `2026-10-25T22:00:00+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

The Runtime View describes the dynamic behavior of FlashLearn components across critical operational workflows.

---

## 6.1 Scenario 1: Dual-Loop Competency Learning & Unaided Practice Gate

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
    Scaffolder-->>API: ScaffoldingBundle (JobAid, CausalProbes, WorkedExample, AdaptiveSandbox)
    API-->>Web: 200 OK (CompetencyLearningBundle)
    
    Web->>Learner: Renders Tab 1: Belajar & Latihan (Sandbox)
    Note over Learner,Web: Phase 1: Review Job Aid & Checklist
    Note over Learner,Web: Phase 2: Causal Schema Priming (What-If Flashcards & Micro-Debugging)
    Note over Learner,Web: Phase 3: Study Expert Worked Example & Error Traps
    Note over Learner,Web: Phase 4: Guided Sandbox Practice with Socratic AI
    Note over Learner,Web: Phase 5: Mandatory Unaided Practice (AI Disabled)

    Learner->>Web: Completes Unaided Practice Checkpoint
    Web->>API: POST /api/v1/tasks/:id/attempt (is_practice: true, is_unaided: true) (IF-01)
    API-->>Web: 200 OK (passed: true, has_passed_unaided_sandbox: true)
    Web->>Learner: Unlocks Tab 2: Ujian Pembuktian (Resmi)
    
    alt Learner Enters Exam & Solves Case
        Learner->>Web: Submits Official Solution (is_unaided: true)
        Web->>API: POST /api/v1/tasks/:id/attempt (IF-01)
    else Learner Stalls in Exam
        Learner->>Web: Clicks "Buntu? Buka Panduan Langkah"
        Web->>Learner: Confirmation Modal (Graceful Downgrade Protocol)
        Learner->>Web: Confirms Downgrade
        Web->>Learner: Switches back to Tab 1 (Burns scenario instance, restarts practice)
    end
```

---

## 6.2 Scenario 2: Multi-Tier Oracle Evaluation & Multi-Observation Entrustment

Evaluates candidate submissions and verifies multi-observation requirements before granting authority credentials:

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

    Learner->>Web: Submits Task Answer / Calculation (Scenario Variant A)
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
    
    API->>API: Compute Merkle hash for conversation transcript, execution artifacts & attempt
    API->>DB: Insert Attempt record & update Mastery Ledger (IF-03)
    
    alt Multi-Observation Requirement (e.g. 2 Variants Required)
        DB-->>API: Observation Count: 1 of 2 Passed
        API-->>Web: Attempt Response (Score: 92, Passed: true, Next: "Selesaikan Varian B")
        Web->>Learner: Prompts for Scenario Variant B
    else All Required Observations Passed
        DB-->>API: Observation Count: 2 of 2 Passed
        API->>DB: Update Mastery Record (mastered) & Grant Gate Authority (IF-03)
        API-->>Web: Attempt Response (Score: 95, Authority Passport Issued)
        Web->>Learner: Displays Digital Passport with Merkle Execution Proof
    end
```

---

## 6.3 Scenario 3: Gate Authorization & W3C Verifiable Credential Issuance

When all prerequisite competency gates are mastered, the system issues an Ed25519-signed digital credential encapsulating the Merkle root of the execution artifacts:

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Budi Pembelajar
    participant Web as FlashLearn Web Client
    participant API as FlashLearn API Service
    participant Crypto as W3cCredentialCryptoEngine
    participant DB as PostgreSQL Database
    actor Employer as External Auditor / Employer

    Learner->>Web: Clicks "Terbitkan Paspor Digital W3C"
    Web->>API: POST /api/v1/gates/:id/claim-passport (IF-01)
    API->>DB: Verify All Prerequisite Masteries & Attempt Hashes (IF-03)
    DB-->>API: Verified Clean
    API->>Crypto: signCredential(user, gate, executionArtifactHashes)
    Crypto-->>API: Signed W3C Verifiable Credential (Ed25519Signature2020)
    API->>DB: Store Issued Credential in issued_credentials (IF-03)
    API-->>Web: Credential Payload & Public Verification Link
    Web->>Learner: Displays Passport Badge with QR code and Verification URL

    Employer->>API: GET /verify-passport/:token (IF-05)
    API->>DB: Fetch Credential & Cryptographic Proof (IF-03)
    API-->>Employer: Human-Readable Verification Page + Merkle Execution Artifacts
```
