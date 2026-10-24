# User Story US-10: Background Worker Daemon & Health Polling Pipeline
**Phase 10 | Autonomous Asynchronous Maintenance**

## 1. Story Statement
> **AS A** Platform DevOps Engineer or Reliability Engineer  
> **I WANT TO** run a background worker daemon that processes asynchronous retests, checks workspace health, and monitors source staleness  
> **SO THAT** the operational ledger stays clean, scheduled maintenance executes reliably, and intervals do not leak memory across server restarts.

## 2. Acceptance Criteria (Gherkin Format)
```gherkin
Feature: Background Worker Daemon and Pipeline
  Scenario: Graceful daemon execution and single cycle check
    Given a configured background worker daemon in `apps/api/src/worker.ts`
    When the daemon starts with polling interval = 100ms
    Then it processes active workspaces and sources cleanly without throwing errors
    And stops gracefully on SIGINT without leaking background intervals
```
