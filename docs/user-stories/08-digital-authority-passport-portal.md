# User Story US-08: Digital Authority Passport & Public Verification Portal
**Phase 8 | Tamper-Proof Credentials & Public Verification**

## 1. Story Statement
> **AS A** Certified Practitioner or Counterparty Verifier  
> **I WANT TO** present a digital authority passport with a unique public verification URL  
> **SO THAT** employers, government agencies, or partners can independently verify my active operational clearance in real time.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Digital Authority Passport and Verification Portal
  Scenario: Public passport verification
    Given an issued Gate Level 3 passport for a verified learner
    When an external visitor navigates to `/verify/:passportId`
    Then the portal displays authentic learner name, gate level, issuance date, and active status
    And displays a non-active warning if the passport has been suspended or revoked
```
