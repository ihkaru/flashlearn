# User Story US-13: Double-Blind Multi-Rater Consensus Engine
**Phase 13 | Class C Human Assessment Governance & Arbitration**
**Standard: October 2026 Gwet’s $\text{AC}_1 / \text{AC}_2$ Inter-Rater Reliability**

---

## 1. Story Statement
> **AS A** Certification Board Director or Chief Auditor  
> **I WANT TO** govern high-stakes Class C document drafting assessments using a double-blind, two-rater evaluation workflow with Gwet’s $\text{AC}_1 / \text{AC}_2$ reliability statistics  
> **SO THAT** rater subjectivity, halo effects, and the Prevalence Paradox are mathematically eliminated, and disputed evaluations are automatically escalated to an independent Chief Arbiter.

---

## 2. Acceptance Criteria (Gherkin Format)

```gherkin
Feature: Double-Blind Multi-Rater Consensus and Arbitration

  Scenario: High raw agreement with skewed distribution (Prevalence Paradox Immunity)
    Given two independent human raters evaluating a Class C candidate submission
    And 95% of rubric criteria are awarded concordant passing scores
    When the system calculates inter-rater reliability
    Then Cohen's Kappa may drop artificially due to marginal skew
    And Gwet's AC1 must remain >= 0.85, correctly reflecting high agreement
    And the system must approve consensus without unnecessary escalation

  Scenario: Significant rater score divergence triggers Chief Arbiter escalation
    Given Rater 1 awards a score of 92% and Rater 2 awards a score of 68% (delta = 24%)
    When the second rater submits their scorecard
    Then the system must flag delta > 15% and AC2 < 0.80
    And lock the attempt in status "ARBITRATION_REQUIRED"
    And assign the submission with an anonymized blind token to a 3rd referee (Chief Arbiter)

  Scenario: Candidate identity sanitization under double-blind tokens
    Given an assessor querying an assigned review item via blind token
    When the scorecard is fetched
    Then the API must sanitize candidate name, user ID, department, and peer reviewer identity
```
