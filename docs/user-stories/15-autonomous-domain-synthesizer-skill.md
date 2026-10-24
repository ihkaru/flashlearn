# User Story US-15: Autonomous Domain Synthesizer & Agent-Agnostic Skill Engine
**Phase 15 | Autonomous Markdown SOP Ingestion & Tarjan SCC Validation**
**Standard: October 2026 Agent Skills Standard (Agentic AI Foundation)**

---

## 1. Story Statement
> **AS A** Lead Instructional Engineer, Subject Matter Expert, or Autonomous Coding Agent  
> **I WANT TO** ingest one or more statutory / SOP documents formatted in Markdown using the `flashlearn-domain-builder` skill  
> **SO THAT** the system autonomously synthesizes a cycle-free 3-Tier Bloom DAG, creates Class A/B/C and adversarial stress-testing tasks with Socratic anti-spoiler guards, and verifies 100% domain readiness without manual authoring bottlenecks.

---

## 2. Acceptance Criteria (Gherkin Format)

```gherkin
Feature: Autonomous Domain Synthesis from Markdown Regulations

  Scenario: Ingesting Markdown SOP and synthesizing verified domain
    Given raw statutory Markdown documents containing headings (Pasal, BAB, # Headers)
    When the coding agent executes `flashlearn domain synthesize --workspace-name "<name>" --source-files "<files>"`
    Then the engine parses and hashes each section with SHA256 addressable chunk metadata
    And maps competencies to Bloom's taxonomy:
      | Gate Level | Cognitive Tier | Task Type |
      | Gate 1     | Remember / Apply | Class A Calculation & Checklist |
      | Gate 2     | Analyze / Evaluate | Class B Case Study with Negative Anchors |
      | Gate 3     | Synthesize / Defend | Phase 11 Adversarial Stress Dilemma |
    And validates that the prerequisite graph is acyclic using Tarjan's SCC algorithm (|C_i| = 1)
    And atomically creates the workspace, sources, competencies, gates, and tasks
    And runs `flashlearn domain describe <id>` confirming readinessScore = 100% and gaps = []
```
