---
arc42_section: 6
verified_commit: 50c1217
verified_timestamp: 2026-11-22T11:46:44+07:00
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 6. Runtime View

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `50c1217` (branch: `main`)
> - **Verified Timestamp**: `2026-11-22T11:46:44+07:00`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

The Runtime View describes the dynamic interactions of FlashLearn components across core operational workflows, matching the actual HTTP endpoints and use cases in `apps/api`.

---

## 6.1 Scenario 1: Dual-Loop Competency Learning & Unaided Practice Gate

When a candidate selects a competency node on the DAG, FlashLearn opens `TaskRunnerModal.svelte`:

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner / Candidate
    participant Web as FlashLearn Web Client
    participant API as FlashLearn API Service
    participant Scaffolder as BackwardScaffoldingGenerator
    participant DB as PostgreSQL Database

    Learner->>Web: Selects Competency Node on DAG
    Web->>API: GET /api/v1/competencies/:id/learning-bundle (IF-01)
    API->>DB: Query Competency, Contents, Tasks, Source Chunks & Causal Flashcards (IF-03)
    DB-->>API: Return Entities & Corpus Chunks
    API->>Scaffolder: generate(node, tasks, citations)
    Scaffolder-->>API: ScaffoldingBundle (JobAid, WorkedExamples, MicroSandbox)
    API-->>Web: 200 OK (CompetencyLearningBundle + corpusChunks + causalProbes)

    Web->>Learner: Renders Tab 1: LearningSandboxTab (Causal Probes, Job Aid, Worked Example, Micro-Sandbox)
    Learner->>Web: Completes Mandatory Unaided Practice Checkpoint
    Web->>API: POST /api/v1/competencies/:id/unaided-sandbox-pass (IF-01)
    API->>DB: Upsert mastery_records.has_passed_unaided_sandbox = true (IF-03)
    API-->>Web: 200 OK (hasPassedUnaidedSandbox: true)
    Web->>Learner: Unlocks Tab 2: GateExamTab (AI Tutor Disabled)

    alt Learner Solves Official Exam Task
        Learner->>Web: Submits Official Solution (isPractice: false, isUnaided: true)
        Web->>API: POST /api/v1/tasks/:id/submit (IF-01)
    else Learner Stalls in Exam
        Learner->>Web: Clicks "Buntu? Buka Panduan Langkah"
        Web->>Learner: Graceful Downgrade Confirmation Modal
        Learner->>Web: Confirms Switch Back to Sandbox Tab
    end
```

---

## 6.2 Scenario 2: Multi-Tier Oracle Evaluation, Fail-Fast AI Boundary & Multi-Observation Tracking

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner / Candidate
    participant Web as FlashLearn Web Client
    participant API as FlashLearn API Service
    participant OracleA as OracleEvaluatorClassA
    participant OracleB as OracleEvaluatorClassB / Adversarial
    participant AI as AI Gateway Service
    participant DB as PostgreSQL Database

    Learner->>Web: Submits Solution for Task Variant (e.g. variant_a / variant_b)
    Web->>API: POST /api/v1/tasks/:id/submit (IF-01)
    API->>DB: Fetch Task, Competency, DAG Edges & User Masteries (IF-03)

    alt Task is Class A (Deterministic Calculation / Checklist)
        API->>OracleA: evaluate(task, submission)
        OracleA-->>API: Score, Pass/Fail, Discrepancy Breakdown (or throws ORACLE_CLASS_A_MISCONFIGURED)
    else Task is Class B or Adversarial Dilemma
        API->>OracleB: evaluate(task, submission)
        OracleB->>AI: POST /chat/completions (json_object, 45s timeout, retry backoff) (IF-04)
        alt AI Gateway Healthy
            AI-->>OracleB: Structured Rubric / Adversarial Verdict JSON
            OracleB-->>API: Score, Trap Penalties, Pass/Fail
        else AI Gateway Unconfigured / Offline / Timeout
            OracleB-->>API: Throws AI_EVALUATOR_UNAVAILABLE
            API-->>Web: 503 Service Unavailable (Zero Silent Pass)
        end
    end

    API->>DB: Insert Attempt (isUnaided, isPractice, details, conversationHash) + Audit Log (IF-03)
    alt Official Attempt Passed
        API->>DB: Upsert Mastery (mastered) & Append scenarioVariantCode to passed_variant_codes (IF-03)
    else Practice Unaided Attempt Passed
        API->>DB: Mark mastery_records.has_passed_unaided_sandbox = true (IF-03)
    end
    API-->>Web: 200 OK (EvaluateAttemptResponse + PostTaskFlashcards)
```

---

## 6.3 Scenario 3: Gate Grant, W3C VC 2.0 Issuance & Public Verification

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner / Candidate
    participant Web as FlashLearn Web Client
    participant API as FlashLearn API Service
    participant AuthEngine as GateAuthorizationEngine
    participant Crypto as W3cCredentialCryptoEngine
    participant DB as PostgreSQL Database
    actor Employer as External Auditor / Employer

    Learner->>Web: Clicks "Klaim / Evaluasi Gerbang"
    Web->>API: POST /api/v1/gates/:gateId/grant (IF-01)
    API->>DB: Fetch Gate Requirements, Masteries & Verified Attempts (IF-03)
    API->>AuthEngine: evaluateEligibility(masteries, passedVariantCodes, requiredObservationsCount, humanSignoff)
    AuthEngine-->>API: Eligible = true
    API->>DB: Persist Active Grant in user_gate_grants + Audit Log (IF-03)
    API-->>Web: 200 OK (UserGateGrant)

    Learner->>Web: Clicks "Ekspor W3C VC 2.0"
    Web->>API: POST /api/v1/credentials/issue (IF-01)
    API->>DB: Verify Active Grant & Retrievability R >= 0.85 Across Required Competencies (IF-03)
    API->>Crypto: signCredential(claimDoc, privateKeyPem, didVerificationMethod)
    Crypto-->>API: Signed W3C VC 2.0 (DataIntegrityProof / eddsa-rdfc-2022)
    API->>DB: Persist Record in issued_credentials (IF-03)
    API-->>Web: 200 OK (Signed W3C VC JSON)

    Employer->>Web: Opens /#/verify/:grantId (IF-05)
    Web->>API: GET /api/v1/gates/verify/:grantId (IF-05)
    API->>DB: Fetch Public Passport Status & Scope (IF-03)
    API-->>Web: PublicGateVerificationResponse
    Employer->>API: POST /api/v1/credentials/verify (Uploaded VC JSON) (IF-05)
    API->>Crypto: verifyCredential(vc, workspacePublicKeyPem)
    API-->>Employer: Ed25519 Signature & Revocation Verdict
```

---

## 6.4 Scenario 4: Grounded Socratic AI Chat & SSE Streaming

- **Task-Bound Socratic Guidance**: `POST /api/v1/tasks/:id/socratic-hint` and `POST /api/v1/socratic/turn` execute `AskSocraticTutorUseCase` with real `conversationHistory`, Corpus of Record chunks, and delivered lesson context. `/api/v1/socratic/turn` persists both learner and tutor turns with a chained SHA-256 Merkle root in `socratic_chat_sessions` / `socratic_chat_turns`.
- **Contextual / Streaming Coach**: `POST /api/v1/socratic/chat` (JSON) and `POST /api/v1/socratic/stream` (SSE `text/event-stream` with `X-Accel-Buffering: no`) connect `LumisChatAssistant.svelte` directly to `AiGatewayService` for debriefing, diagnostic coaching, and drift revalidation—failing cleanly with HTTP `503` if the AI Gateway is offline rather than returning fabricated hardcoded responses.
