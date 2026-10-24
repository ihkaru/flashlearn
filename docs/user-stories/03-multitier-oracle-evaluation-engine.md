# User Story US-03: Multi-Tier Oracle Evaluation Engine
**Phase 3 | Class A Deterministic Calculations & Class B Case Studies with Traps**

## 1. Story Statement
> **AS A** Certification Designer  
> **I WANT TO** evaluate learner attempts using multi-tier oracle evaluators (Class A formulas and Class B AI Judge with negative anchor traps)  
> **SO THAT** submissions are evaluated deterministically without human grading delays, and fatal operational traps are caught immediately.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Multi-Tier Oracle Evaluator Engine
  Scenario: Class A deterministic math rejection
    Given a Class A task with expected HPS total = Rp 1.221.000.000 (tolerance 100)
    When a learner submits an incorrect calculation of Rp 1.000.000.000
    Then the evaluator rejects the submission, logs calculation discrepancies, and generates a 3D flashcard
```
