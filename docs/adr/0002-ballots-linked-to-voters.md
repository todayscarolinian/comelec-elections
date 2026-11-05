---
status: accepted
supersedes: ADR-0001
---

# Ballots are stored under the Voter's name and are auditable by Admins

The client's election commission (Audit Commissioner, Chair and COMELEC at-large) must be able to inspect each individual Ballot alongside the person who cast it, as they did with Google Forms and email collection. This replaces the unlinkable design in ADR 0001: each Ballot row references its Voter, and Admins can view any Ballot with the Voter's name. Eligibility is checked before the Election through Registration rather than by auditing Ballots afterwards, so election day carries no validation work.

## Considered Options

- **Keep unlinkable Ballots (ADR 0001) and audit Registrations only**: rejected by the client, who requires per-Ballot audit with names.
- **Validate eligibility after voting, as with Google Forms**: rejected. It keeps the 3–4 day manual recount the client named as their main bottleneck.

## Consequences

- Ballots are not secret from Admins, and Admins are Voters, so commission members can see each other's Ballots. Voters must be told this before they vote.
- Ballot contents and Voter identities are sensitive together: access to Ballots is limited to Admins, and every Admin view of Ballots should be audit-logged.
- Developer database access requires the waiver the client is drafting.
- Ballots remain final and one per Voter; being linked does not make them editable.
