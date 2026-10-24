# User Story US-12: Adaptive Topological Diagnostic Placement Engine
**Phase 12 | Knowledge Space Theory (KST) on Prerequisite DAG**
**Standard: October 2026 Computerized Adaptive Testing (CAT)**

---

## 1. Story Statement
> **AS A** Lead Instructional Officer or Senior Operational Assessor  
> **I WANT TO** administer an adaptive diagnostic placement test governed by Knowledge Space Theory over our workspace prerequisite DAG  
> **SO THAT** experienced incoming personnel (seniors or transfer specialists) are placed at their exact competence frontier in under 20 minutes, automatically earning transitive prerequisite mastery by implication without having to endure dozens of redundant beginner modules.

---

## 2. Acceptance Criteria (Gherkin Format)

```gherkin
Feature: Adaptive Topological Diagnostic Placement via Knowledge Space Theory

  Scenario: Senior candidate passes capstone frontier node and skips all ancestors
    Given a workspace with a 4-tier prerequisite DAG consisting of 10 interconnected competencies
    And a candidate initiating an adaptive diagnostic placement session
    When the candidate is presented with a Minimal-Entropy Fringe probe at Tier 3
    And the candidate successfully passes the evaluation with a score >= 85
    Then the placement engine must calculate Bayesian ancestral closure
    And automatically mark all transitive prerequisite ancestors as "Provably Mastered by Implication"
    And terminate the diagnostic session in <= 3 test probes
    And output an inferred mastery ledger without false competence

  Scenario: Candidate fails an intermediate prerequisite node
    Given a candidate who passes foundational Tier 1 nodes
    When the candidate fails a Tier 2 node C_4
    Then the engine must immediately prune all downstream descendants of C_4 from testing eligibility
    And select the next item from the remaining outer fringe boundary
    And isolate node C_4 as the candidate's exact prerequisite blindspot

  Scenario: Zero invalid knowledge states invariant
    Given the partial order of prerequisites in the workspace
    When the engine computes the posterior probability distribution over knowledge states
    Then all candidate states must satisfy the Quasi-Ordinal Knowledge Space closure:
      | Rule | Invariant |
      | Ancestral Closure | If B in State, then Prereqs(B) must be in State |
      | Entropy Reduction | Each probe must strictly reduce or maintain information entropy |
```

---

## 3. Key Architectural Components

1. **Domain Model**: `apps/api/src/domain/models/KnowledgeSpace.ts` (DAG adjacency, admissible state generation, topological sorting, and fringe boundaries).
2. **Diagnostic Aggregate**: `apps/api/src/domain/entities/DiagnosticSession.ts` (records state posteriors, item history, and inferred mastery IDs).
3. **Application Engine**: `apps/api/src/application/engines/DiagnosticPlacementEngine.ts` (implements BLIM, minimal-entropy item selection, and transitive evidence propagation).
4. **Use Cases**:
   - `StartDiagnosticSessionUseCase.ts`: Initializes uniform prior over valid DAG states.
   - `GetNextDiagnosticItemUseCase.ts`: Computes next minimal-entropy fringe item.
   - `SubmitDiagnosticProbeUseCase.ts`: Evaluates attempt, updates BLIM posteriors, and propagates ancestral mastery.
5. **CLI Subcommand**:
   - `flashlearn competency diagnose-start --workspace <id> --user <userId>`
   - `flashlearn competency diagnose-next --session <sessionId>`
   - `flashlearn competency diagnose-submit --session <sessionId> --attempt-id <attemptId>`
