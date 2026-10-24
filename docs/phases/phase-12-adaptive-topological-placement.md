# Phase 12: Adaptive Topological Diagnostic Placement Engine
**Research Foundation, Psychometric Algorithms, and Implementation Specification**
**Standard: October 2026 Knowledge Space Theory (KST) & Computerized Adaptive Testing (CAT)**

---

## 1. Executive Summary & Research Foundation

### 1.1 The Legacy Onboarding Problem
In large enterprises and public institutions, newly hired or transferring personnel arrive with diverse prior competencies. Traditional training programs impose one of two flawed solutions:
1. **The Linear Firehose**: Forcing experienced senior personnel to complete all foundational beginner modules sequentially. This creates immense learner fatigue and drains organizational productivity.
2. **Unverified Exemption (Résumé Trust)**: Waiving prerequisites based on past titles or unverified self-assertions, allowing personnel with critical skill blindspots into high-stakes operational roles.

### 1.2 State-of-the-Art Benchmark (October 2026)
Research at the intersection of **Knowledge Space Theory (Doignon & Falmagne)**, **Computerized Adaptive Testing (CAT)**, and **Graph-Theoretic Psychometrics** demonstrates that prerequisite DAGs define a combinatorial **Quasi-Ordinal Knowledge Space**.

Rather than placing learners on an abstract 1-dimensional latent ability continuum ($\theta$ in classic Item Response Theory), KST models the learner's knowledge state as an explicit subset of mastered competencies:

$$\mathcal{K} \subseteq Q$$

Because a prerequisite DAG $(Q, \prec)$ strictly forbids mastering concept $B$ without mastering its prerequisite $A$, the number of structurally admissible knowledge states $\mathbb{K}$ is reduced by multiple orders of magnitude compared to $2^{|Q|}$.

By dynamically evaluating items exclusively along the **Topological Fringe (the boundary between known and unknown)**, an adaptive engine can pinpoint a practitioner's exact frontier of competence in **under 20 targeted assessment probes**, while mathematically proving transitive mastery of all antecedent prerequisite nodes.

---

## 2. Mathematical & Algorithmic Formulation

### 2.1 The Knowledge Space & Valid States
Let $Q = \{ c_1, c_2, \dots, c_n \}$ be the set of competencies in a workspace.
Let $\prec$ be the strict partial order defined by prerequisite edges: $a \prec b \iff a \text{ is a prerequisite for } b$.

A state $K \subseteq Q$ is **valid in the knowledge space $\mathbb{K}$** if and only if it is closed under prerequisites:

$$\forall b \in K, \quad \forall a \in Q, \quad (a \prec b \implies a \in K)$$

### 2.2 The Topological Fringe ($\mathcal{F}(K)$)
For any valid state $K \in \mathbb{K}$, the **outer fringe** $\mathcal{F}_{\text{out}}(K)$ consists of all unmastered competencies whose prerequisites are completely satisfied within $K$:

$$\mathcal{F}_{\text{out}}(K) = \{ c \in Q \setminus K \mid \forall p \in \text{Prereqs}(c), p \in K \}$$

The **inner fringe** $\mathcal{F}_{\text{in}}(K)$ consists of mastered competencies with no dependents in $K$ (the frontier of current achievement):

$$\mathcal{F}_{\text{in}}(K) = \{ c \in K \mid \forall d \in \text{Dependents}(c), d \notin K \}$$

### 2.3 Probabilistic Extension: Basic Local Independence Model (BLIM)
To handle real-world observational noise (careless mistakes $\beta$ and lucky guesses $\gamma$):

$$P(\text{Pass } c \mid c \in K) = 1 - \beta_c, \quad P(\text{Pass } c \mid c \notin K) = \gamma_c$$

For FlashLearn’s Class B/C tasks, guessing without competence is virtually zero ($\gamma_c \le 0.05$).

### 2.4 Minimal-Entropy Item Selection Algorithm
Let $P(K)$ be the probability distribution over valid states $K \in \mathbb{K}$.
The information entropy of the knowledge distribution is:

$$H(\mathbb{K}) = - \sum_{K \in \mathbb{K}} P(K) \log_2 P(K)$$

At step $t$, the placement engine selects candidate item $c^* \in \bigcup_{K} \mathcal{F}_{\text{out}}(K)$ that minimizes the expected posterior entropy $\mathbb{E}[H \mid c^*]$:

$$c^* = \arg\min_{c} \left( P(c) \cdot H(\mathbb{K} \mid \text{Pass } c) + (1 - P(c)) \cdot H(\mathbb{K} \mid \text{Fail } c) \right)$$

### 2.5 Transitive Evidence Propagation
When a candidate demonstrates competence on node $c^*$:
1. **Ancestral Closure**: For all ancestors $a \in \text{Anc}(c^*)$, assign $P(a \in K) \leftarrow 1.0$.
2. **Topological Advancement**: The outer fringe advances to the downstream dependents of $c^*$.
3. When a candidate fails $c^*$: All descendants $d \in \text{Desc}(c^*)$ are pruned from testing eligibility ($P(d \in K) \leftarrow 0.0$).

---

## 3. Architecture & Implementation Plan

### 3.1 Domain Layer (`apps/api/src/domain/`)
1. **Domain Model**: `KnowledgeSpace.ts`
   - Encapsulates DAG adjacency, topological sorting, prerequisite closure validation, and admissible state generation.
2. **Session Aggregate**: `DiagnosticSession.ts`
   - Fields: `id`, `workspaceId`, `userId`, `posteriorStateMap: Map<string, number>`, `probedItems: Array<{taskId, result, timestamp}>`, `status: 'IN_PROGRESS' | 'COMPLETED'`, `inferredMasteryIds: string[]`.
3. **Value Object**: `FringeRecommendation.ts`
   - Fields: `recommendedCompetencyId: string`, `recommendedTaskId: string`, `expectedInformationGain: number`, `frontierType: 'OUTER_FRINGE' | 'BOUNDARY_CONFIRMATION'`.

### 3.2 Application Layer (`apps/api/src/application/`)
1. **Engine**: [`DiagnosticPlacementEngine.ts`](file:///data/data/com.termux/files/home/projects/flashlearn/apps/api/src/application/engines/DiagnosticPlacementEngine.ts)
   - Computes state closures and Bayesian updates on item responses.
   - Terminates when $\max_{K} P(K) \ge 0.90$ or when entropy $H < \epsilon$ or maximum probes $N_{\max} = 15$ is reached.
2. **Use Cases**:
   - `StartDiagnosticSessionUseCase.ts`: Initializes uniform prior over valid DAG states.
   - `GetNextDiagnosticItemUseCase.ts`: Computes minimal-entropy fringe probe.
   - `SubmitDiagnosticResponseUseCase.ts`: Evaluates attempt, updates BLIM posteriors, and propagates ancestral mastery.

### 3.3 Persistence & Infrastructure Layer (`apps/api/src/infrastructure/`)
1. **Prisma Schema Update**:
   ```prisma
   model DiagnosticSession {
     id                 String   @id @default(uuid())
     workspaceId        String
     userId             String
     status             String   // IN_PROGRESS, COMPLETED
     probedCount        Int      @default(0)
     inferredMastery    Json     // Array of competency IDs provably mastered
     posteriorState     Json     // Compressed probability distribution
     createdAt          DateTime @default(now())
     updatedAt          DateTime @updatedAt
   }
   ```
2. **Repository**: `PrismaDiagnosticSessionRepository.ts`.

### 3.4 CLI Interface (`@flashlearn/cli`)
1. **Diagnostic Commands**:
   ```bash
   # Start adaptive diagnostic placement for a candidate
   flashlearn competency diagnose-start --workspace <ws-id> --user <user-id>

   # Inspect current diagnostic state and next recommended fringe item
   flashlearn competency diagnose-next --session <session-id>

   # Submit probe response and view Bayesian update
   flashlearn competency diagnose-submit --session <session-id> --attempt-id <attempt-id>
   ```

---

## 4. Verification & Testing Gauntlet

### 4.1 Automated Hermetic Test Cases (`apps/api/tests/diagnostic_placement.test.ts`)
1. **RED -> GREEN Case 1 (Senior Fast-Path Placement)**:
   - Setup a 4-tier DAG (10 competencies).
   - Candidate immediately passes Gate Tier 3 capstone node.
   - Assert: Engine automatically infers mastery of all 6 ancestor nodes. Session terminates in $\le 3$ probes.
2. **RED -> GREEN Case 2 (Prerequisite Gap Isolation)**:
   - Candidate passes Tier 1 nodes, but fails Tier 2 node $C_4$.
   - Assert: Engine prunes Tier 3 descendants and tests adjacent sibling nodes, isolating $C_4$ as the single deficiency.
3. **RED -> GREEN Case 3 (Admissible State Invariance)**:
   - Assert that no candidate state ever contains a node without all of its prerequisite ancestors.

### 4.2 Quality & SRP Verification
- Run static SRP analyzer: `bun run lint:srp`.
- Ensure `DiagnosticPlacementEngine.ts` is modularized into discrete subroutines (Closure, Entropy, Update) each $< 150$ lines.
