# Voting Integration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement the steps below.

**Goal:** Verify voting and public turnout against migrated PostgreSQL in CI.

**Architecture:** Use a disposable loopback-only Postgres database and run a separate Vitest suite. Exercise real tRPC procedures and the public turnout handler with a real Prisma client.

**Tech Stack:** GitHub Actions, PostgreSQL 16, Prisma 7, Vitest.

**Spec:** [Testing strategy](../../software-design.md#12-testing-strategy) and [ADR 0008](../../adr/0008-held-ballots-for-late-registrations.md).

## Global Constraints

- Server-side only. Never use the production database or load its URL for tests or migrations.
- Run migrations from scratch in CI and run the integration suite on every workflow invocation.

## Review Focus

- Concurrent writes must persist exactly one complete ballot; all losers return `AlreadyVoted`.
- Closed voting and rejected acknowledgement must leave no ballot or answers.
- Held votes count toward turnout only until registration approval makes them count toward results.
- Public turnout exposes only aggregate fields, without a session.

### Task 1: PostgreSQL voting suite and CI

- [x] Add `tests/integration/voting.integration.ts` for the cast, window, eligibility, tally and turnout cases.
- [x] Add `tests/integration/database.ts` for a real client, reset hooks, and fixtures. `tests/integration/database-url.ts` supplies the same dedicated loopback URL to test and migration config.
- [x] Wire `npm run test:integration` through `prisma.integration.config.ts` and `vitest.integration.config.mts`; add a Postgres CI job in `.github/workflows/tests.yml`.
- [x] Run the integration suite on fresh Postgres, then run repository lint, typecheck and unit tests.

Ruling: issue #24 is open and no matching PR or harness is present; make the infrastructure reusable here without taking on the registration flow tests from #24.
