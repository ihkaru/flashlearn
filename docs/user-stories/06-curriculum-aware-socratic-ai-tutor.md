# User Story US-06: Grounded Socratic AI Tutor with Curriculum Awareness
**Phase 6 | Anti-Spoiler Guided Reasoning & Curriculum Cross-Examination**

## 1. Story Statement
> **AS A** Struggling Learner  
> **I WANT TO** consult a Socratic AI tutor that understands the educational materials and lessons I have already been taught  
> **SO THAT** the AI diagnoses why I am confused and guides my thinking using reflective questions without ever leaking gold solutions or negative anchor trap IDs.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Curriculum-Aware Socratic AI Tutor
  Scenario: Socratic response references delivered materials without answer leak
    Given a learner attempting a complex procurement problem
    When the learner asks "Bagaimana cara menentukan batas overhead?"
    Then the Socratic tutor examines the delivered lessons presented to the learner
    And returns reflective guidance and statutory citations
    And strictly preserves the Anti-Spoiler Shield without revealing the exact numeric formula
```
