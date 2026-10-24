# User Story US-02: Prerequisite DAG & Directed Competency Graph
**Phase 2 | Partial Order Skill Mastery & Cycle Prevention**

## 1. Story Statement
> **AS A** Curriculum Engineer or Lead Assessor  
> **I WANT TO** link competency nodes into a Directed Acyclic Graph (DAG) with strict prerequisite relationships  
> **SO THAT** learners cannot attempt advanced downstream procedures until all necessary foundational prerequisites are provably mastered, and circular dependencies are mathematically prevented.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Prerequisite Directed Acyclic Graph and Progression
  Scenario: Blocking downstream access when prerequisites are unmastered
    Given competency node A linked as a prerequisite for competency node B
    When a learner evaluates their progression status
    Then node B is marked as "locked" with blockingPrerequisites containing node A
    And node B dynamically transitions to "ready" once node A is mastered
```
