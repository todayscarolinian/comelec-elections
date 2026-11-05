# Live Voting: Sprint Plan

| | |
|---|---|
| **Status** | Draft for team review |
| **Last updated** | 2026-11-04 |
| **Key dates** | Registration opens **Nov 15** (Sunday) · Election **Nov 20** (Friday), 8 AM–5 PM |
| **Related** | [Product Spec](./product-spec.md) · [Software Design](./software-design.md) · [Glossary](../GLOSSARY.md) · [ADRs](./adr/) |

Four short sprints. After the foundation, Registration and Voting are built **in parallel** by different owners, so Registration is live on Nov 15 and voting is rehearsed before Nov 20. FR numbers refer to the [Product Spec](./product-spec.md); § numbers refer to the [Software Design](./software-design.md).

## Timeline

| Sprint | Dates | Goal | Hard deadline |
|---|---|---|---|
| 1. Foundation | Nov 4–7 | People can sign in; schema and Admin seed in place | — |
| 2. Registration | Nov 8–14 | Applicants can register and Admins can review | **Nov 15: Registration opens** |
| 3. Voting (parallel with 2) | Nov 8–16 | Voters can cast Ballots; Turnout is public | — |
| 4. Results and launch | Nov 17–19 | Results, Ballot audit, hardening, dry run | **Nov 20: Election day** |
| Post-election | Nov 21+ | Results released, data retention handled | — |

> **Short Registration Period.** Opening on Nov 15 leaves about four days to register and review before Nov 20. Recommend closing Registration on **Nov 18, 11:59 PM**, so Admins have Nov 19 to clear the pending queue. Confirm with the client.

## Client dependencies

Blocking items we need from the client, and the latest date each can arrive without moving the plan.

| Item | Needed by | Blocks |
|---|---|---|
| Google Workspace domain | Nov 5 | Sprint 1 sign-in |
| First Admin's email | Nov 6 | Sprint 1 seed |
| List of Year Levels | Nov 10 | Sprint 2 registration form |
| Registration Period closing date | Nov 12 | Registration announcement |
| Disclosure wording approval (Product Spec §7) | Nov 12 | Sprint 3 Ballot screen |
| Final Questions, Year-Level Questions, Selection Limits and Candidate profiles | **Nov 13** | Sprint 3 Election config |
| Developer database access waiver | Before production data exists (Nov 15) | Developer access to production |
| Data retention decision (Study Loads, Ballots) | Nov 19 | Post-election cleanup |
| Expected number of Voters | Nov 14 | Sprint 4 load check |

---

## Sprint 1: Foundation (Nov 4–7)

**Goal:** an organization member can sign in, and the database is ready for Registrations.

| # | Task | Ref |
|---|---|---|
| 1.1 | Scaffold Next.js (App Router, TypeScript), Prisma, Supabase project, Vercel project and environments | §1, §10 |
| 1.2 | Google OAuth client; Auth.js with `hd` and `email_verified` enforcement; rejection page | FR-1.1–1.3, §4.1 |
| 1.3 | `Person` upsert on sign-in; session carries only `personId` and `email` | FR-1.4, §4.2, ADR 0004 |
| 1.4 | Prisma schema for all tables (§3) and the initial migration file, including RLS-on for every table and the `ElectionState` seed. **A developer runs the migration manually.** | §3 |
| 1.5 | `requireSession`, `requireVoter`, `requireAdmin` guards | §4.3 |
| 1.6 | `scripts/seed-admin.ts` with `--dry-run` | §8.3 |
| 1.7 | `src/election.ts` with `YEAR_LEVELS` and placeholder Questions; config invariant tests | §2, ADR 0003 |
| 1.8 | Private `study-loads` bucket with MIME and size limits | §5.1 |

**Done when:** a Workspace test account signs in and a consumer account is rejected; the migration has been run on staging; the first Admin is seeded on staging.

## Sprint 2: Registration (Nov 8–14)

**Goal:** Registration is live in production on Nov 15.

| # | Task | Ref |
|---|---|---|
| 2.1 | Study Load signed upload URL + browser upload with type/size checks | §5.1 |
| 2.2 | `submitRegistration` (create, resubmit after rejection, block when approved or window closed) | FR-2.1–2.6, §5.2 |
| 2.3 | Register page: Year Level picker, upload, status (pending/approved/rejected with reason) | US-2 |
| 2.4 | Admin review queue: filters, Study Load preview via signed URL, approve with Year Level correction, reject with reason | FR-3.1–3.4, §5.3 |
| 2.5 | Registration window open/close toggle | §8.1 |
| 2.6 | Admin grant/revoke with last-Admin guard; Admin list | US-9, §8.2 |
| 2.7 | `AuditLog` writes for every Admin action | §3, ADR 0002 |
| 2.8 | Integration tests for Registration and review | §12 |
| 2.9 | Production deploy; production migration run manually; seed first Admin; Admin walkthrough with the commission | — |

**Done when:** on production, a test Applicant registers, gets rejected, resubmits and gets approved; production is deployed by Nov 14, and an Admin opens the Registration window on Nov 15.

## Sprint 3: Voting (Nov 8–16, parallel with Sprint 2)

**Goal:** an approved Voter can cast exactly one Ballot, and Turnout is public.

| # | Task | Ref |
|---|---|---|
| 3.1 | Load the real Election config and Candidate photos (from client, due Nov 13) | §2, ADR 0003 |
| 3.2 | Public Election page with Candidate profiles and open/closed state | US-4 |
| 3.3 | `validateBallot` with Year-Level filtering and disclosure check, plus unit tests | §6.1 |
| 3.4 | `castBallot` transaction (window check, approval check, one Ballot per Voter) | FR-5.1–5.9, §6.2 |
| 3.5 | Vote page: disclosure, Ballot form, review and confirm, already-voted and not-approved states | US-5, Product Spec §7 |
| 3.6 | Election window open/close toggle; block reopen after release | FR-8.1–8.4, §8.1 |
| 3.7 | `GET /api/turnout` (cached 15s) and public Turnout display | US-6, §7.1, ADR 0005 |
| 3.8 | Integration tests, including **N concurrent casts → exactly one Ballot** | §12 |

**Done when:** on staging, Voters in two Year Levels each see only their own Year-Level Question, cast once, and are blocked on a second attempt; Turnout updates.

## Sprint 4: Results and launch (Nov 17–19)

**Goal:** Admins can audit and release Results, and the system has been rehearsed end to end.

| # | Task | Ref |
|---|---|---|
| 4.1 | Admin Results view (counts, Abstentions), audit-logged | FR-7.1, §7.2 |
| 4.2 | Release Results (closed only, one-way) and public Results page | FR-7.4–7.5, §7.2, ADR 0005 |
| 4.3 | Ballot audit list and CSV export, audit-logged; audit log viewer | FR-7.2–7.3, §7.3 |
| 4.4 | Hardening: logging review (no Ballot payloads), RLS check via Supabase's public API, permission tests on every Admin action | §9 |
| 4.5 | Load sanity check at the expected Voter count | §14 |
| 4.6 | **Dry run with the commission (Nov 18 or 19):** open, vote with test accounts, close, audit, release, then reset staging | — |
| 4.7 | Production readiness: final config deployed, Election closed, Admins confirmed, Registration Period closed | — |

**Done when:** the dry run completes without developer intervention, and the commission signs off.

## Election day (Nov 20)

| Time | Action | Who |
|---|---|---|
| 7:30 AM | Check production: Election closed, Registrations reviewed, Turnout page loads | Dev + Admin |
| 8:00 AM | Open the Election | Admin |
| During | Watch Turnout, error logs and the database; respond to Voter issues | Dev on call + Admins |
| 5:00 PM | Close the Election, or extend by keeping it open | Admin |
| After close | Audit Ballots and Results, then release | Admins |

## Post-election (Nov 21+)

- Release Results if not already done.
- Carry out the client's data retention decision for Study Loads and Ballots.
- Revoke developer production access once the waiver period ends.
- Retrospective.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Candidate profiles arrive after Nov 13 | Sprint 3 slips | Build with placeholders; config swap is a small change (ADR 0003) |
| Sprint 2 slips past Nov 15 | Registration Period shrinks further | Sprint 2 scope is fixed; Admin grant/revoke UI can fall back to the seed script |
| Short Registration Period (Nov 15–18) | Eligible people miss registering, or the review queue isn't cleared by Nov 20 | Client announces Registration before Nov 15; close Nov 18 to leave Nov 19 for review; show the pending count on the Admin panel |
| Too few developers to run Sprints 2 and 3 in parallel | Voting slips into Sprint 4 | Prioritise Sprint 2 until Nov 14; move the public Results page (4.2) to post-election if needed |
| Election-day load spike at 8 AM | Slow or failed submissions | Cached Turnout, load check in Sprint 4 |
| Bug found during the dry run | Launch risk | Dry run on Nov 18 leaves a day to fix |
