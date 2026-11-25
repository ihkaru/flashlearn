---
arc42_section: 9
verified_commit: "70f04ca"
verified_timestamp: "2026-11-24T23:59:45Z"
branch: main
tracked_paths:
  - apps/
  - packages/
  - scripts/
---

# 9. Architecture Decisions (ADRs)

> [!INFO] **Architecture Provenance & Freshness**
> - **Verified Commit**: `fed4511` (branch: `main`)
> - **Verified Timestamp**: `2026-11-24T23:50:30Z`
> - **Tracked Paths**: `apps/`, `packages/`, `scripts/`
> - **Drift Status**: `verified`

This section documents architecturally significant decisions (ADRs) governing the FlashLearn platform.

---

## ADR-01: Bun Runtime & Package Manager Enforcement
- **Status**: Accepted
- **Context**: Node.js and legacy npm workflows on constrained ARM64 containers exhibit high memory overhead and slower startup/test cycles.
- **Decision**: Enforce Bun (`bun@1.4.2`, Docker `oven/bun:1.4-alpine`) across all workspaces (`apps/api`, `apps/web`, `packages/shared`, `packages/cli`). Direct `npm`/`npx` calls are blocked by environment shims.
- **Consequences**: Native TypeScript execution, sub-second hermetic unit tests (`bun test`), and minimal idle RAM footprint.
- **Risks Created**: RISK-01

---

## ADR-02: Dual-Loop Architecture & Graceful Downgrade Protocol
- **Status**: Accepted
- **Context**: Confronting candidates with strict Oracle exams immediately after reading causes high extraneous cognitive load (*Assessment-as-Instruction Fallacy*).
- **Decision**: Structure each competency modal (`TaskRunnerModal.svelte`) into two explicit loops: Tab 1 Safe Sandbox (`LearningSandboxTab.svelte`) and Tab 2 Official Gate Exam (`GateExamTab.svelte`). Candidates can downgrade from Tab 2 back to Tab 1 via a confirmation modal without polluting official transcripts.
- **Consequences**: Clear separation between penalty-free practice and auditable certification attempts.
- **Risks Created**: RISK-02

---

## ADR-03: Domain-Agnostic Backward Scaffolding Generation
- **Status**: Accepted
- **Context**: Authoring worked examples and job aids manually for every competency creates an SME bottleneck, while hardcoding procurement examples violates domain agnosticism.
- **Decision**: Implement `BackwardScaffoldingGenerator` (`apps/api/src/application/services/BackwardScaffoldingGenerator.ts`) to derive Job Aids, scaled isomorphic Worked Examples, and Micro-Sandbox checkpoints dynamically from `cognitiveArchetype`, `task.oracleData`, `task.adversarialSpec`, and DB `source_chunks`.
- **Consequences**: Any newly imported domain immediately receives relevant scaffolding without code edits.
- **Risks Created**: RISK-03

---

## ADR-04: Multi-Tier Oracle Evaluation Architecture (Classes A, B, and C)
- **Status**: Accepted
- **Context**: Pure LLM scoring hallucinates on arithmetic and lacks accountability on terminal delegations, whereas purely deterministic code cannot judge nuanced case studies.
- **Decision**: Partition evaluation into three classes:
  - Class A (`OracleEvaluatorClassA`): Deterministic TypeScript evaluation enforcing $\pm 1\%$ default relative tolerance and failing fast (`ORACLE_CLASS_A_MISCONFIGURED`) when criteria are missing.
  - Class B (`OracleEvaluatorClassB` & `OracleEvaluatorAdversarial`): Grounded LLM evaluation with RCAF rubrics, negative-anchor traps, and veto thresholds.
  - Class C (`MultiRaterConsensusEngine`): Double-blind multi-rater human review computing Gwet's AC1/AC2 and Chief Arbiter reconciliation.
- **Consequences**: Deterministic accuracy on calculations, structured qualitative grading, and human sign-off on terminal gates.
- **Risks Created**: RISK-04

---

## ADR-05: W3C Verifiable Credentials 2.0 & Ed25519 DataIntegrityProof
- **Status**: Accepted
- **Context**: Proprietary badge platforms lock learner credentials inside walled gardens.
- **Decision**: Issue W3C Verifiable Credentials 2.0 / OpenBadges 3.0 signed with Ed25519 via `DataIntegrityProof` (`eddsa-rdfc-2022`) and deterministic canonical JSON (`W3cCredentialCryptoEngine`). Store workspace keypairs and revocation status in PostgreSQL (`workspace_keypairs`, `issued_credentials`) and expose public verification via `/api/v1/credentials/verify` and `/#/verify/:id`.
- **Consequences**: Cryptographically verifiable, tamper-evident credentials checkable without database mutation.
- **Risks Created**: RISK-05

---

## ADR-06: Causal Schema Priming & Persisted Unaided Practice Gate
- **Status**: Accepted
- **Context**: Unguided AI tutoring during practice degrades unaided exam performance (*Bastani et al., 2025*), and definition-only flashcards fail to build operational mental models.
- **Decision**: Extend `spaced_flashcards` with causal probe types (`causal_prediction`, `analogical_comparison`, `micro_debugging`) rendered in `CausalProbeDeck.svelte`. Require learners to record an unaided sandbox checkpoint (`POST /api/v1/competencies/:id/unaided-sandbox-pass` or unaided practice attempt) before unlocking Tab 2 Gate Exam, and strictly disable `SocraticTutorDrawer` inside `GateExamTab.svelte` (`disableAiTutor={true}`).
- **Consequences**: Prevents AI crutch reliance during official gate verification and persists readiness state across sessions.
- **Risks Created**: RISK-06

---

## ADR-07: Declarative CLI Blueprint Pipeline & Zero-Domain Hardcoding in Core
- **Status**: Accepted
- **Context**: Hardcoding domain statutes inside core UI or services (previously present in `CorpusReferenceCard` and `BackwardScaffoldingGenerator`) breaks multi-domain scalability.
- **Decision**: Keep core runtime code (`apps/api/src/domain`, `apps/api/src/application`, `apps/web/src`, `packages/shared/src`) 100% domain-agnostic. Load *Corpus of Record* chunks dynamically from PostgreSQL (`GetCompetencyLearningBundleUseCase` -> `CorpusReferenceCard.svelte`). Onboard arbitrary domains via the Headless CLI (`flashlearn domain validate-blueprint` / `import-blueprint` / `describe`), while isolating optional turnkey starter seeds solely under `apps/api/src/infrastructure/database/seeds/`.
- **Consequences**: Zero-code onboarding of new domains with Tarjan SCC acyclicity and rubric weight checks before database writes.
- **Risks Created**: RISK-07

---

## ADR-08: XSS-Hardened Client-Side Markdown Engine (Marked v18 + KaTeX + DOMPurify + Highlight.js)
- **Status**: Accepted
- **Context**: Rendering learning modules as plain text degrades mathematical formula and code legibility, while allowing inline `onclick` attributes in sanitized HTML creates XSS risk.
- **Decision**: Use `marked@18`, `marked-katex-extension`, `highlight.js/lib/common`, custom `markedAlert` GitHub callouts, and `DOMPurify` whitelisting MathML/SVG elements without `onclick` (delegating copy-button clicks safely via `data-code` in `MarkdownRenderer.svelte`).
- **Consequences**: High-fidelity technical pedagogy with full XSS immunity.
- **Risks Created**: none

---

## ADR-09: Resilient OpenAI-Compatible AI Gateway & Fail-Fast Oracle/Tutor Boundary
- **Status**: Accepted
- **Context**: Earlier LLM integration suffered from a 5-second timeout, a DI constructor argument swap that disabled Socratic AI entirely, silent fallback logic in `OracleEvaluatorClassB` that could award 100% passing scores when the LLM was offline, and fake `setTimeout(600)` hardcoded replies in `lumisChat.svelte.ts`.
- **Decision**: Standardize all LLM connectivity on `IAiGateway` -> `AiGatewayService` with env-only credentials (`AI_GATEWAY_URL`, `AI_GATEWAY_KEY`, `AI_TIMEOUT_MS=45000`), exponential backoff retries (`Bun.sleep`) on transient 429/5xx errors, multi-turn `messages` forwarding, `response_format: json_object` with 400 fallback, SSE streaming (`/api/v1/socratic/stream`), and `/api/v1/health/ai` diagnostics. Enforce strict fail-fast HTTP `503` errors (`AI_EVALUATOR_UNAVAILABLE` / `AI_TUTOR_UNAVAILABLE`) across Oracles and Socratic endpoints—eliminating all silent fallbacks and fake browser replies.
- **Consequences**: Honest, observable, production-viable LLM connectivity compatible with Lumis AI Gateway, 9router, OpenRouter, OpenAI, or self-hosted vLLM/Ollama without compromising evaluation integrity.
- **Risks Created**: RISK-04

---

## ADR-10: Clement–Brown Bridging Analogies, Grounding Router & Guided Single-Focus UX
- **Status**: Accepted
- **Context**: Static Markdown reading modules (`materi`) and basic MCQs feel too shallow when learners lack prior experiential anchors, while exposing many simultaneous tabs/panels creates cognitive overload on mobile screens.
- **Decision**: Introduce `contents.type = 'interactive_module'` with structured `interactive_payload` (`UilaV2BlockSet` in `packages/shared/src/types/interactive.ts`) governed by an explicit `groundingDecision.mode` (`experiential_anchor_bridge` | `direct_analogy` | `thought_experiment` | `direct_formalism`) and mandatory `analogyBreakpoint`. Compile modules deterministically via `buildGuidedLearningSteps` into a calm one-step-per-screen flow (`InteractiveModuleViewer.svelte`) with 2-tier Anchoring Micro-Labs, `<1ms` 5-axis diagnostic checks, and automatic local + PostgreSQL resume (`learner_content_progress`) for both authenticated users and guest `x-learner-session` devices.
- **Consequences**: Accelerated comprehension without jargon walls, zero setup-cost waste when direct formalism is faster, and effortless resume across sessions.
- **Risks Created**: none

---

## ADR-11: Lazy-Loaded Sandboxed HTML Artifact Isolation & Licensing Boundary
- **Status**: Accepted
- **Context**: Authoring visual slide decks externally via CLI tools (such as `guizang-ppt-skill`, licensed under GNU AGPL-3.0) produces rich interactive HTML files that contain executable `<script>` blocks and must remain license-isolated from FlashLearn's core repository while remaining XSS-safe on mobile Portrait and Landscape viewports.
- **Decision**: Store HTML artifacts in a separate lazy-loaded `content_artifacts` table (`0010_interactive_learning_modules.sql`) audited pre-upload (`auditHtmlArtifactSafety`), never copy AGPL-3.0 template/runtime code into FlashLearn core, and render artifacts generically inside `<iframe sandbox="allow-scripts">` (without `allow-same-origin`) wrapped with FlashLearn's MIT `buildSandboxedDeckHtml` host bridge (in-memory `localStorage` fallback, automatic mobile `low-power` mode, and `event.source`-verified `postMessage` slide synchronization).
- **Consequences**: Strict XSS containment, clean license separation, fast workspace listing queries, and zero-reload Portrait/Landscape slide transitions.
- **Risks Created**: none

---

## ADR-12: Zero-Forced-Config Persistent Media Assets, Always-Accessible Figure Drawer & Unbounded 1..N Elastic Flow
- **Status**: Accepted
- **Context**: Extracting real figures/diagrams from PDFs/EPUBs/PPTXs previously risked relying on external private media servers or ephemeral container disks, while singleton step fields (`1` lab / `1` hinge check / `1` stress test) and pre-mechanics `hinge_check` placement on `direct_formalism` modules created avoidable learner friction.
- **Decision**:
  1. Persist module figures via pluggable `IMediaBlobStore` defaulting to zero-config PostgreSQL `media_asset_blobs` + content-addressed SHA-256 `media_assets` metadata (`0011_persistent_media_assets.sql`), with opt-in `local` volume and opt-in `mediavault` drivers (`MEDIA_STORAGE_DRIVER`).
  2. Display context-matched figures inline via `ModuleFigureStrip.svelte` (responsive 2-column comparison when 2+ figures share a step) AND surface every module figure from any step via the **`Ilustrasi & Diagram (N)`** drawer in `GlossaryDisclosure.svelte` sharing `FigureLightboxModal.svelte`.
  3. Place `hinge_check` **after** `mechanics` whenever `groundingDecision.mode === 'direct_formalism'` (no Block 2 grounding), and remove artificial singleton caps via backward-compatible optional arrays (`additionalAnchoringLabs`, `additionalHingeChecks`, `additionalErroneousExamples`, `additionalStressTests`, `slideEndIndex`, `figures[].stepId`) so complex modules scale cleanly (`Unbounded Composition, Bounded Attention`).
- **Consequences**: 100% upstream-safe zero-config persistence across container redeploys, immediate visual discoverability from Step 1, and cognitively sound sequencing without working-memory overload.
- **Risks Created**: none

---

## ADR-13: Zero-Trust Multi-Tenant Authorization, Hardened Auth/Crypto & Defense-in-Depth Boundaries (Phase 21)
- **Status**: Accepted
- **Context**: A comprehensive source-first security audit (November 2026 OWASP API Top 10) identified high-impact boundary gaps across legacy controllers: unconditional `/demo-login`, fallback `JWT_SECRET`, untrusted `publicKeyPem` in VC verification, cross-tenant BOLA/IDOR on curriculum/audit/review routes, unauthenticated Socratic session endpoints, fail-open XSS in `MarkdownRenderer.svelte`, public cache headers on private assets, and unbounded ZIP extraction in CLI.
- **Decision**: Centralize tenant authorization in `workspace-guard.ts` (`assertWorkspaceOwner`, `assertWorkspaceReadable`, `requirePermission`), enforce fail-fast `JWT_SECRET` + `HS256` algorithm pinning, require `email_verified === true` on Google OAuth, resolve VC issuer public keys strictly from PostgreSQL, encrypt Ed25519 private keys at rest when `CREDENTIAL_KMS_KEY` is configured, add CSP + OWASP response headers + rate limiting + non-root Docker `USER bun`, harden `MarkdownRenderer.svelte` fail-closed, delimit AI Oracle submissions against prompt injection, and bound CLI ZIP decompression (`createSafeZipFilter`).
- **Consequences**: Eliminates cross-tenant privilege escalation, credential forgery, and stored XSS while preserving clean developer ergonomics in local test environments.
- **Risks Created**: none

---

## ADR-14: Restrained Multi-Workspace Visual Identity & 120Hz GPU-Composited Learning Motion (Phase 22)
- **Status**: Accepted
- **Context**: Every workspace previously shared an identical hardcoded teal accent and displayed redundant UI controls (`DomainTrackSelector` duplicated lecture units on the `Topik Belajar` tab; empty `0`-count filter pills cluttered single-type workspaces).
- **Decision**: Hide `DomainTrackSelector` outside `Peta Kompetensi`, suppress zero-count/redundant filter pills, introduce a deterministic 6-palette WCAG-AA workspace theme (`workspaceTheme.ts`) applied via restrained tonal framing (top accent edge, monogram tint, active tab, content breadcrumb), and standardize learning micro-animations (`learning-motion.css`) exclusively on GPU-composited `transform`/`opacity` with full `prefers-reduced-motion` static fallback.
- **Consequences**: Immediate peripheral workspace orientation without visual clutter and smooth, low-cognitive-load study transitions on mobile and desktop.
- **Risks Created**: none

---

## ADR-15: Scalable Interleaved Quiz & Flashcard Drill Modules (10–600+ Questions, Phase 23)
- **Status**: Accepted
- **Context**: Technical interview & quantitative finance books contain dozens to 600+ practice problems that need to sit cleanly alongside conceptual modules (or interleaved after specific lecture units) without rendering 600+ DOM nodes at once or penalizing partial micro-sessions.
- **Decision**: Extend `QuizQuestion`/`FlashcardItem` with optional `topic`/`sourceRef`, add `POST /api/v1/contents/:id/check-question` for zero-leak single-question Active Practice, add `sessionMode: 'subset'` scoring in `SubmitQuizUseCase`, support `contentType: 'quiz'` (`quiz-drill-v1`) in `packages/cli` (`quiz-drill-pusher.ts`) + filter soft-deleted items in `plan diff` (`DEBT-07`), and build a chunked 3-mode frontend (`QuizDrillSetupCard`, `ActivePracticeRunner` with Confidence Calibration & KaTeX, `FlashcardDeck` with Leitner Re-Queue & keyboard shortcuts, and `PaginatedExamView`).
- **Consequences**: Effortless active recall and interleaved drilling for 10 to 600+ question banks at locked 120Hz performance on mobile and desktop.
- **Risks Created**: none

---

## ADR-16: Tactile Learning Feedback — Progressive Web Audio & Mastery Milestones (Phase 24)
- **Status**: Accepted
- **Context**: Extended technical study sessions benefit from immediate multi-sensory momentum cues (progressive pitch escalation, calibrated streak milestones, Leitner redemption) without triggering cognitive overload, auditory fatigue, or the overjustification effect.
- **Decision**: Synthesize brief (`<320ms`, `<2kHz`) pentatonic/chord earcons procedurally via Web Audio API (`learningFeedback.svelte.ts`, 0 KB external audio assets, muted by default with 1-click persistent `SoundToggleButton`) paired with non-blocking workspace-themed `LearningMilestoneToast` banners (`pointer-events: none`) and GPU-composited `.fl-milestone-pop`/`.fl-streak-pop` transitions respecting `prefers-reduced-motion`.
- **Consequences**: Engaging, zero-latency mastery reinforcement during Active Practice, 3D Flashcards, and Interactive Module completion with zero reading disruption.
- **Risks Created**: none
