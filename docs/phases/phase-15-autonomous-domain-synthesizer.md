# Phase 15: Autonomous Domain Synthesizer & Auto-Curator Agent
**Research Foundation, Adversarial Grounding Pipeline, and Implementation Specification**
**Standard: October 2026 Dual-Stage Grounded Curriculum Synthesis & Tarjan SCC Validation**

---

## 1. Executive Summary & Research Foundation

### 1.1 The Authoring Bottleneck
Transforming an 800-page government regulation (e.g., Perpres Pengadaan Barang/Jasa) or an airline Flight Operations Manual into an exhaustive, multi-tiered FlashLearn workspace requires:
1. Decomposing complex legal/technical articles into discrete, single-responsibility competencies.
2. Formulating multi-level prerequisite dependency graphs.
3. Defining objective scoring rubrics with clear pass/fail discriminators.
4. Crafting Socratic Anti-Spoiler Guard instructions so the AI tutor does not leak answers.

When attempted manually, this takes subject matter experts months. When attempted with naive one-shot LLM prompts, the resulting curriculum suffers from **hallucinated citations**, **topological cycles (circular prerequisites)**, and **loose, subjective rubrics**.

### 1.2 State-of-the-Art Benchmark (October 2026)
Modern automated knowledge engineering mandates a **Dual-Stage Generator-Verifier Architecture**:
- **Stage 1 (Generative Structure Extractor)**: Decomposes ingested source chunks into candidate competency nodes, cognitive tiers (Bloom's taxonomy), tasks (Class A/B/C), and rubrics.
- **Stage 2 (Adversarial Citation Verifier)**: An independent, adversarial verification agent evaluates each candidate node against the raw source text chunks. If a rubric criterion claims a statutory requirement that does not exist in the source chunks, the node is rejected with a typed citation failure.
- **Topological Integrity & Cycle Prevention**: The entire generated DAG is verified using **Tarjan’s Strongly Connected Components (SCC)** algorithm to guarantee acyclicity ($O(V+E)$) before any entity is persisted.

---

## 2. Mathematical & Algorithmic Formulation

### 2.1 The Domain Blueprint Specification
A synthesized workspace is expressed as an atomic `DomainBlueprint`:

$$\mathcal{B} = \langle \mathcal{W}_{\text{meta}}, \mathcal{C}, \mathcal{E}_{\text{prereq}}, \mathcal{G}, \mathcal{T} \rangle$$

Where:
- $\mathcal{C} = \{ c_1, c_2, \dots, c_n \}$ are discrete competencies with cognitive tiers.
- $\mathcal{E}_{\text{prereq}} \subseteq \mathcal{C} \times \mathcal{C}$ are directed prerequisite edges.
- $\mathcal{G} = \{ g_1, g_2, g_3 \}$ are the three standard Gate stages (Foundational, Applied, Capstone).
- $\mathcal{T} = \{ \tau_1, \dots, \tau_m \}$ are associated tasks with rubrics and Socratic oracle shields.

### 2.2 Adversarial Grounding Score ($\text{AGS}$)
For each generated competency $c \in \mathcal{C}$ citing source text chunks $\{ s_1, \dots, s_k \}$:

$$\text{AGS}(c) = \min_{r \in \text{Rubric}(c)} \text{SemanticEntailment}(r, \{ s_1, \dots, s_k \})$$

If $\text{AGS}(c) < 0.85$, the node is flagged as ungrounded and rejected.

### 2.3 Graph Topological Verification
1. **Acyclicity Check**:
   $$\text{TarjanSCC}(\mathcal{C}, \mathcal{E}_{\text{prereq}}) \implies \forall \text{ component } C_i, \quad |C_i| = 1$$
2. **Gate Hierarchy Monotonicity**:
   If $c_a \in \text{Gate}_i$ and $c_b \in \text{Gate}_j$ and $(c_a, c_b) \in \mathcal{E}_{\text{prereq}}$, then:
   $$\text{Level}(g_i) \le \text{Level}(g_j)$$
   *(No foundational Gate 1 task may require an unearned Gate 3 capstone).*

---

## 3. Architecture & Implementation Plan

### 3.1 Domain Layer (`apps/api/src/domain/`)
1. **Value Object**: `DomainBlueprint.ts`
   - Encapsulates complete JSON structure of competencies, edges, gates, tasks, and sources.
2. **Validator Service**: `BlueprintTopologicalValidator.ts`
   - Runs Tarjan's SCC cycle detection, orphan detection, and gate monotonicity checks.
3. **Verification Result**: `BlueprintVerificationResult.ts`
   - Returns typed errors: `CYCLIC_DEPENDENCY`, `UNGROUNDED_CITATION`, `ORPHAN_COMPETENCY`, `GATE_MONOTONICITY_VIOLATION`.

### 3.2 Application Layer (`apps/api/src/application/`)
1. **Dual-Stage Pipeline Services**:
   - `DomainSynthesizerService.ts`: Invokes LLM with strict JSON schema to generate candidate blueprint from ingested chunks.
   - `AdversarialCitationVerifier.ts`: Performs reverse grounding checks against `SourceChunk` records.
2. **Use Case**: `BootstrapDomainFromSourceUseCase.ts`
   - Orchestrates: Read Sources $\rightarrow$ Synthesize $\rightarrow$ Adversarial Verify $\rightarrow$ Cycle Check $\rightarrow$ Atomic Persistence.
   - Supports `--dry-run` to output preview and gap diagnostics.

### 3.3 Persistence & Infrastructure Layer (`apps/api/src/infrastructure/`)
1. **Atomic Transaction Unit of Work**:
   - Executes batch insertions in PostgreSQL using `prisma.$transaction`:
     - Creates competencies.
     - Creates prerequisite edges.
     - Creates tasks, rubrics, and gate associations.
   - Rolls back cleanly if any constraint fails.

### 3.4 CLI Interface (`@flashlearn/cli`)
1. **Domain Bootstrap Commands**:
   ```bash
   # Dry-run synthesis from existing ingested sources
   flashlearn domain bootstrap \
     --workspace <ws-id> \
     --source-ids <src-1>,<src-2> \
     --dry-run

   # Execute synthesis and atomic commit
   flashlearn domain bootstrap \
     --workspace <ws-id> \
     --source-ids <src-1>,<src-2>

   # Validate an external blueprint JSON file
   flashlearn domain validate-blueprint --file ./blueprint.json
   ```

---

## 4. Verification & Testing Gauntlet

### 4.1 Automated Hermetic Test Cases (`apps/api/tests/domain_synthesizer.test.ts`)
1. **RED -> GREEN Case 1 (Cycle Detection Rejection)**:
   - Provide a blueprint with intentional cycle: $A \to B \to C \to A$.
   - Assert: Validator rejects with `CYCLIC_DEPENDENCY` and pinpoints the exact 3-node cycle path.
2. **RED -> GREEN Case 2 (Hallucinated Citation Rejection)**:
   - Provide a blueprint where a rubric item cites an imaginary article.
   - Assert: Adversarial verifier flags node with `UNGROUNDED_CITATION`.
3. **RED -> GREEN Case 3 (Atomic Bootstrap Execution)**:
   - Ingest a sample SOP file.
   - Run bootstrap use case.
   - Assert: All nodes, tasks, and prerequisites are created transactionally; `flashlearn domain describe` returns Readiness Score $100\%$.

### 4.2 Quality & SRP Verification
- Run static SRP analyzer: `bun run lint:srp`.
- Ensure `BlueprintTopologicalValidator.ts` and `AdversarialCitationVerifier.ts` are strictly decoupled, each $< 200$ lines.
