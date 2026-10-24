# User Story US-05: Spaced Repetition Retention & Reactive Staleness Engine
**Phase 5 | 3D Remediation Flashcards & Legal Invalidation**

## 1. Story Statement
> **AS A** Learner and Compliance Officer  
> **I WANT TO** practice personalized spaced repetition flashcards generated from failed attempt errors and have masteries reactively suspended when regulations are superseded  
> **SO THAT** retention is sustained long-term and no practitioner operates on obsolete legal rules.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Spaced Repetition and Reactive Staleness
  Scenario: Regulation supersession suspends active passports
    Given a learner holding an active Gate passport based on Source V1
    When a new superseding regulation Source V2 is ingested
    Then the Reactive Staleness Engine automatically invalidates dependent masteries
    And transitions the Gate passport status to "suspended" with audit justification
```
