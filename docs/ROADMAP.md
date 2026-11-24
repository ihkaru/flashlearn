# FlashLearn Master Roadmap

Dokumen ini adalah peta jalan terpadu FlashLearn yang dirujuk langsung dari [GEMINI.md](../GEMINI.md). Setiap fase memiliki dokumen spesifikasi implementasi rinci di `docs/phases/` atau `docs/roadmap/`.

---

## Status Fase Selesai (Foundation → Phase 20)

| Fase | Fokus Utama | Status | Dokumen Rinci |
| :--- | :--- | :---: | :--- |
| **Phase 01–10** | Core Hexagonal API, Competency Engine, Dual-Loop Cognitive Architecture, Backward Scaffolding, Causal Priming, & 4-Layer Bridging Pipeline | Selesai | [docs/roadmap/00_overview.md](roadmap/00_overview.md), [docs/roadmap-competency-engine.md](roadmap-competency-engine.md) |
| **Phase 11** | Adversarial Dilemma Stress-Testing | Selesai | [docs/phases/phase-11-adversarial-dilemma.md](phases/phase-11-adversarial-dilemma.md) |
| **Phase 12** | Adaptive Topological Placement (KST) | Selesai | [docs/phases/phase-12-adaptive-topological-placement.md](phases/phase-12-adaptive-topological-placement.md) |
| **Phase 13** | Double-Blind Multi-Rater Consensus | Selesai | [docs/phases/phase-13-double-blind-multi-rater-consensus.md](phases/phase-13-double-blind-multi-rater-consensus.md) |
| **Phase 14** | Predictive Competency Drift | Selesai | [docs/phases/phase-14-predictive-competency-drift.md](phases/phase-14-predictive-competency-drift.md) |
| **Phase 15** | Autonomous Domain Synthesizer | Selesai | [docs/phases/phase-15-autonomous-domain-synthesizer.md](phases/phase-15-autonomous-domain-synthesizer.md) |
| **Phase 16** | Cryptographic W3C Verifiable Credentials (Ed25519) | Selesai | [docs/phases/phase-16-cryptographic-verifiable-credentials.md](phases/phase-16-cryptographic-verifiable-credentials.md) |
| **Phase 17** | Grounded Socratic AI Chat & SSE Streaming | Selesai | [docs/phases/phase-17-lumis-agentic-chat-bridge.md](phases/phase-17-lumis-agentic-chat-bridge.md) |
| **Phase 18–20** | Sandboxed HTML Decks, Persistent Media Assets (`SHA-256`), Elastic `1..N` Guided Flow, Always-Accessible Figure Drawer, & 1-Click Full Markdown Copy | Selesai | [docs/architecture/09_architecture_decisions.md](architecture/09_architecture_decisions.md) (ADR-10..12) |

---

## Fase Aktif & Prioritas Berikutnya

| Fase | Fokus Utama | Status | Dokumen Implementasi Rinci |
| :--- | :--- | :---: | :--- |
| **Phase 21** | **Enterprise Security Hardening (November 2026 OWASP Compliance)** — Remediasi seluruh temuan audit source-first (4 Critical, 5 High, 7 Medium, 4 Low) & dependensi CVE (`osv-scanner`) di `apps/api`, `apps/web`, `packages/shared`, `packages/cli`, dan `Dockerfile`. | **Selesai** | [docs/phases/phase-21-security-hardening.md](phases/phase-21-security-hardening.md) |
| **Phase 22** | **Workspace UI De-duplication, Distinct Workspace Identity & Cognitive Learning Motion** — Menghapus redundansi UI workspace, menerapkan sistem identitas visual per-workspace (WCAG AA safe palette, tonal framing), serta mikro-animasi belajar 120Hz GPU-composited (`transform`/`opacity`, `prefers-reduced-motion`). | **Selesai** | [docs/phases/phase-22-workspace-identity-and-learning-motion.md](phases/phase-22-workspace-identity-and-learning-motion.md) |
| **Phase 23** | **CLI Quality & Sync Hardening** — Filter soft-delete di `flashlearn plan diff` (`DEBT-07`) dan gate deterministik `chapter-ledger.json` + `Key Point Recall >= 85%` bawaan di `packages/cli` (`DEBT-08`). | Planned | [docs/architecture/11_risks_and_technical_debt.md](architecture/11_risks_and_technical_debt.md) |

---

## Referensi Arsitektur
- **arc42 (12 Dokumen Modular)**: [docs/architecture/01_introduction_and_goals.md](architecture/01_introduction_and_goals.md)
- **Future Enhancements Backlog**: [docs/phases/roadmap-future-enhancements.md](phases/roadmap-future-enhancements.md)
