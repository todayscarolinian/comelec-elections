# Auth.js runs without a database adapter; people are stored in our own Person table

Sessions are encrypted JWT cookies and Auth.js's adapter tables (users, accounts, sessions, verification tokens) are not used. On first sign-in the `jwt` callback upserts a `Person` row with only the email and name we need for Registrations and Ballot audit, and the session carries just `personId` and `email`. This keeps the schema small and ours, and keeps Google tokens out of the database. Originally chosen to store no identity at all (ADR 0001); kept after ADR 0002 because the reasons other than anonymity still hold.

## Considered Options

- **Prisma adapter with database sessions**: rejected. It adds four tables we don't need, stores OAuth tokens, and makes every request hit the database for the session.

## Consequences

- Sessions can't be revoked server-side and last up to 8 hours. Registration status and Admin rights must therefore always be read from the database on each action, never trusted from the cookie.
- Anything else about a person we later need must be added to `Person` and the upsert, not read from an Auth.js table.
