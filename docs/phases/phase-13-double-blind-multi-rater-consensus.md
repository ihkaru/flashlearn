# Phase 13: Double-Blind Multi-Rater Consensus Engine
**Research Foundation, Psychometric Reliability Statistics, and Implementation Specification**
**Standard: October 2026 Human Assessment Governance & Gwet’s $\text{AC}_1 / \text{AC}_2$ Consensus**

---

## 1. Executive Summary & Research Foundation

### 1.1 The Vulnerability of Single-Rater Human Assessment
For Class C high-consequence operational tasks (e.g., complex procurement contract drafting, clinical trial protocol reviews, enterprise system architecture defense), AI auto-evaluation must be accompanied or governed by qualified human master practitioners.

However, single-human assessment introduces fatal vulnerabilities into enterprise certification:
1. **Subjective Rater Bias & Severity Variation**: "Hawks" grade severely, failing competent practitioners; "Doves" pass inadequate candidates out of leniency.
2. **Halo and Identity Effects**: Assessors who recognize a candidate’s name, department, or prior rank grade them differently.
3. **The Prevalence Paradox of Cohen's Kappa**: In high-performing operational pools where 85–95% of candidates meet standard requirements, traditional inter-rater reliability metrics like Cohen’s Kappa ($\kappa$) **collapse to near zero or become negative**, falsely indicating lack of agreement even when raters agree 95% of the time.

### 1.2 State-of-the-Art Benchmark (October 2026)
High-stakes professional credentialing standards mandate:
- **Strict Double-Blind Anonymization**: Submissions are decoupled from user identities via cryptographic one-time `blindToken`s. Two independent expert raters evaluate the artifact without seeing the candidate's profile or each other's scorecards.
- **Gwet’s $\text{AC}_1$ and $\text{AC}_2$ Statistics**: Developed by Dr. Kilem Liem Gwet, $\text{AC}_1$ (for categorical ratings) and $\text{AC}_2$ (for ordinal rubric grades) solve the Prevalence Paradox by adjusting chance agreement based on uniform random selection rather than skewed marginal totals.
- **Automated Referee Escalation**: If the score discrepancy between Rater 1 and Rater 2 exceeds a mathematical threshold ($\Delta > 15\%$) or $\text{AC}_1 < 0.80$, the attempt is locked and automatically escalated to a 3rd blind referee (**Chief Arbiter**).

---

## 2. Mathematical & Algorithmic Formulation

### 2.1 The Prevalence Paradox in Rubric Grading
Given $N$ rubric criteria evaluated by 2 independent raters into $K$ ordinal categories (e.g., *1: Unsatisfactory, 2: Competent, 3: Exemplary*):
- Observed percentage agreement:
  $$P_o = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(R_{1, i} = R_{2, i})$$
- Cohen's Kappa defines chance agreement $P_e^{\text{Cohen}}$ using the product of marginal proportions:
  $$P_e^{\text{Cohen}} = \sum_{k=1}^K p_{1, k} \cdot p_{2, k}, \quad \text{where } p_{r, k} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(R_{r, i} = k)$$
  When candidates are well-trained and criteria are predominantly rated "Competent" (e.g., $p_{r, 2} \approx 0.90$), $P_e^{\text{Cohen}} \approx 0.81$. If $P_o = 0.85$, Cohen's $\kappa = \frac{0.85 - 0.81}{1 - 0.81} \approx 0.21$ (**misleadingly classified as "Poor" agreement**).

### 2.2 Gwet’s $\text{AC}_1$ Formulation
Gwet models chance agreement without marginal skew bias:

$$\pi_k = \frac{p_{1, k} + p_{2, k}}{2}$$

$$P_e^{\text{Gwet}} = \frac{1}{K - 1} \sum_{k=1}^K \pi_k (1 - \pi_k)$$

$$\text{AC}_1 = \frac{P_o - P_e^{\text{Gwet}}}{1 - P_e^{\text{Gwet}}}$$

In the identical scenario above ($P_o = 0.85, K = 3$), Gwet's $P_e \approx 0.18$, yielding $\text{AC}_1 \approx 0.82$ (**accurately classified as "Excellent" agreement**).

### 2.3 Ordinal Rubrics: Gwet’s $\text{AC}_2$
For multi-level rubrics with weights $w_{k, l} = 1 - \frac{(k - l)^2}{(K - 1)^2}$ (quadratic weights):

$$P_o^* = \frac{1}{N} \sum_{i=1}^N w_{R_{1, i}, R_{2, i}}, \quad P_e^* = \frac{1}{K - 1} \sum_{k, l} w_{k, l} \cdot \pi_k (1 - \pi_l)$$

$$\text{AC}_2 = \frac{P_o^* - P_e^*}{1 - P_e^*}$$

### 2.4 Consensus & Dispute Decision Rules
1. **Unanimous Consensus**: If $| \text{Score}_1 - \text{Score}_2 | \le 15.0$ and $\text{AC}_2 \ge 0.80$:
   $$\text{FinalScore} = \frac{\text{Score}_1 + \text{Score}_2}{2}, \quad \text{Status} \leftarrow \text{CONSENSUS\_APPROVED}$$
2. **Dispute Escalation**: If $| \text{Score}_1 - \text{Score}_2 | > 15.0$ or $\text{AC}_2 < 0.80$:
   $$\text{Status} \leftarrow \text{ARBITRATION\_REQUIRED}$$
   A 3rd referee (Chief Arbiter) evaluates blind. The final score is computed as the median of the three ratings or the mean of the two closest concordant raters.

---

## 3. Architecture & Implementation Plan

### 3.1 Domain Layer (`apps/api/src/domain/`)
1. **Value Object**: `InterRaterReliabilityResult.ts`
   - Fields: `observedAgreement: number`, `gwetAC1: number`, `gwetAC2: number`, `cohenKappa: number`, `scoreDelta: number`, `hasConsensus: boolean`, `requiresArbiter: boolean`.
2. **Entity Aggregate**: `TaskAttemptReview.ts`
   - Fields: `id`, `attemptId`, `reviewerId`, `blindToken: string`, `rubricScoresJson: Record<string, number>`, `totalScore: number`, `status: 'ASSIGNED' | 'SUBMITTED' | 'DISPUTED'`.
3. **Domain Event**: `AttemptConsensusReachedEvent`, `AttemptArbitrationTriggeredEvent`.

### 3.2 Application Layer (`apps/api/src/application/`)
1. **Engine**: `MultiRaterConsensusEngine.ts`
   - Computes $P_o$, Gwet's $\text{AC}_1$, Gwet's $\text{AC}_2$, and quadratic distance matrices.
2. **Use Cases**:
   - `AssignBlindReviewersUseCase.ts`: Generates anonymized blind tokens and assigns two qualified raters.
   - `SubmitBlindReviewUseCase.ts`: Records rater scores and triggers consensus calculation when both are complete.
   - `EscalateToChiefArbiterUseCase.ts`: Assigns referee on dispute.

### 3.3 Persistence & Infrastructure Layer (`apps/api/src/infrastructure/`)
1. **Prisma Schema Update**:
   ```prisma
   model TaskAttemptReview {
     id               String    @id @default(uuid())
     attemptId        String
     reviewerId       String
     blindToken       String    @unique
     rubricScores     Json
     totalScore       Float
     status           String    // ASSIGNED, SUBMITTED, DISPUTED, ARBITRATED
     submittedAt      DateTime?
     createdAt        DateTime  @default(now())

     attempt          TaskAttempt @relation(fields: [attemptId], references: [id])
     @@index([attemptId])
     @@index([reviewerId])
   }
   ```
2. **Repository**: `PrismaTaskAttemptReviewRepository.ts`.

### 3.4 CLI Interface (`@flashlearn/cli`)
1. **Review Commands**:
   ```bash
   # View pending double-blind review queue for the logged-in evaluator
   flashlearn attempt review-queue --blind --limit 10

   # Submit scores using the anonymized blind token
   flashlearn attempt score --blind-token <token> --rubric-scores '{"crit1": 3, "crit2": 2}'

   # View inter-rater agreement statistics and consensus status
   flashlearn attempt irr-report <attempt-id>
   ```

---

## 4. Verification & Testing Gauntlet

### 4.1 Automated Hermetic Test Cases (`apps/api/tests/multi_rater_consensus.test.ts`)
1. **RED -> GREEN Case 1 (High Agreement, Skewed Distribution - Gwet vs Kappa)**:
   - Construct a test case with 95% raw agreement on a dominant category.
   - Assert: Cohen's $\kappa < 0.30$ (Prevalence Paradox demonstrated).
   - Assert: Gwet's $\text{AC}_1 \ge 0.85$ (Correctly approved consensus).
2. **RED -> GREEN Case 2 (Automatic Arbiter Escalation)**:
   - Rater 1 awards 92%, Rater 2 awards 68% ($\Delta = 24\%$).
   - Assert: `hasConsensus = false`, `requiresArbiter = true`, attempt enters `ARBITRATION_REQUIRED`.
3. **RED -> GREEN Case 3 (Double-Blind Privacy Invariant)**:
   - Verify that fetching an attempt via `blindToken` sanitizes candidate name, user ID, and any reference to peer reviewers.

### 4.2 Quality & SRP Verification
- Run static SRP analyzer: `bun run lint:srp`.
- Ensure `MultiRaterConsensusEngine.ts` contains purely stateless mathematical functions $< 180$ lines.
