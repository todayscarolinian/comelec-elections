# Live Voting: Product Spec

| | |
|---|---|
| **Status** | Draft for team review |
| **Last updated** | 2026-11-08 |
| **Election day** | 2026-11-20, 8 AM–5 PM (may be extended) |
| **Related** | [Software Design Document](./software-design.md) · [Glossary](./GLOSSARY.md) · [ADR 0002: Ballots Linked to Voters](./adr/0002-ballots-linked-to-voters.md) · [Meeting notes](./meeting-discussions.md) |

## 1. Summary

A web app for running one Election for members of the `example.com` organization, replacing Google Forms. Before election day, people register by uploading their Study Load and declaring their Year Level, and an Admin approves or rejects each Registration. On election day, each approved Voter signs in with their organization Google account and casts one Ballot. Anyone can follow the public Turnout count. Admins can audit every Ballot with the Voter's name and release the Results in the app.

## 2. Problem and goals

With Google Forms, the Audit Commissioner checks every response by hand in Google Sheets after voting closes (one vote per person and a valid study load). This takes 3–4 days, invites human error, and gives little protection against tampering.

The new system must be:

1. **Restricted** to people with an `@example.com` Google Workspace account whose Registration was approved.
2. **One person, one Ballot**. Nobody can vote twice.
3. **Validated before voting**. Eligibility is checked during the Registration Period, so election day carries no validation work and Results can be released right after voting closes.
4. **Auditable**. Admins can see each Ballot with the name of the Voter who cast it.
5. **Transparent on Turnout only**. Anyone can watch how many Ballots have been cast, but per-Candidate counts stay hidden until Admins release the Results.

### Non-goals

- Running more than one Election, or creating Elections in the app. The Questions and Candidates are fixed before launch.
- Changing or withdrawing a Ballot after it is cast.
- Ranked-choice or weighted voting.
- Paper or any other voting channel. This system is the only way to vote.
- Automatically verifying a Study Load or Year Level. Admins check them by eye. (Partly superseded by ADR 0006, proposed: OCR assists Admins, who still decide.)
- Questions shown only to some Voters. Every Voter sees the same Ballot.
- Secrecy of Ballots from Admins (see ADR 0002).

## 3. Users and roles

| Role | Who | Can |
|---|---|---|
| **Visitor** | Anyone with the link, not signed in | View Candidate profiles and Turnout, and Results once released |
| **Applicant** | Signed in with a verified `@example.com` Workspace account; Registration not yet approved | Everything a Visitor can do, plus submit or resubmit a Registration during the Registration Period and see its status |
| **Voter** | An Applicant whose Registration was approved | Everything a Visitor can do, plus cast one Ballot while the Election is open |
| **Admin** | A Voter granted the Admin role (Audit Commissioner, Chair, COMELEC at-large) | Everything a Voter can do, plus review Registrations, open and close the Election, view all Ballots and Results, release Results, and grant or revoke Admin |

All Admins have the same permissions for now.

## 4. Key concepts

The full definitions live in the [Glossary](./GLOSSARY.md). In brief:

- **Election**: the single voting event. It is either *open* or *closed*.
- **Question**: one item on the Ballot, such as "President."
- **Candidate**: a person who can be picked on a Question. Each has a name, photo, short bio/platform and, optionally, a Party.
- **Party**: a political party Candidates run under (currently STAND, Tingog and SPP). A Candidate with no Party is **Independent**.
- **Selection Limit**: the maximum number of Candidates a Voter can pick on a Question.
- **Registration**: a request to become a Voter, carrying a Study Load and Year Level. It is *pending*, *approved* or *rejected*.
- **Study Load**: a screenshot of the person's current enrollment.
- **Year Level**: the year a person declares they are in. Recorded for information only; every Voter sees the same Questions.
- **Abstention**: an explicit "I choose no one" on a Question.
- **Ballot**: a Voter's complete, final set of answers, recorded under their name.
- **Turnout**: the public count of Ballots cast.
- **Results**: per-Candidate counts, visible only to Admins until released.

## 5. User stories and requirements

### 5.1 Signing in

- **US-1**: As a member of the organization, I sign in with my `@example.com` Google account.
  - FR-1.1: Sign-in uses Google only. There are no passwords and no other providers.
  - FR-1.2: Only verified Google Workspace accounts on the `example.com` domain are accepted. Personal Google accounts that happen to use an `@example.com` address are rejected.
  - FR-1.3: Rejected sign-ins see a clear message: "Only @example.com organization accounts can sign in."
  - FR-1.4: The system stores the person's email and name from their Google account, so Admins can identify Registrations and Ballots.

### 5.2 Registering

- **US-2**: As an Applicant, I register during the Registration Period so I can vote on election day.
  - FR-2.1: The Registration Period opens on **2026-11-15** and closes before the Election opens (see §10).
  - FR-2.2: A Registration requires a Year Level, picked from a fixed list, and a Study Load image upload. The Year Level is for information only and doesn't affect the Ballot.
  - FR-2.3: The Applicant can see their Registration status: pending, approved or rejected.
  - FR-2.4: A rejected Registration shows the reason the Admin gave. The Applicant can fix it and resubmit while the Registration Period is open.
  - FR-2.5: An approved Registration can't be changed by the Voter.
  - FR-2.6: Outside the Registration Period, no Registrations can be submitted or resubmitted.

- **US-3**: As an Admin, I review Registrations.
  - FR-3.1: Admins see a list of Registrations, filterable by status and Year Level, showing name, email, Year Level and the Study Load image.
  - FR-3.2: An Admin approves a Registration, or rejects it with a required reason.
  - FR-3.3: An Admin can correct an Applicant's Year Level before approving.
  - FR-3.4: Every decision records which Admin made it and when.

### 5.3 Viewing the Election

- **US-4**: As anyone, I can see every Question and each Candidate's profile.
  - FR-4.1: Candidates appear in a fixed order (the order in the Election configuration), the same for everyone.
  - FR-4.3: Each Candidate's profile shows their Party, or "Independent" if they have none.
  - FR-4.2: The page shows whether the Election is open or closed.

### 5.4 Casting a Ballot

- **US-5**: As a Voter, I fill in my Ballot and submit it once.
  - FR-5.1: The Ballot shows every Question, the same for every Voter. Each Candidate is shown with their Party or "Independent".
  - FR-5.2: On each Question, a Voter picks between 1 and the Selection Limit of Candidates, **or** marks an Abstention. They can't do both.
  - FR-5.3: The Voter can't submit until every Question shown is answered or abstained.
  - FR-5.4: Before voting, the Voter sees the disclosure in §7 and must acknowledge it.
  - FR-5.5: Before submitting, the Voter reviews a summary of their choices and confirms: "Your Ballot is final and cannot be changed."
  - FR-5.6: After submitting, the Voter sees "Thank you, your Ballot has been cast."
  - FR-5.7: A Voter who has already voted sees "You have already voted" instead of the Ballot. This holds after the Election is closed and reopened.
  - FR-5.8: Ballots can only be cast while the Election is open. Applicants and people with no Registration can't vote and are told why.
  - FR-5.9: If a Voter submits twice in quick succession (double click, two tabs), exactly one Ballot is recorded.

### 5.5 Turnout and Results

- **US-6**: As anyone, I can watch Turnout while voting is open.
  - FR-6.1: Turnout is public. No sign-in is needed.
  - FR-6.2: It shows the number of Ballots cast, and the number of approved Voters for context.
  - FR-6.3: It never shows per-Candidate counts.

- **US-7**: As an Admin, I audit Ballots and release the Results.
  - FR-7.1: Admins can see the Results (picks per Candidate, per Question, and Abstentions) at any time.
  - FR-7.2: Admins can list every Ballot with the Voter's name, email and Year Level, and export the list.
  - FR-7.3: Every time an Admin views or exports Ballots, the system records which Admin did it and when.
  - FR-7.4: An Admin can release the Results only after the Election is closed. Released Results become public.
  - FR-7.5: Releasing can't be undone.

### 5.6 Administration

- **US-8**: As an Admin, I open and close the Election.
  - FR-8.1: The Election starts **closed**.
  - FR-8.2: An Admin can open a closed Election and close an open one, including reopening it (for example, to extend past 5 PM).
  - FR-8.3: Reopening doesn't reset anything. Ballots already cast remain, and Voters who already voted still can't vote again.
  - FR-8.4: The Election can't be reopened once Results are released.
- **US-9**: As an Admin, I can grant or revoke Admin for other people by entering their email.
  - FR-9.1: Admin can be granted to any `@example.com` email, whether or not that person has signed in yet.
  - FR-9.2: The last remaining Admin can't be revoked. Revoking takes effect immediately.
  - FR-9.3: The first Admin is set up by the engineering team at deploy time.

## 6. Key flows

**Registering (Nov 15 onwards)**

1. Applicant opens the link → signs in with Google → "Register to vote."
2. Picks their Year Level and uploads their Study Load → submits.
3. Admin reviews it → approves, or rejects with a reason.
4. If rejected, the Applicant fixes it and resubmits.

**Voting (Nov 20)**

1. Voter signs in → acknowledges the disclosure → fills in each Question shown to them → "Review Ballot."
2. Reviews the summary → "Cast my Ballot" (final).
3. Sees the confirmation. The Ballot screen is replaced by "You have already voted."

**Running the Election (Admin)**

1. Engineering deploys with the Election closed and seeds the first Admin, who grants Admin to the rest of the commission.
2. Admins review Registrations during the Registration Period.
3. At 8 AM on Nov 20, an Admin opens the Election. Turnout is public throughout.
4. At 5 PM, or later if extended, an Admin closes the Election.
5. Admins audit the Ballots and Results, then release the Results.

## 7. Ballot visibility disclosure

Shown to every Voter before they vote (FR-5.4). Draft wording:

> **Your Ballot is not anonymous to the election commission.** Your choices are recorded under your name and can be viewed by the commission (Audit Commissioner, Chair and COMELEC at-large) to audit the election. They are not shown to Candidates or other Voters. Every time the commission views Ballots, it is logged.
>
> ☐ I understand that my Ballot can be viewed by the election commission.

## 8. Known limitations and accepted risks

| Risk | Status |
|---|---|
| Admins can see how any Voter voted, including each other | Accepted by the client (ADR 0002). Mitigated by the disclosure in §7 and logging of Ballot access |
| A Voter declares the wrong Year Level | Low impact, since Year Level is information only. Admins can correct it against the Study Load before approval (FR-3.3) |
| A Study Load screenshot can be edited or faked | Accepted; same as the current process. Admins review by eye |
| The developer has database access to Ballots | Accepted under a waiver drafted by the client |
| A sign-in session stays valid for up to 8 hours and can't be ended remotely | Accepted; it can only ever cast that one person's single Ballot, and Admin revocation still applies immediately |
| If a Workspace account's email address changes, the system treats it as a new person | Accepted; rare during a single Election |

## 9. Acceptance criteria

- [ ] A non-`example.com` Google account, or a consumer account using an `@example.com` address, can't sign in.
- [ ] Registrations can only be submitted during the Registration Period, and require a Year Level and a Study Load image.
- [ ] A rejected Applicant sees the reason and can resubmit during the Registration Period.
- [ ] Only approved Voters can cast a Ballot.
- [ ] Every Voter sees the same Questions; a Ballot with an unknown Question or Candidate is rejected.
- [ ] Each Candidate is shown with their Party, or "Independent" if they have none.
- [ ] A Voter can't cast a second Ballot, including with simultaneous submissions and after close and reopen.
- [ ] A Ballot with an unanswered Question, too many picks, or picks plus Abstention on the same Question is rejected.
- [ ] Ballots can't be cast while the Election is closed, or without acknowledging the disclosure.
- [ ] Turnout is visible without sign-in and never shows per-Candidate counts.
- [ ] Results are visible only to Admins until released; release is only possible after close and can't be undone.
- [ ] Only Admins can view Ballots, and every view or export is logged with the Admin and time.
- [ ] The last Admin can't be revoked; the Election starts closed.

## 10. Open items for the client

- When does the Registration Period close? Admins need time to review before Nov 20.
- The list of Year Levels (1st–4th only, or also 5th year or others). Information only; there are no batch rep Questions.
- Final list of Questions, Selection Limits and Candidate profiles (name, photo, bio, Party). Candidate profiles are due from the client.
- The organization's Google Workspace domain, to replace `example.com`.
- Who will be the first Admin.
- Approval of the disclosure wording in §7.
- The developer database access waiver.
