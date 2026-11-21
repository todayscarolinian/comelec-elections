---
status: accepted
---

# The API layer is tRPC, with authorization built into procedure types

Every read and write from the app goes through tRPC procedures, not Next.js Server Actions. The main reason is safety. The worst failure this app can have is an Admin operation, such as viewing Ballots or releasing Results, that someone forgot to guard. With tRPC, authorization is part of the procedure's type: an Admin operation is declared as an `adminProcedure`, so a missing guard shows up in review as the wrong procedure type, not as an absent line of code. tRPC also requires a zod input schema on every procedure, gives about nine developers one shared shape for every entity, and builds on React Query, which the design already uses for polling.

Code is organized per entity under `src/server/trpc/api/v1/{entity}/`:

- `core/`: shared domain logic with no I/O, unit tested (for example `validateBallot`)
- `core/queries/` and `core/mutations/`: one file per procedure, named after it (for example `core/queries/ping.ts`). Each file exports the built procedure, such as `publicProcedure.query(...)`, using the narrowest procedure type. It calls shared `core` logic and `services`.
- `services/`: database and Storage access through Prisma and Supabase
- `schema.ts`: zod input and output schemas
- `router.ts`: only maps procedure names to the procedures in `core/queries/` and `core/mutations/`
- `__tests__/`: unit tests for `core`, and integration tests that call procedures through `createCaller`

Auth.js config lives in `src/server/auth/`, outside tRPC.

The public Turnout read stays a plain cached route handler (`GET /api/turnout`), not a tRPC procedure. Every visitor polls it at once on election morning, so it has to be cached once and shared across all clients, and a plain route handler is the simplest way to guarantee that.

## Considered Options

- **Next.js Server Actions (the original design)**: rejected. They are built into the framework and need no setup, but each action is a public POST endpoint that must call its guard itself. Input validation is also manual, and they don't suit reads, so polling would still need React Query and a route handler.
- **Server Actions with a typed wrapper (`next-safe-action` or a small `adminAction(schema, handler)` helper)**: close in score. It gives guard middleware and validation without tRPC, but no React Query integration, and the pattern relies on convention rather than the router's structure.

## Consequences

- S1-01 gains the tRPC setup: `init.ts` (context and procedure types), `root.ts`, the `/api/trpc/[trpc]` route handler, and the React Query provider. That's about one extra day of work.
- **tRPC v11 and `@trpc/tanstack-react-query` must be confirmed to work with Next 16.4.5 early in S1-01**, and their versions pinned. If they don't work, fall back to Server Actions with a typed wrapper and keep the same folder structure.
- The guards become procedure types: `publicProcedure`, `protectedProcedure` (a valid session), `voterProcedure` (Registration `APPROVED`) and `adminProcedure` (a row in `Admin`). Registration status and Admin rights are still read from the database on every call, never from the cookie.
- **tRPC has no built-in CSRF origin check**, unlike Server Actions. The tRPC route handler must reject mutations whose `Origin` header doesn't match the app's URL. `SameSite=Lax` cookies and JSON request bodies add protection, but don't replace that check.
- Server Components call procedures through a server-side caller, not over HTTP.
- Student Profiles still upload by signed URL. A procedure returns the URL, and the browser uploads the file straight to Storage.
- tRPC error formatting and logging must never include `castBallot` inputs.
