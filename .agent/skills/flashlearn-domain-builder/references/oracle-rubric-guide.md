# Oracle Rubric & Cognitive Tier Mapping Guide

This reference guides coding agents in mapping regulatory sections and Bloom's taxonomy tiers to FlashLearn's 3-Tier Oracle evaluation classes and adversarial stress testing.

---

## 1. Bloom's Taxonomy to Oracle Class Mapping

| Bloom's Tier | Cognitive Depth | Oracle Class | Task Type | Evaluator Architecture |
| :--- | :--- | :--- | :--- | :--- |
| **Remember / Understand** | Threshold definitions, statutory limits, mandatory ratios | **Class A** | `calculation` or `checklist` | Deterministic mathematical formulas, exact tolerance checking ($\pm 0.01$), Boolean checklist criteria |
| **Apply / Analyze** | Trade-off dilemmas, procurement method selection, vendor shortlisting | **Class B** | `case_study` | AI Judge Evaluator with Gold Benchmark Solution and Negative Anchors (Traps) |
| **Evaluate / Create** | High-risk contract drafting, emergency procurement sign-off | **Class C** | `document_draft` | Double-blind human master assessor workflow with Gwet's $\text{AC}_1 / \text{AC}_2$ consensus |
| **Operational Stress** | Urgency pressure, missing technical clearances, vendor deception | **Class B / Adv** | `adversarial_dilemma` | `AdversarialDilemmaEvaluator` with Trap Sensitivity Index ($\text{TSI}$) and Zero-Tolerance Veto Rule |

---

## 2. Progressive Gate Hierarchy Monotonicity

When generating gates for any domain:
1. **Gate 1 (Foundational Operational License)**:
   - Contains exclusively Class A (and elementary Class B) competencies.
   - Evaluates whether the practitioner knows formulas, regulatory boundaries, and mandatory forms.
2. **Gate 2 (Applied Operational Practitioner)**:
   - Requires Gate 1 prerequisites.
   - Contains Class B case study tasks requiring trade-off analysis and trap avoidance.
3. **Gate 3 (High-Risk Independent Authority & Capstone)**:
   - Requires Gate 2 prerequisites.
   - Contains Class C document drafting and Adversarial Dilemma stress tests.
   - Authorizes the issuance of Cryptographic Verifiable Credentials (W3C VC 2.0).

> [!IMPORTANT]
> **Strict Monotonicity Invariant**: No prerequisite edge may point backwards from a higher Gate level to a lower Gate level ($u \in \text{Gate}_j \to v \in \text{Gate}_i$ where $j > i$ is strictly prohibited).
