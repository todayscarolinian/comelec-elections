# Developer Kickoff: Meeting Guide

A script for the kickoff meeting with the development team. Read-ahead for developers: [Product Spec](./product-spec.md), [Software Design](./software-design.md), [Sprint Plan](./sprint-plan.md), [Glossary](../GLOSSARY.md), [ADRs](./adr/).

**Goal of the meeting:** everyone understands what we're building and why, agrees on the plan to Nov 20, and leaves with Sprint 1 tasks assigned.

## Agenda (60 min)

| Time | Topic |
|---|---|
| 5 min | 1. The project in one minute |
| 10 min | 2. What changed after the client meeting |
| 10 min | 3. Rules we can't break |
| 15 min | 4. Sprint plan walkthrough |
| 10 min | 5. Assignments and working agreements |
| 10 min | 6. Questions, risks and next steps |

---

## 1. The project in one minute

Say this:

> We're replacing the Google Form the election commission uses. Today, after voting closes, the Audit Commissioner checks every response by hand in Google Sheets, which takes 3–4 days. In our app, people register **before** election day by uploading their Study Load and declaring their Year Level. Admins approve them, and only approved Voters can vote on **Nov 20**. The public sees Turnout only; Admins audit every Ballot and release the Results in the app.

Two dates to repeat: **Registration opens Nov 15. Election is Nov 20, 8 AM–5 PM.**

## 2. What changed after the client meeting

If anyone read the earlier design, walk through these. Each is recorded in an ADR.

| Before | Now | Why |
|---|---|---|
| Anonymous, unlinkable Ballots (ADR 0001) | Ballots stored under the Voter's name; Admins can view them (ADR 0002) | The commission must audit individual Ballots with names |
| Any domain account could vote | Only people with an approved Registration | Eligibility (study load, year level) is checked before voting |
| Public live per-Candidate tally | Public Turnout only; Results released by Admins (ADR 0005) | Standings must not be revealed during voting |
| Same Ballot for everyone | Batch Rep is a Year-Level Question, shown only to that Year Level | Voters only pick their own batch rep |

Use the [Glossary](../GLOSSARY.md) terms in code and conversation: **Registration, Applicant, Voter, Ballot, Turnout, Results, Year-Level Question**. Not "user", "vote", "tally".

## 3. Rules we can't break

Go through each one and check everyone agrees.

1. **One Ballot per Voter is enforced by the database**, not the UI (`Ballot.personId @unique`, inside the transaction).
2. **Every Admin action checks the database** with `requireAdmin()`. Never trust the cookie or hide a button as the guard.
3. **No public route returns per-Candidate counts** until Results are released.
4. **Never log Ballot contents** or `castBallot` inputs.
5. **Every Admin view or export of Ballots writes to `AuditLog`**, and the app never edits or deletes audit rows.
6. **Never rename or remove a Question or Candidate id** after the Election opens (ADR 0003).
7. **Migrations are written in code but run manually by a developer.** Never auto-run on deploy.
8. **Study Loads are personal documents.** Private bucket, short-lived signed URLs, never shared outside the Admin screens.
9. **Production database access requires the client's waiver.**

## 4. Sprint plan walkthrough

Open the [Sprint Plan](./sprint-plan.md) and go sprint by sprint.

| Sprint | Dates | Say |
|---|---|---|
| 1. Foundation | Nov 4–7 | "Sign-in, schema, seed. Everything else builds on this." |
| 2. Registration | Nov 8–14 | "**This is the hard deadline.** Registration must be live in production on Nov 15." |
| 3. Voting | Nov 8–16 | "Built in parallel with Registration by different owners. The core: Ballot, Year-Level filtering, one-Ballot guarantee, Turnout." |
| 4. Results and launch | Nov 17–19 | "Results, audit, hardening, and a dry run with the commission." |

Points to stress:
- Sprint 2 scope is fixed. If it's at risk, we cut polish, not the date.
- Candidate profiles arrive from the client by Nov 13. Build Sprint 3 with placeholders.
- The dry run on Nov 18 is not optional. It leaves one day to fix anything it finds.

## 5. Assignments and working agreements

### Suggested ownership

Fill in during the meeting. Splitting along these lines keeps people from blocking each other.

| Area | Covers | Owner |
|---|---|---|
| Auth and platform | Next.js/Vercel/Supabase setup, Auth.js, guards, env vars, deploys | |
| Data and migrations | Prisma schema, migrations, RLS, seed script | |
| Registration | Upload, submit, register page, Admin review queue | |
| Voting | Election config, `validateBallot`, `castBallot`, vote page, Turnout | |
| Admin, Results and audit | Windows, grant/revoke, Results, release, Ballot audit, AuditLog | |
| QA and dry run | Integration tests, concurrency test, load check, dry-run script | |

### Agree on

- **Daily check-in:** time and channel (15 minutes; what's done, what's next, what's blocked).
- **Branching and reviews:** one PR per task; at least one reviewer; anything touching `castBallot`, guards, Results or AuditLog gets a second reviewer.
- **Environments:** staging for testing; production deploys only by the platform owner.
- **Definition of done:** merged, tested (unit or integration as in Software Design §12), deployed to staging, and matches the spec's FR.
- **Where questions go:** client questions come to me, not directly to the client.
- **Election day:** who is on call from 7:30 AM to after close.

## 6. Questions to ask the developers

- Does anyone see anything in the Software Design that won't work, or that will take much longer than the sprint allows?
- Has anyone used Auth.js v5, Supabase Storage signed uploads, or Prisma with Supabase before? Who can help the others?
- Any concerns about the Nov 15 deadline? What would you cut first?
- Do we have enough people to run Registration and Voting in parallel from Nov 8?
- What's everyone's availability between now and Nov 20, especially Nov 14–15 (a weekend) and Nov 18–20?
- Who can be on call on election day?
- Is there anything you need from me or the client to start Sprint 1 today?

## 7. Open items to share

Still waiting on the client (see the Sprint Plan for dates):
- Google Workspace domain (**needed by Nov 5**)
- First Admin's email (**Nov 6**)
- List of Year Levels (**Nov 10**)
- Registration Period closing date
- Final Questions and Candidate profiles (**Nov 13**)
- Disclosure wording approval
- Database access waiver
- Data retention decision

Open technical questions (Software Design §14):
- Vercel caching for the Turnout route
- Auth.js v5 version pinning
- Expected number of Voters, for the load check

## 8. Wrap-up

Read back before ending:

> "By Nov 7: sign-in and schema done. By Nov 15: Registration live. Owners are ___. Our check-in is ___ at ___. I'll chase the client for the domain and first Admin today."

## Notes and action items

| Action | Owner | Due |
|---|---|---|
| | | |
| | | |

_Notes:_
