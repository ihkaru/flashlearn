# User Story US-16: Cryptographic Verifiable Credentials & OpenBadges 3.0
**Phase 16 | Decentralized, Offline-Verifiable Digital Passports**
**Standard: October 2026 W3C Verifiable Credentials Data Model v2.0 & Ed25519**

---

## 1. Story Statement
> **AS A** Certified Practitioner or Hiring / Regulatory Verification Authority  
> **I WANT TO** export and mathematically verify digital competency passports as standard W3C Verifiable Credentials 2.0 with Ed25519 Data Integrity proofs  
> **SO THAT** external organizations and HRIS systems can instantly verify credential authenticity offline in under 1 millisecond without pinging or relying on FlashLearn's server uptime.

---

## 2. Acceptance Criteria (Gherkin Format)

```gherkin
Feature: Offline-Verifiable W3C VC 2.0 and OpenBadges 3.0

  Scenario: Issuing self-contained W3C VC 2.0 upon Gate 3 Capstone mastery
    Given a learner who has earned a verified Gate Level 3 Capstone grant
    And an active Competency Health Index R(t) >= 0.85
    When the export command `flashlearn gate issue-vc --gate-id <id> --user-id <userId>` is executed
    Then the system canonicalizes the achievement claim using RDFC-1.0
    And signs the SHA-256 digest with the workspace's private Ed25519 key
    And emits a valid W3C VC 2.0 / OpenBadges 3.0 JSON document with DataIntegrityProof

  Scenario: Offline tamper detection with zero network access
    Given an issued verifiable credential JSON document
    When any property (candidate name, gate criteria, or issuer) is modified by 1 bit
    And verified via `flashlearn gate verify-vc --file <tampered.json>`
    Then the cryptographic verification must fail immediately with "SIGNATURE_MISMATCH"

  Scenario: Competency drift blocks credential issuance
    Given a candidate whose Competency Health Index has dropped to R(t) < 0.85 (Drift Warning)
    When a request is made to issue a verifiable credential
    Then the system must block issuance with typed domain error "COMPETENCY_DRIFT_UNSTABLE"
```
