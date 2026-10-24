# User Story US-01: Corpus of Record & Deterministic Citations
**Phase 1 | Verbatim Statutory Grounding & Anti-Hallucination**

## 1. Story Statement
> **AS A** Legal & Compliance Administrator  
> **I WANT TO** ingest statutory and SOP documents into addressable chunks with immutable SHA256 hashes  
> **SO THAT** every learning objective, task requirement, and AI evaluation is strictly anchored to verbatim legal text with zero tolerance for hallucinations.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Corpus of Record Ingestion and Citation Verification
  Scenario: Ingest legal regulation and chunk deterministically
    Given a raw legal text containing statutory sections (Pasal, BAB)
    When `IngestSourceUseCase` is executed
    Then the system creates addressable chunks with unique locationTags and SHA256 hashes
    And rejects any quote that does not match the verbatim text exactly
```
