# Autonomous Coding Agent Operating Manual (`AGENT.md`)
**Repository: FlashLearn Monorepo**  
**Standard: October 2026 Agent-First Specification by Example (SBE)**

---

## 🤖 1. Prime Directives for AI Coding Agents

Every autonomous coding agent working on FlashLearn MUST adhere to the **"Old Coder" Evidence-First Methodology**:
> *"Review evidence, not code."*

1. **Spec & AST Blast Radius First**: Before writing any code, locate the matching user story in `docs/user-stories/<XX>-<name>.md` and run the gap audit tool to inspect unfulfilled requirements.
2. **Dual-Loop TDD**: RED (failing test reproducing acceptance criteria) $\rightarrow$ GREEN (minimal clean code) $\rightarrow$ REFACTOR.
3. **The Gauntlet Verification**: Every task MUST pass all automated verifications before being considered complete:
   - `bun run lint:srp`: Zero SRP violations (< 400 lines/file max budget, target < 200 lines).
   - `bun run audit:stories`: Zero gaps between To-Be User Stories and As-Is codebase.
   - `bun test`: All test suites across all 16 phases passing hermetically.
4. **Frozen Frontend Boundary**: `apps/web` is strictly frozen. NEVER modify or refactor frontend files unless explicitly instructed by the user.
5. **No Hallucinated Shortcuts**: No mocks in production code paths, no unlinked endpoints, no silent try/catch blocks.

---

## 🔍 2. User Story Gap Auditor (`user-story-gap-auditor`)

The **User Story Gap Auditor** skill deterministically verifies that To-Be requirements in `docs/user-stories/` are faithfully implemented in the As-Is codebase (Domain, Application Use Cases, REST Controllers, CLI Schemas & Commands, and Hermetic Test Suites).

### Running the Gap Audit

```bash
# Run full monorepo gap audit across all 16 user stories
bun run audit:stories

# Or invoke the python script directly
python3 scripts/audit_story_gap.py

# Audit a specific story (e.g. US-16 Cryptographic Verifiable Credentials)
python3 scripts/audit_story_gap.py --story US-16

# Machine-readable JSON output for autonomous reasoning
python3 scripts/audit_story_gap.py --json

# Strict mode for CI/pre-commit (exits with code 1 if any gaps remain)
python3 scripts/audit_story_gap.py --strict
```

### Gap Status Taxonomy
- `✅ [IMPLEMENTED] (100.0%)`: All Gherkin scenarios, CLI actions, REST endpoints, and typed error invariants are verified with automated tests.
- `⚠️ [PARTIAL_GAP] (< 100.0%)`: Implementation exists, but specific CLI subcommands, endpoints, or edge case assertions are missing.
- `❌ [MISSING] (0.0%)`: No implementation or automated tests found.

---

## 📐 3. October 2026 User Story Quality Standard

When authoring or updating user stories in `docs/user-stories/`:

1. **Numbered Identification**: Follow numbered naming `docs/user-stories/<XX>-<slug>.md` where `XX` is `01` to `16`.
2. **INVEST & Value Framing**: `AS A [Role] I WANT TO [Action] SO THAT [Measurable Value]`.
3. **Architectural Guardrails**: Define hard technical boundaries (SRP line limits, optimal Big-O complexity, copyleft default-deny).
4. **Specification by Example (SBE)**: Gherkin scenarios (`Feature:`, `Scenario:`, `Given`, `When`, `Then`) with concrete data payloads, status codes, and exact edge cases.
5. **Machine-Verifiable Acceptance Predicates (MVPs)**: Concrete checklist items verified by test runners and static analyzers rather than agent self-assessment.

---

## 🚀 4. Common Agent Commands

| Task | Command |
|---|---|
| Run full test suite | `bun test` |
| Run single phase test | `bun test apps/api/tests/phase<XX>.test.ts` |
| Run CLI unit tests | `bun test packages/cli/tests/cli_phases.test.ts` |
| Check SRP line budgets | `bun run lint:srp` |
| Run User Story Gap Audit | `bun run audit:stories` |
| Agent-first CLI execution | `bun run cli <noun> <action> [flags]` |
| Generate Drizzle SQL | `cd apps/api && bun run db:generate` |
| Safe DB Migration Runner | `cd apps/api && bun run db:migrate` |
