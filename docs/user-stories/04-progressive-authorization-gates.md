# User Story US-04: Progressive Authorization Gates & Human Review Workflow
**Phase 4 | Gate 0–3 Passports & High-Risk Sign-Off**

## 1. Story Statement
> **AS A** Senior Expert Practitioner or Licensing Body  
> **I WANT TO** govern high-risk operational privileges via progressive authorization gates and a human sign-off review queue for Class C tasks  
> **SO THAT** no learner can self-pass into high-consequence operational roles without verified master practitioner endorsement.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Progressive Authorization Gates and Review Queue
  Scenario: Class C attempt enters expert review queue
    Given a Class C high-risk task attempt submitted by a learner
    When the evaluation completes
    Then the attempt is locked in "pending_expert_review"
    And the learner is strictly forbidden from grading their own attempt
    And Gate Level 3 is unlocked only after a qualified senior expert signs off
```
