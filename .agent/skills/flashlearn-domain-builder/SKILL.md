---
name: flashlearn-domain-builder
description: Autonomous end-to-end curriculum synthesizer that ingests Markdown regulations/SOPs, decomposes them into a verified 3-tier prerequisite DAG, constructs Class A/B/C and adversarial tasks, and verifies 100% domain readiness via FlashLearn CLI. Use when the user wants to generate, bootstrap, or expand an educational/operational competency domain from Markdown files.
---

# FlashLearn Domain Builder Skill: Autonomous Markdown Ingestion & Curriculum Synthesizer
**Standard: October 2026 Agent Skills Standard (Agentic AI Foundation)**

This skill enables any autonomous coding agent (Antigravity CLI, Claude Code, Cursor, Codex, Windsurf, Aider) to transform raw statutory regulations or operational SOPs formatted as Markdown (`.md`) into a fully functional, verified FlashLearn educational and certification domain.

---

## 1. Quick Reference: CLI & Script Commands

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Inspect Document** | `head -n 50 <file.md>` | Examine document title, headers, and regulatory structure |
| **Simulate (Dry-Run)** | `bun .agent/skills/flashlearn-domain-builder/scripts/synthesize_domain.ts --workspace-name "<NAME>" --source-files "<file1.md,file2.md>" --dry-run` | Validates chunking, Tarjan's SCC acyclicity, and preview JSON |
| **Export Blueprint** | `bun .agent/skills/flashlearn-domain-builder/scripts/synthesize_domain.ts --workspace-name "<NAME>" --source-files "<file1.md>" --output ./blueprint.json --dry-run` | Emits validated `DomainBlueprint` JSON |
| **Persist Domain** | `bun .agent/skills/flashlearn-domain-builder/scripts/synthesize_domain.ts --workspace-name "<NAME>" --source-files "<file1.md>"` | Ingests all sources, creates DAG nodes, gates, and tasks |
| **Audit Readiness** | `bun run cli workspace describe <workspace-id>` | Verifies 0 cycles, 0 orphans, 100% gate coverage, and readiness score |

---

## 2. 6-Stage Autonomous Execution Protocol

### Stage 1: Document Inspection & Preparation
1. Locate the input Markdown regulation file(s).
2. Verify that files contain structured delimiters such as `# Headers`, `Pasal X`, `BAB Y`, or `Bagian Z`.
3. If documents lack headers, ensure clean paragraph breaks (`\n\n`) for fallback addressable chunking.

### Stage 2: Dry-Run Synthesis & Graph Verification
Always run a dry-run first to preview the synthesized DAG without mutating the database:
```bash
bun .agent/skills/flashlearn-domain-builder/scripts/synthesize_domain.ts \
  --workspace-name "Manajemen Risiko Pengadaan" \
  --source-files "./docs/sop_pengadaan.md" \
  --dry-run
```
Examine the returned JSON envelope:
- Confirm `dagIsAcyclic: true`.
- Confirm `chunksCount > 0`.
- Confirm `competenciesCount >= 3`.

### Stage 3: Topological & Gate Hierarchy Invariant Check
The synthesizer must strictly enforce the **3-Tier Bloom Architecture**:
- **Gate 1 (Foundational License)**: Class A tasks (deterministic calculations, compliance checklists).
- **Gate 2 (Applied Practitioner)**: Class B tasks (case studies with negative anchors/fatal traps).
- **Gate 3 (High-Risk Independent Authority)**: Class C / Phase 11 Adversarial Dilemmas (omission traps, urgency/authority pressure).

Review [`references/oracle-rubric-guide.md`](./references/oracle-rubric-guide.md) if custom rubrics or cognitive tiers are needed.

### Stage 4: Production Ingestion Execution
Execute the synthesis command targeting the running backend API:
```bash
bun .agent/skills/flashlearn-domain-builder/scripts/synthesize_domain.ts \
  --workspace-name "Manajemen Risiko Pengadaan" \
  --source-files "./docs/sop_pengadaan.md"
```
The script will output the created `workspaceId` and initial diagnostic ledger.

### Stage 5: Domain Diagnostics Verification
Run the diagnostics command using `@flashlearn/cli`:
```bash
bun run cli workspace describe <workspace-id>
```
Verify the diagnostic envelope:
```json
{
  "readinessScore": 100,
  "cycleDetected": false,
  "gaps": []
}
```

### Stage 6: Self-Healing Gap Remediation
If `readinessScore < 100` or `gaps` are returned:
1. **Orphan Competency**: If a node lacks incoming or outgoing links, execute:
   `bun run cli competency link --workspace <ws-id> --source <parent-id> --target <orphan-id>`
2. **Missing Gate Association**: If a node is not covered by any Gate level, execute:
   `bun run cli gate update <gate-id> ...`
3. Re-run `workspace describe <id>` until score reaches $100\%$.

---

## 3. Behavioral Guardrails for Autonomous Agents
- **Zero Hallucinated Citations**: Every generated task and rubric criterion must cite an addressable `locationTag` present in the source chunks.
- **Zero Monolithic Bloat**: Keep helper scripts modular and under 400 lines of code.
- **Review Evidence, Not Claims**: Always provide terminal output from `workspace describe` as proof of readiness.
