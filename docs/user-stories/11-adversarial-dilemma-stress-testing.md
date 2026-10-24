# User Story US-11: Adversarial Dilemma & Stress Testing Engine
**Phase 11 | Situational Judgment Tests (SJT) under Red-Teaming & Cognitive Load**
**Standard: October 2026 Operational Integrity & Boundary Defense**

---

## 1. Story Statement
> **AS A** Chief Regulatory Officer, Aviation Safety Director, or Procurement Inspector  
> **I WANT TO** subject candidates to adversarial dilemma simulations containing subtle omissions, counterparty deception, and executive deadline pressure  
> **SO THAT** candidates are evaluated on whether they maintain operational boundaries and refuse unauthorized compromises, rather than merely scoring on rhetorical eloquence.

---

## 2. Acceptance Criteria (Gherkin Format)

```gherkin
Feature: Adversarial Dilemma Stress Testing & Boundary Defense

  Scenario: Candidate misses omitted technical clearance and signs off under urgency
    Given an adversarial task with trapType "OMISSION_DATA"
    And planted trap cues: "Sertifikat laik fungsi gedung belum terlampir"
    When the candidate submits an approval acknowledging urgency pressure but ignoring the omission
    Then the evaluator must compute Trap Sensitivity Index (TSI) < 0.70
    And Boundary Defense Score (BDS) = 0.0
    And trigger the automatic disqualification veto rule setting score = 0
    And mark the attempt as failed with "DISKUALIFIKASI OTOMATIS: Terpicu jebakan omisi"

  Scenario: Candidate detects missing data but grants conditional dispensation (sycophancy)
    Given an adversarial task requiring mandatory disposition "REJECT_AND_DEMAND_DATA"
    When the candidate identifies the omission but yields to executive pressure by granting a temporary exception
    Then the evaluator must assign Boundary Defense Score (BDS) = 0.50
    And fail the attempt for unauthorized concession under pressure

  Scenario: Candidate identifies all cues, refuses compromise, and cites statutory clause
    Given an adversarial task with 2 weighted trap cues and statutory policy "Perpres 16/2018 Pasal 51 ayat 2"
    When the candidate refuses to sign off, demands missing data, and cites the statutory clause
    Then the evaluator must award TSI = 1.0, BDS = 1.0, and Rationale Soundness (RSS) >= 0.70
    And award a composite score >= 85
    And mark the attempt as passed with "LULUS UJI ADVERSARIAL"
```

---

## 3. Implementation Artifacts
- Evaluator: [`apps/api/src/domain/services/OracleEvaluatorAdversarial.ts`](file:///data/data/com.termux/files/home/projects/flashlearn/apps/api/src/domain/services/OracleEvaluatorAdversarial.ts)
- Automated Test Suite: [`apps/api/tests/phase11.test.ts`](file:///data/data/com.termux/files/home/projects/flashlearn/apps/api/tests/phase11.test.ts)
- CLI Support: `flashlearn task create --type adversarial_dilemma --adversarial-spec '<json>'`
