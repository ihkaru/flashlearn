# Phase 11: Adversarial Dilemma & Stress Testing Engine
**Research Foundation, Mathematical Scoring Model, and Implementation Specification**
**Standard: October 2026 Situational Judgment & Adversarial Red-Teaming**

---

## 1. Executive Summary & Research Foundation

### 1.1 The High-Consequence Failure Mode
In high-stakes enterprise and governmental environments (e.g., government procurement, civil aviation, clinical triage, financial auditing), operational failure almost never occurs because a practitioner forgot a basic textbook fact. Catastrophic failures occur when practitioners are placed under **cognitive stress, ethical ambiguity, and incomplete information**.

Conventional LMS platforms and AI tutors test under idealized "clean-room" conditions: every variable is given, instructions are clear, and the candidate merely selects or generates an optimal path. In reality, practitioners face:
1. **The Omission Trap**: Critical specifications or statutory clearances are omitted from the dossier. Candidates with superficial competence guess, hallucinate, or fill in the blanks rather than refusing to proceed without required data.
2. **The Deception Trap**: Counterparties or vendors provide superficially polished submissions that conceal invalid accreditations, conflicting appendix clauses, or inflated unit costs.
3. **The Authority & Deadline Pressure Trap**: Superiors or operational schedules exert acute urgency ("Sign off today or the project loses funding"), tempting candidates to bypass mandatory verification protocols.
4. **The Disguised Conflict-of-Interest Trap**: Subtle ethical breaches disguised as routine industry courtesies (e.g., vendor-sponsored overseas training).

### 1.2 State-of-the-Art Benchmark (October 2026)
Research in **Situational Judgment Tests (SJTs)**, **Interactive Behavioral Probes**, and **Automated Red-Teaming for Professional Competence** establishes that robust human evaluation requires:
- **Latent Trap Injection**: Embedding specific diagnostic traps whose detection directly discriminates between genuine operational vigilance and superficial compliance.
- **Probe-Based Dual-Pass AI Evaluation**: Decoupling the assessment of *behavioral disposition* (what the candidate decided to do) from *stylistic eloquence* (how well they wrote their answer).
- **The Zero-Tolerance Boundary Rule**: In high-consequence domains, failing to identify an integrity breach or proceeding on omitted safety parameters results in an immediate failing grade, regardless of how thorough the rest of the submission is.

---

## 2. Mathematical & Algorithmic Formulation

### 2.1 Adversarial Specification Schema
An adversarial task is parameterized by an `AdversarialDilemmaSpec`:

$$\mathcal{D} = \langle \mathcal{T}, \mathcal{C}_{\text{disposition}}, \mathcal{I}_{\text{traps}}, \mathcal{P}_{\text{policy}}, \theta_{\text{veto}} \rangle$$

Where:
- $\mathcal{T} \in \{ \text{OMISSION\_DATA}, \text{CONFIDENCE\_DECEPTION}, \text{AUTHORITY\_PRESSURE}, \text{ETHICAL\_CONFLICT} \}$ is the primary trap archetype.
- $\mathcal{C}_{\text{disposition}} \in \{ \text{REJECT\_AND\_DEMAND\_DATA}, \text{FLAG\_IRREGULARITY}, \text{ENFORCE\_BOUNDARY}, \text{ESCALATE\_AUDIT} \}$ is the mandatory operational response.
- $\mathcal{I}_{\text{traps}} = \{ (c_1, w_1), (c_2, w_2), \dots, (c_m, w_m) \}$ is the set of planted trap cues and their relative diagnostic weights ($\sum w_i = 1$).
- $\mathcal{P}_{\text{policy}}$ is the statutory/domain citation that governs the boundary (e.g., "Perpres 16/2018 Pasal 51 ayat 2").
- $\theta_{\text{veto}} \in [0, 1]$ is the minimum Trap Sensitivity Index required to avoid an immediate automatic disqualification (default: $0.70$).

### 2.2 Trap Sensitivity Index ($\text{TSI}$)
Given a candidate's submission artifact $A$ and rationale $R$:

$$\text{TSI} = \sum_{i=1}^m w_i \cdot \mathbb{I}(\text{Candidate identified cue } c_i \text{ in } A \lor R)$$

### 2.3 Boundary Defense Score ($\text{BDS}$)
Evaluates whether the candidate held the operational boundary against pressure:

$$\text{BDS} = \begin{cases} 
1.0 & \text{if disposition matches } \mathcal{C}_{\text{disposition}} \text{ without concession} \\
0.5 & \text{if candidate noted irregularity but conditionally yielded or compromised} \\
0.0 & \text{if candidate yielded, guessed missing data, or approved defective dossier}
\end{cases}$$

### 2.4 Composite Adversarial Score ($\mathcal{S}_{\text{adv}}$)
$$\mathcal{S}_{\text{adv}} = \begin{cases}
0.0 & \text{if } \text{TSI} < \theta_{\text{veto}} \lor \text{BDS} = 0.0 \quad \text{(Automatic Trap Trigger)} \\
0.50 \cdot \text{TSI} + 0.30 \cdot \text{BDS} + 0.20 \cdot \text{RSS} & \text{otherwise}
\end{cases}$$

Where $\text{RSS} \in [0, 1]$ is the **Rationale Soundness Score** evaluating statutory justification and risk assessment.

---

## 3. Architecture & Implementation Plan

### 3.1 Domain Layer (`apps/api/src/domain/`)
1. **Value Object**: `AdversarialDilemmaSpec.ts`
   - Validates trap archetypes, correct disposition, trap cues, and veto threshold.
2. **Domain Entity Extension**: Update `Task.ts`
   - Add `type: 'adversarial_dilemma'`.
   - Add getter `getAdversarialSpec(): AdversarialDilemmaSpec | null`.
3. **Evaluation Result**: `AdversarialEvaluationResult.ts`
   - Fields: `tsi: number`, `bds: number`, `rss: number`, `compositeScore: number`, `disqualifiedByTrap: boolean`, `triggeredTraps: string[]`, `missedTraps: string[]`, `feedback: string`.

### 3.2 Application Layer (`apps/api/src/application/`)
1. **Evaluator**: `AdversarialDilemmaEvaluator.ts` (implements `ITaskEvaluator`)
   - **Pass 1 (Deterministic Cue Extraction)**: Probe evaluation comparing candidate output against $\mathcal{I}_{\text{traps}}$.
   - **Pass 2 (Boundary & Statutory CoT)**: Structured evaluation prompt with zero tolerance for sycophancy or hallucinated concessions.
2. **Factory Update**: Register `AdversarialDilemmaEvaluator` into `EvaluatorFactory.ts`.
3. **Use Cases**:
   - `CreateAdversarialTaskUseCase.ts`: Validates adversarial spec and prerequisite integrity.
   - `EvaluateAttemptUseCase.ts`: Routes `adversarial_dilemma` to the specialized evaluator.

### 3.3 Persistence & Infrastructure Layer (`apps/api/src/infrastructure/`)
1. **Prisma Schema Update**:
   - In `schema.prisma`, add `adversarialSpecJson Json?` to model `Task`.
   - In model `TaskAttempt`, add `adversarialResultJson Json?`.
2. **Migration**: Generate and run Prisma migration for nullable JSON fields.
3. **Repository Mapping**: Update `PrismaTaskRepository.ts` and `PrismaTaskAttemptRepository.ts`.

### 3.4 CLI Interface (`@flashlearn/cli`)
1. **Task Subcommand**:
   ```bash
   flashlearn task create \
     --workspace <ws-id> \
     --competency <comp-id> \
     --title "Audit Evaluasi Pengadaan Server DC" \
     --type adversarial_dilemma \
     --adversarial-spec '{
       "trapType": "OMISSION_DATA",
       "correctDisposition": "REJECT_AND_DEMAND_DATA",
       "trapCues": [
         {"cue": "Sertifikat laik fungsi gedung belum terlampir", "weight": 0.5},
         {"cue": "Spesifikasi pendingin ruang server tidak mencantumkan BTU", "weight": 0.5}
       ],
       "statutoryPolicy": "Perpres 16/2018 Pasal 51 ayat 2",
       "vetoThreshold": 0.7
     }'
   ```
2. **Attempt Inspection**:
   ```bash
   flashlearn attempt get <attempt-id> --fields id,status,score,adversarialResult
   ```

---

## 4. Verification & Testing Gauntlet

### 4.1 Automated Hermetic Test Cases (`apps/api/tests/adversarial_dilemma.test.ts`)
1. **RED -> GREEN Case 1 (Trap Triggered - Automatic Disqualification)**:
   - Candidate writes an elaborate 1000-word approval but misses both missing certificate cues.
   - Assert: `tsi = 0.0`, `disqualifiedByTrap = true`, `score = 0.0`, `passed = false`.
2. **RED -> GREEN Case 2 (Compromise / Sycophancy Failure)**:
   - Candidate identifies the missing certificate, but agrees to sign off because the Director demanded it.
   - Assert: `tsi = 1.0`, `bds = 0.5`, `passed = false`, feedback explicitly cites boundary failure.
3. **RED -> GREEN Case 3 (Exemplary Operational Defense)**:
   - Candidate identifies all cues, refuses sign-off, cites exact statutory clause, and provides formal deficiency notification.
   - Assert: `tsi = 1.0`, `bds = 1.0`, `rss >= 0.9`, `score >= 95.0`, `passed = true`.

### 4.2 Quality & SRP Verification
- Run `python3 ~/.gemini/config/skills/craftsman-coder/scripts/static_srp_analyzer.py apps/ packages/ --strict`.
- Verify all newly created files stay strictly under 250 lines.
