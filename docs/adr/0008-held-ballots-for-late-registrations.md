---
status: accepted
amends: ADR-0002
---

# People who aren't approved yet can vote on election day, but their Ballot is held until their Registration is approved

ADR 0002 moved eligibility checks before the Election, so only approved Voters could vote. That shuts out anyone who missed the short Registration Period (Nov 15–18), or whose Registration was still pending or rejected on Nov 20. Instead, while the Election is open, anyone signed in with a university account can submit a Registration, or fix a rejected one, and cast a Ballot straight away. A Ballot whose Registration isn't approved is a **Held Ballot**: it is recorded but left out of the Results. It counts as soon as an Admin approves the Registration, even after the Election has closed. Registrations can't be submitted or resubmitted once the Election is closed, so a Registration that is rejected at close stays rejected, and its Ballot never counts.

## Considered Options

- **Only approved Voters can vote (ADR 0002 as written)**: rejected by the team. People who missed the four-day Registration Period would lose their vote.
- **Held Ballots with no resubmission deadline**: rejected. Rejected Applicants could keep fixing their Registration after the Election, so the Results could never be final.
- **Count every Ballot, and audit eligibility after voting, as with Google Forms**: rejected for the same reason as in ADR 0002. It brings back the manual recount.

## Consequences

- Eligibility is mostly, not entirely, checked before voting. Results can't be released while any Held Ballot's Registration is still pending, so a late rush can delay the release.
- Whether a Ballot counts is derived from the current `Registration.status`, not stored on the Ballot. Results, the Ballot audit and the export all join on it.
- A Held Ballot can't be changed or cast again. Fixing the Registration changes only the Registration.
- Someone with a Held Ballot must acknowledge, before voting, that it counts only if their Registration is approved. The acknowledgement is stored on the Ballot, which needs a migration that a developer runs manually.
- Admins review late Registrations on election day and after close. Registrations with a Held Ballot go to the top of the review queue.
- Ballots from people who turn out to be ineligible are still stored under their name. They are never counted, but they are visible in the audit.
- The Product Spec (§2, §3, §5, §6, §7, §8, §9) and the Software Design (§3–§7, §9, §12) are updated to match.
