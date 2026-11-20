# The Election definition is hardcoded in the repo, not stored in the database

There is exactly one Election, and its Parties, Questions and Candidates are fixed before voting opens, so they live in a typed config file (`src/election.ts`) rather than in database tables with an Admin editing UI. This removes a whole class of screens and permissions from an 18-day build, and makes the ballot reviewable in a pull request. Ballots store Question and Candidate ids from that file.

## Considered Options

- **Questions and Candidates in the database with an Admin editor**: rejected. It adds CRUD screens, validation and edit-while-open rules for something that changes once, before launch.

## Consequences

- **Question and Candidate ids must never be renamed or removed after the Election first opens**, or existing Ballots point at nothing. A test guards the config's invariants, not its history, so this rule relies on review.
- Changing a Candidate's profile or adding a late Candidate needs a code change and a deploy.
- Running a second Election means a migration to add an election id to Ballots and Registrations.
