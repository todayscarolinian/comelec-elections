# Agent instructions: tRPC layer

Read `README.md` in this directory first. It covers the layout, the procedure types and the calling patterns. The source of truth is [ADR 0007](../../../docs/adr/0007-trpc-api-layer.md) together with Design §4.3 and §11 (`docs/software-design.md`).

## Must

- Add new procedures under `api/v1/{entity}/` with the split `core/` (with `queries/` and `mutations/`), `services/`, `schema.ts`, `router.ts` and `__tests__/`. Register the router in `root.ts`.
- Check `api/v1/` for an existing entity or service before creating a new one.
- Put each procedure in its own file named after it, `core/queries/{name}.ts` or `core/mutations/{name}.ts`, exporting the built procedure (e.g. `export const ping = publicProcedure.query(...)`). `router.ts` only maps names to those procedures. Domain logic shared by several procedures stays directly in `core/`, and database or Storage access goes in `services/`.
- Give every procedure that takes input a zod `.input()` schema.
- Use the narrowest procedure type: `publicProcedure`, `protectedProcedure`, `voterProcedure` or `adminProcedure`. Anything an Admin does must be an `adminProcedure`.
- Read Registration status and Admin rights from the database inside the guard, never from the session.
- Put window checks (Registration Period or Election open) inside the operation's Prisma transaction.
- Add `createCaller` tests for every new procedure, plus permission tests for every guarded one. Mark them `// @vitest-environment node`.
- Import with `@/` aliases. `@/*` resolves to `./src/*` and then `./*`.

## Must not

- Don't use Server Actions for app reads or writes. Use tRPC.
- Don't log, echo or include procedure inputs in errors, especially Ballot inputs.
- Don't weaken or bypass the Origin check in `origin.ts` or `app/api/trpc/[trpc]/route.ts`.
- Don't move Turnout into tRPC. It stays at `GET /api/turnout` so its cache is shared.
- Don't import `@/server/trpc/server` from Client Components. It's `server-only`.
- Don't change procedure guards or auth context without explicit approval from the user. These need two reviewers.

## Before finishing

Run `npm run lint`, `npm run typecheck` and `npm run test:run`.
