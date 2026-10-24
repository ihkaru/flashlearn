# Phase 17: Bi-directional Lumis Agentic Socratic Bridge & Two-Way RPC Protocol
**Research Foundation, Inter-Process Protocol Specification, and UI Integration Architecture**  
**Standard: October 2026 Agentic Cognitive Scaffolding & Sandboxed Web RPC**

---

## 1. Executive Summary & Research Foundation

### 1.1 The Epistemic Offloading Dilemma in AI-Assisted Learning
Modern generative AI chat interfaces often suffer from a fundamental pedagogical flaw: **epistemic offloading**. When learners are faced with complex regulatory reasoning, calculation formulas, or ethical stress tests, typical LLM chat interfaces tend to immediately generate the direct answer or summarize the solution. This destroys the desired learning effect (*desirable difficulty*), reducing long-term retention and undermining the validity of competency verification.

In FlashLearn, learning is governed by deterministic oracles (Class A/B/C and Adversarial Dilemmas). To maintain the validity of high-consequence competency passports:
1. **The Anti-Spoiler Constraint:** The AI assistant must never disclose target numerical answers, formula constants, or hidden negative anchor names.
2. **Curriculum-Grounded Scaffolding:** Dialogues must be anchored to addressable statutory chunks (`source_chunks`) and the learner's position in the Prerequisite Directed Acyclic Graph (DAG).
3. **Frictionless Argument Adoption:** Once a learner articulates a valid deductive argument in dialogue with the AI, they must be able to adopt that reflection directly into their task submission without breaking cognitive momentum.

### 1.2 The Lumis Architecture
Lumis (`ihkaru/lumis`) is an ultra-lightweight, zero-bloat AI chat interface built on pure Rust and Svelte 5 runes. By deploying Lumis as an isolated micro-frontend (`https://chat.dvlpid.my.id/embed/chat`), FlashLearn achieves:
- **Zero Style Collision:** Total isolation between Framework7 (FlashLearn) and Tailwind CSS (Lumis).
- **Sub-Millisecond DOM Hydration:** Powered by Svelte 5 runes without heavy legacy bundle overhead.
- **Secure Sandboxed Context Passing:** Cross-origin communication restricted strictly to validated RFC 6454 `window.postMessage` payloads.

---

## 2. Protocol Specification: Two-Way PostMessage RPC v2

### 2.1 Message Envelope Contract

All messages exchanged between FlashLearn (`host-app`) and Lumis (`lumis-widget`) comply with the following typed JSON envelope:

```typescript
export interface LumisRpcEnvelope<T = unknown> {
  source: 'host-app' | 'lumis-widget';
  event: 
    | 'lumis:ready'           // Lumis -> Host: Iframe DOM hydrated & ready
    | 'lumis:init'            // Host -> Lumis: Ingest domain context & boundaries
    | 'lumis:send_prompt'     // Host -> Lumis: Trigger user prompt programmatically
    | 'lumis:adopt_draft'     // Lumis -> Host: Learner transfers reflection to task form
    | 'lumis:session_sync'    // Lumis -> Host: Sync active conversation ID
    | 'lumis:error';          // Either: Typed RPC failure
  payload?: T;
  timestamp: number;
}
```

### 2.2 Event Lifecycle Flowchart

```
┌────────────────────────┐                    ┌────────────────────────┐
│  FlashLearn Host (App) │                    │ Lumis Chat (Iframe)    │
└──────────┬─────────────┘                    └──────────┬─────────────┘
           │                                             │
           │  1. Mount iframe (/embed/chat)              │
           ├────────────────────────────────────────────►│
           │                                             │
           │  2. lumis:ready (with sessionId)            │
           │◄────────────────────────────────────────────┤
           │                                             │
           │  3. lumis:init (Context & Anti-Spoiler Meta)│
           ├────────────────────────────────────────────►│
           │                                             │
           │  4. lumis:send_prompt (Initial/Quick Pill)  │
           ├────────────────────────────────────────────►│
           │                                             │
           │  5. Interactive Socratic Multi-Turn Chat    │
           │◄ - - - - - - - - - - - - - - - - - - - - - ►│
           │                                             │
           │  6. lumis:adopt_draft (Transfer Reflection) │
           │◄────────────────────────────────────────────┤
           │                                             │
           │  7. Auto-populate TaskExecutionForm textarea│
           ▼                                             ▼
```

### 2.3 Context Payload Schema (`lumis:init`)

When opening Lumis from any learning phase, FlashLearn injects a structured domain context:

```typescript
export interface LearningChatContext {
  phase: 'socratic_tutor' | 'adversarial_debrief' | 'diagnostic_guide' | 'drift_revalidation' | 'general';
  workspaceId?: string;
  workspaceName?: string;
  taskId?: string;
  taskTitle?: string;
  taskType?: string;
  scenario?: string;
  competencyCode?: string;
  competencyTitle?: string;
  gateLevel?: number;
  retrievability?: number;
  antiSpoilerShield?: {
    hideTargetCalculation: boolean;
    hideNegativeAnchors: boolean;
    forbiddenTerms: string[];
  };
}
```

---

## 3. Learning Phase Integration Matrix

| Learning Phase | Trigger Point in FlashLearn | Socratic Prompt Anchor | Target Learning Outcome |
| :--- | :--- | :--- | :--- |
| **Phase 06: Socratic Guided Reasoning** | `TaskExecutionForm.svelte` & `SocraticTutorDrawer.svelte` | Task Scenario & Regulatory Standard | Resolves learner impasse on Class A/B tasks without disclosing formula constants or trap identities. |
| **Phase 11: Adversarial Dilemma Debrief** | Post-attempt review in `TaskExecutionForm.svelte` | Dilemma Scenario & Operational Pressure | Deep debrief on why statutory requirements cannot be conceded under deadline urgency. |
| **Phase 12: Topological Diagnostic Placement** | `DiagnosticPlacementModal.svelte` | Knowledge Space DAG Fringe & Inferred Nodes | Explains why certain prerequisite nodes were automatically credited and recommends optimal learning path. |
| **Phase 14: Predictive Drift Revalidation** | `CompetencyDagView.svelte` on drifting nodes ($R(t) < 0.85$) | Half-life decay metrics & past attempt | Rapid conversational refresher quiz before the learner takes the formal revalidation challenge. |

---

## 4. Resilience, Sandboxing & Security

### 4.1 Strict Origin Verification
Every incoming `MessageEvent` in `LumisChatAssistant.svelte` validates the origin:
```typescript
const serverOrigin = new URL(lumisChat.serverUrl).origin;
if (event.origin !== serverOrigin) return;
```
Any message from untrusted origins is silently dropped.

### 4.2 Graceful Network Fallback (7-Second Heartbeat Guard)
If the Lumis cloud instance is unreachable, slow, or blocked by local firewalls:
1. An internal timer triggers `lumisChat.triggerFallback()` after 7 seconds of unacknowledged initialization.
2. A status banner alerts the user: *"⚠️ Koneksi Lumis cloud lambat."* with a *Retry* action.
3. The learner can instantly utilize FlashLearn's built-in native `SocraticTutorDrawer.svelte` (`AskSocraticTutorUseCase`), ensuring zero downtime in mission-critical environments.

### 4.3 Direct Draft Adoption Bridge
Learners can adopt arguments via:
1. Quick pill action: `📥 Terapkan ke Form Tugas` which synthesizes scenario cues and ethical boundaries.
2. Custom window event: `flashlearn:draft_adopted` automatically received and appended to `studentAnswerText` in `TaskExecutionForm.svelte`.

---

## 5. Verification Gauntlet
- **SRP Audit:** `LumisChatAssistant.svelte` ($\le 260$ lines) and `lumisChat.svelte.ts` ($\le 140$ lines) strictly satisfy the monorepo SRP budget.
- **Hermetic Testing:** Verified through `apps/api/tests/phase06.test.ts`, `phase11.test.ts`, and full Vite production builds.
- **Multi-Tenant Agnosticism:** Completely decoupled from hardcoded domain concepts; works identically for procurement, aerospace, medical, or financial regulations.
