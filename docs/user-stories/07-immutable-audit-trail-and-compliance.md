# User Story US-07: Immutable Audit Trail & Regulatory Compliance Export
**Phase 7 | Cryptographic Audit Ledger (D8) & ZIP Export**

## 1. Story Statement
> **AS A** State Inspector or External Regulatory Auditor  
> **I WANT TO** export an immutable, tamper-evident audit bundle containing every learner attempt, oracle evaluation, and expert sign-off  
> **SO THAT** compliance with national certification standards can be independently verified with cryptographic SHA256 integrity.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Immutable Audit Trail and Compliance Export
  Scenario: Exporting verifiable audit bundle
    Given a series of learner attempts and oracle evaluations in a workspace
    When `ExportAuditBundleUseCase` is executed
    Then the system generates a tamper-evident compliance bundle
    And computes an authentic SHA256 checksum across all audit events
```
