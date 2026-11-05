# Only Turnout is public while voting; Results stay hidden until Admins release them

Despite the project's name, there is no public live count of picks per Candidate. The client's commission does not want Candidates' standings revealed while voting is open, so the public sees only Turnout (Ballots cast against approved Voters), and per-Candidate Results become public only when an Admin releases them after the Election closes. Release is one-way, and once released the Election can't be reopened.

## Considered Options

- **Public per-Candidate Live Tally** (the original design): rejected by the client, since visible standings can sway late Voters.
- **Results announced outside the app**: rejected by the client, who wants to release them in the app.

## Consequences

- No public route may return per-Candidate counts until `resultsReleasedAt` is set. Anything added later (a widget, an API, a CSV) must respect this.
- Admins can see Results at any time, and each view is audit-logged.
