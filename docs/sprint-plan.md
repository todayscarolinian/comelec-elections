# Live Voting: Sprint Plan

| | |
|---|---|
| **Status** | Draft for team review |
| **Last updated** | 2026-11-06 |
| **Key dates** | Registration opens **Nov 15** (Sunday) · Election **Nov 20** (Friday), 8 AM–5 PM |
| **Related** | [Product Spec](./product-spec.md) · [Software Design](./software-design.md) · [Glossary](./GLOSSARY.md) · [ADRs](./adr/) · [Code Owners](./code-owners.md) |

Four short sprints. After the foundation, Registration and Voting are built **in parallel** by different owners, so Registration is live on Nov 15 and voting is rehearsed before Nov 20. FR numbers refer to the [Product Spec](./product-spec.md); § numbers refer to the [Software Design](./software-design.md).

## Timeline

| Sprint | Dates | Goal | Hard deadline |
|---|---|---|---|
| 1. Foundation | Nov 4–7 | People can sign in; schema and Study Load upload in place | — |
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
| First Admin's email | Nov 8 | Sprint 2 first Admin setup (2.1) |
| List of Year Levels (information only; there are no batch reps) | Nov 10 | Sprint 2 registration form |
| ~~Agreement on where Student Profiles are processed for OCR~~ Not needed: OCR runs on our server (ADR 0006) | — | — |
| Whether the Student Profile is enough proof of current enrollment (ADR 0006) | Nov 12 | Sprint 2 registration form |
| Registration Period closing date | Nov 12 | Registration announcement |
| Disclosure wording approval (Product Spec §7) | Nov 12 | Sprint 3 Ballot screen |
| Final Questions, Selection Limits and Candidate profiles (including Party) | **Nov 13** | Sprint 3 Election config |
| Developer database access waiver | Before production data exists (Nov 15) | Developer access to production |
| Data retention decision (Student Profiles, Ballots) | Nov 19 | Post-election cleanup |
| Expected number of Voters | Nov 14 | Sprint 4 load check |

---

## Sprint 1: Foundation (Nov 4–7)

**Goal:** an university member can sign in, the database is ready for Registrations, and Study Loads can be uploaded.

| # | Task | Depends on | Size | Ref |
|---|---|---|---|---|
| S1-01 | **Scaffolding, platform and schema.** Initial commit (Next 16.4.5, App Router, TypeScript, Tailwind) — done. Also:<br>• **Conventions:** `src/` layout vs root `app/`; npm vs pnpm; test runner (Vitest suggested); pin the Auth.js v5 and tRPC v11 versions, and **confirm tRPC works with Next 16.4.5 first** (fallback in ADR 0007)<br>• **tRPC setup (ADR 0007):** `src/server/trpc/init.ts` (context, `publicProcedure`), `root.ts`, `server.ts` caller, `/api/trpc/[trpc]` route handler with the `Origin` check on mutations, React Query provider<br>• **CI:** lint, typecheck and tests on every PR; 1 reviewer, 2 for auth and guards<br>• **Platform:** Prisma, Supabase client, Supabase and Vercel projects with staging and prod environments, `.env.example`<br>• **Study Load bucket:** private `study-loads`, jpeg/png/webp, max 5 MB; anonymous read returns 403<br>• **Schema:** all tables (§3), RLS on every table with no policies, `ElectionState('main')` seed row. **A developer runs the migration manually on staging.** | — | L | §1, §3, §5.1, §10 |
| S1-02 | **Google sign-in with tests.** Auth.js; `signIn` checks `hd` and `email_verified`; FR-1.3 rejection page. Unit tests: missing or foreign `hd`, `email_verified=false`, email normalisation, session shape | S1-01 (conventions) | M | FR-1.1–1.3, §4.1, §12 |
| S1-03 | **Create the Person on sign-in and keep the session small.** `upsertPerson`; session and JWT carry only `personId` and `email` (module augmentation, no casts); Google tokens are never stored | S1-01, S1-02 | S | FR-1.4, §4.2, ADR 0004 |
| S1-04 | **Procedure guards.** `protectedProcedure`, `voterProcedure`, `adminProcedure` middleware in `trpc/init.ts`; Registration status and Admin rights read from the database on every call. Permission tests via `createCaller` | S1-03 | S | §4.3, §12, ADR 0007 |
| S1-05 | **Election config.** `src/election.ts` with placeholder Questions and Candidates; no `YEAR_LEVELS` and no Year-Level Questions (no batch reps). Tests for unique ids, `1 ≤ selectionLimit ≤ number of Candidates`, and photos existing | S1-01 (conventions) | S | §2, ADR 0003 |
| S1-06 | **UI design for the landing and auth pages.** Landing page (Election overview, Turnout placeholder, sign-in button), sign-in page, "university accounts only" rejection page, signed-in header with sign-out. Mobile-first | — | S | US-1, US-4 |
| S1-07 | **`AuditLog` write helper.** `writeAudit({ adminEmail, action, target, detail })` in `trpc/api/v1/audit/services/` and a typed list of actions. Append-only: no update or delete path | S1-01 | XS | §3, ADR 0002 |
| S1-08 | **Study Load upload.** `registration.createStudyLoadUpload` tRPC procedure (`protectedProcedure`, Registration Period open, signed URL for `{personId}/{uuid}` valid 5 minutes) and a browser upload component that checks type and size. Leave room for the post-upload OCR step (S1-09) | S1-01, S1-04 | M | §5.1 |
| S1-09 | **OCR spike (timeboxed to 1 day).** Run 5–10 real sample Study Loads through the OCR options in ADR 0006 (browser tesseract.js, server-side tesseract, server-side PaddleOCR via ONNX, a cloud API, a vision-capable LLM) and measure how reliably each extracts the fields Admins check. Output: ADR 0006 with a recommendation; no production code. **Result:** Applicants upload a Student Profile instead of a Study Load, read by server-side PaddleOCR (ADR 0006 accepted) | — | S | — |

**Critical path:** S1-01 → S1-02 → S1-03 → S1-04 → S1-08. S1-05, S1-06, S1-07 and S1-09 can run in parallel. Settle S1-01's conventions first so S1-02 and S1-05 aren't blocked by the rest of it.

**Not in Sprint 1:** the `seed-admin` script is skipped, so the first Admin is set up in Sprint 2 (2.1).

**Done when:** a Workspace test account signs in and a consumer account is rejected; the migration has been run on staging; a signed-in test account can upload a Study Load on staging; the OCR spike has a recommendation.

## Sprint 2: Registration (Nov 8–14)

**Goal:** Registration is live in production on Nov 15.

| # | Task | Ref |
|---|---|---|
| 2.1 | Set up the first Admin on staging (the seed script is skipped; method to be decided by Nov 8). Blocks 2.4–2.6 | FR-9.3 |
| 2.2 | `submitRegistration` (create, resubmit after rejection, block when approved or window closed) | FR-2.1–2.6, §5.2 |
| 2.3 | Register page: design and build; Student Profile upload (from S1-08, renamed in 2.11), status (pending/approved/rejected with reason). Year Level picker (information only) | US-2 |
| 2.4 | Admin review queue: design and build; filters, Student Profile preview via signed URL, OCR results if available (2.10b), approve (with optional Year Level correction), reject with reason | FR-3.1–3.4, §5.3 |
| 2.5 | Registration window open/close toggle | §8.1 |
| 2.6 | Admin grant/revoke with last-Admin guard; Admin list | US-9, §8.2 |
| 2.7 | Call `writeAudit` (S1-07) in every Admin action | §3, ADR 0002 |
| 2.8 | Integration tests for Registration and review | §12 |
| 2.9 | Production deploy; production migration run manually; set up first Admin; Admin walkthrough with the commission | — |
| 2.10a | OCR feasibility on Vercel (infra), the go/no-go gate for 2.10b: bundle `onnxruntime-node` and the PP-OCRv6 models, keep the function under 250 MB, and measure cold start, time per image and memory on a preview. Output: go or no-go, plus `maxDuration`, memory and Next.js config. Can start now; no dependencies. **Result:** go (#28): 2–12 s per image, about 1.5 GB of 2 GB memory, about 100 MB function | ADR 0006, §5.4 |
| 2.10b | Wire OCR into Registration (#25): `ocrStatus` and `ocrResult` on Registration and their migration (run manually), `CURRENT_TERM`, OCR scheduled with `after()` from `submitRegistration` calling `readStudentProfile` from 2.14, `DONE`/`FAILED` writes that skip stale results, results in `listRegistrations`. **Advisory only** (Admin still decides). Can mock 2.14 until it lands. Cut first if Sprint 2 is at risk | ADR 0006, §5.4 |
| 2.11 | Rename Study Load to Student Profile in code: `student-profiles` bucket, `Registration.studentProfilePath` (migration run manually), `createStudentProfileUpload`, upload component and its copy. Do before 2.2–2.4 | ADR 0006, §5.1 |
| 2.14 | OCR engine setup (#43): `onnxruntime-node` and the PP-OCRv6 models, Next.js file tracing and `maxDuration = 300` for `/api/trpc`, the engine from the 2.10a test branch with one OCR job per instance at a time, and the field extraction and matching behind `readStudentProfile(image, expected)`. No database or tRPC changes. Cut first with 2.10b if Sprint 2 is at risk | ADR 0006, §5.4 |

**Done when:** on production, a test Applicant registers, gets rejected, resubmits and gets approved; production is deployed by Nov 14, and an Admin opens the Registration window on Nov 15.

## Sprint 3: Voting (Nov 8–16, parallel with Sprint 2)

**Goal:** an approved Voter can cast exactly one Ballot, and Turnout is public.

| # | Task | Ref |
|---|---|---|
| 3.1 | Load the real Election config and Candidate photos (from client, due Nov 13) | §2, ADR 0003 |
| 3.2 | `validateBallot` (same Questions for every Voter) and disclosure check, plus unit tests | §6.1 |
| 3.3 | `castBallot` transaction (window check, Registration check, one Ballot per Voter) | FR-5.1–5.12, §5.2, §6.2 |
| 3.4 | Held Ballots: `Ballot.heldAcknowledgedAt` migration (run manually), acknowledgement required in `castBallot`, `submitRegistration` also accepted while the Election is open | ADR 0008 |
| 3.5 | Election status queries: `election.get`, `ballot.myStatus` | US-4, US-5 |
| 3.6 | `admin.setElectionStatus`: open/close; block reopen after release | FR-8.1–8.4, §8.1 |
| 3.7 | `GET /api/turnout` (cached 15s) | US-6, §7.1, ADR 0005 |
| 3.8 | Integration tests, including **N concurrent casts → exactly one Ballot** | §12 |

**Done when:** on staging, `castBallot` records exactly one Ballot per Voter under concurrent attempts, Held Ballots are stored with their acknowledgement, the Election can be opened and closed, and `GET /api/turnout` returns the count.

## Sprint 4: Results and launch (Nov 17–19)

**Goal:** Voters can vote through the app, Admins can audit and release Results, and the system has been rehearsed end to end.

| # | Task | Ref |
|---|---|---|
| 4.1 | Public Election page with Candidate profiles (including Party or "Independent") and open/closed state | US-4 |
| 4.2 | Vote page: disclosure (plus Held Ballot acknowledgement), Ballot form with Party labels, review and confirm, already-voted, held and not-registered states; late Registration from the Vote page | US-5, Product Spec §7, ADR 0008 |
| 4.3 | Election open/close button on the Admin panel, disabled after release | FR-8.1–8.4, §8.1 |
| 4.4 | Public Turnout display, polling `GET /api/turnout` | US-6, §7.1 |
| 4.5 | Admin Results view (counts, Abstentions, Held Ballots left out), counting only approved Registrations, audit-logged | FR-7.1, §7.2, ADR 0008 |
| 4.6 | Release Results (closed only, no pending Held Ballots, one-way) and public Results page | FR-7.4–7.5, §7.2, ADR 0005, ADR 0008 |
| 4.7 | Ballot audit list and CSV export with Counted/Held status, audit-logged; audit log viewer | FR-7.2–7.3, §7.3 |
| 4.8 | Hardening: logging review (no Ballot payloads), RLS check via Supabase's public API, permission tests on every Admin action | §9 |
| 4.9 | Load sanity check at the expected Voter count | §14 |
| 4.10 | **Dry run with the commission (Nov 18 or 19):** open, vote with test accounts, close, audit, release, then reset staging | — |
| 4.11 | Production readiness: final config deployed, Election closed, Admins confirmed, Registration Period closed | — |

**Done when:** the dry run completes without developer intervention, and the commission signs off.

## Election day (Nov 20)

| Time | Action | Who |
|---|---|---|
| 7:30 AM | Check production: Election closed, Registrations reviewed, Turnout page loads | Dev + Admin |
| 8:00 AM | Open the Election | Admin |
| During | Watch Turnout, error logs and the database; respond to Voter issues; review late Registrations with a Held Ballot as they arrive | Dev on call + Admins |
| 5:00 PM | Close the Election, or extend by keeping it open. Closing also ends late Registration and resubmission | Admin |
| After close | Finish reviewing pending Registrations with a Held Ballot, audit Ballots and Results, then release | Admins |

## Post-election (Nov 21+)

- Release Results if not already done.
- Carry out the client's data retention decision for Student Profiles and Ballots.
- Revoke developer production access once the waiver period ends.
- Retrospective.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Candidate profiles arrive after Nov 13 | Sprint 3 slips | Build with placeholders; config swap is a small change (ADR 0003) |
| Sprint 2 slips past Nov 15 | Registration Period shrinks further | Sprint 2 scope is fixed; Admin grant/revoke UI can fall back to the seed script |
| Short Registration Period (Nov 15–18) | Eligible people miss registering, or the review queue isn't cleared by Nov 20 | Client announces Registration before Nov 15; close Nov 18 to leave Nov 19 for review; show the pending count on the Admin panel |
| Many late Registrations on election day (ADR 0008) | The review queue delays the release of Results | Held Ballots are sorted first in the queue; schedule Admins to review during voting, not only after close |
| Too few developers to run Sprints 2 and 3 in parallel | Voting slips into Sprint 4 | Prioritise Sprint 2 until Nov 14; move the public Results page (4.6) to post-election if needed |
| Election-day load spike at 8 AM | Slow or failed submissions | Cached Turnout, load check in Sprint 4 |
| Bug found during the dry run | Launch risk | Dry run on Nov 18 leaves a day to fix |
| tRPC v11 doesn't work cleanly with Next 16.4.5 | S1-01 slips; the API layer has to be reworked later | Check compatibility first in S1-01; if it fails, fall back to Server Actions with a typed wrapper, keeping the same folder structure (ADR 0007) |
| OCR is unreliable or slow on real Student Profiles, or too slow on Vercel | Sprint 2 slips | OCR is advisory and scoped separately; the Vercel go/no-go (2.10a) came back a go before any feature work (2.14, 2.10b). If either slips, launch with manual review only and add OCR later |
| No first Admin when Sprint 2 starts (seed script skipped) | Review queue, window toggle and grant/revoke can't be tested | Decide the setup method and get the first Admin's email by Nov 8 |
