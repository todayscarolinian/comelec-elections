---
status: superseded by ADR-0002
---

# Ballots are stored with no link to the Voter

The client requires that nobody, including developers and database operators, can tell how a Voter voted. We record the fact that a Voter has voted (a Participation, keyed by an HMAC of their lowercased email with a server-held secret) and their Ballot as two separate rows written in the same transaction. The Ballot row has no voter reference, no timestamp, and a random ID. As a result Ballots cannot be changed or withdrawn after casting, and nobody can audit who voted for what.

## Considered Options

- **Hashed voter ID stored on the Ballot**: rejected. Anyone holding the secret, or a staff list if the hash is unkeyed, can re-link every Ballot to a person, so it is pseudonymous, not anonymous.
- **Changeable Ballots until the Election closes**: rejected. Finding a Voter's Ballot again requires exactly the link this design removes.

## Consequences

- The HMAC secret must never be rotated or lost while the Election can still be voted in, including after a close if it may be reopened, or Voters could cast a second Ballot.
- Application logs must never record Ballot contents or request bodies for casting.
- The Live Tally refreshes on an interval and stays hidden below a minimum Ballot count, so a person's vote can't be inferred by watching the tally change when they submit.
