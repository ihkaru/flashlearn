# User Story US-14: Predictive Competency Drift & Skill Half-Life Decay Modeling
**Phase 14 | Dynamic Competency Health Index & Spaced Revalidation**
**Standard: October 2026 DSR (Difficulty, Stability, Retrievability) Model**

---

## 1. Story Statement
> **AS AN** Enterprise Operations Director or Chief Compliance Officer  
> **I WANT TO** track the perishable decay of demonstrated skills over time using the DSR (Difficulty, Stability, Retrievability) memory model  
> **SO THAT** certifications do not provide a false sense of permanent security, and practitioners are automatically routed 5-minute micro-revalidation challenges before their operational retrievability falls below safety thresholds.

---

## 2. Acceptance Criteria (Gherkin Format)

```gherkin
Feature: Predictive Competency Drift and Micro-Revalidation

  Scenario: Retrievability decay triggers drift warning
    Given a learner with verified competency stability S = 30 days
    When elapsed time t reaches 30 days without operational activity
    Then calculated retrievability R(30) must drop to approximately 0.90
    And when t reaches 90 days, R(90) drops below 0.85
    And the system transitions competency status to "DRIFT_WARNING"
    And automatically queues a targeted 5-minute micro-revalidation dilemma in the learner's priority feed

  Scenario: Successful spaced micro-challenge stretches stability
    Given a learner completing a micro-revalidation challenge when R(t) = 0.80
    When the challenge is successfully defended
    Then the engine must calculate stability stretch S' > S * 1.8
    And restore competency status to "ACTIVE_VERIFIED"

  Scenario: Severe decay or challenge failure suspends dependent passport
    Given a learner whose retrievability drops below R(t) < 0.70 or who fails a revalidation challenge
    When the decay batch worker runs
    Then the competency transitions to "PROVISIONALLY_EXPIRED"
    And dependent Gate Level 3 Passports are automatically suspended from cryptographic credential issuance
```
