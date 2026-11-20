# tRPC

Every read and write from the app goes through tRPC procedures, not Server Actions ([ADR 0007](../../../docs/adr/0007-trpc-api-layer.md)). The one exception is public Turnout, which is a plain cached route handler at `GET /api/turnout`.

## Layout

```
src/server/trpc/
  init.ts            # context, procedure types, createTRPCRouter, createCallerFactory
  root.ts            # appRouter: merges the v1 entity routers
  origin.ts          # CSRF Origin check used by the route handler
  server.tsx         # server-only: trpc (prefetch), caller, HydrateClient
  api/v1/{entity}/
    __tests__/       # core unit tests; procedure tests via createCaller
    core/            # pure domain logic, no I/O
      queries/       # one file per query procedure, e.g. ping.ts
      mutations/     # one file per mutation procedure
    services/        # Prisma and Supabase Storage access
    schema.ts        # zod input/output schemas
    router.ts        # maps procedure names to the procedures in core/
src/lib/trpc/
  client.tsx         # TRPCReactProvider, useTRPC (Client Components)
  query-client.ts    # shared QueryClient factory (superjson)
app/api/trpc/[trpc]/route.ts   # HTTP handler; rejects cross-origin mutations
```

## Adding a procedure

1. Create or extend `api/v1/{entity}/`. Put the zod input in `schema.ts`.
2. Create one file per procedure, named after it: `core/queries/{name}.ts` for a query or `core/mutations/{name}.ts` for a mutation. It exports the built procedure, such as `publicProcedure.input(...).query(...)`. Domain logic shared by several procedures (e.g. `validateBallot`) stays directly in `core/`.
3. Build it from the **narrowest** procedure type:

   | Type                 | Requirement                                    | Status    |
   | -------------------- | ---------------------------------------------- | --------- |
   | `publicProcedure`    | none                                           | available |
   | `protectedProcedure` | valid session                                  | S1-04     |
   | `voterProcedure`     | own Registration `APPROVED` (read from the DB) | S1-04     |
   | `adminProcedure`     | a row in `Admin` (read from the DB)            | S1-04     |

4. Add it to `router.ts`, which only maps names to procedures.
5. Register the router in `root.ts`:

   ```ts
   export const appRouter = createTRPCRouter({
     admin: adminRouter,
     health: healthRouter,
     registration: registrationRouter,
   })
   ```

Example:

```ts
// api/v1/health/core/queries/ping.ts
export const ping = publicProcedure.query(() => ({ ok: true as const }))

// api/v1/health/router.ts
export const healthRouter = createTRPCRouter({
  ping,
})
```

## Calling procedures

**Client Components** use `useTRPC` and React Query's own hooks:

```tsx
'use client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'

const trpc = useTRPC()
const { data } = useQuery(trpc.health.ping.queryOptions())
const submit = useMutation(trpc.registration.submit.mutationOptions())
```

**Server Components** either prefetch and hydrate, so the client renders from cache:

```tsx
import { getQueryClient, HydrateClient, trpc } from '@/server/trpc/server'

void getQueryClient().prefetchQuery(trpc.health.ping.queryOptions())
return (
  <HydrateClient>
    <PingView />
  </HydrateClient>
)
```

or call the procedure directly when the client doesn't need the data:

```ts
import { caller } from '@/server/trpc/server'

const result = await caller.health.ping()
```

## Rules

- Every procedure that takes input has a zod `.input()` schema.
- Authorization is the procedure type, never hidden UI and never an `if` inside the resolver.
- Registration status and Admin rights are read from the database on every call, never from the cookie.
- Window checks (Registration Period open, Election open) go inside the operation's transaction, not in middleware.
- Never log or echo procedure inputs, especially Ballot inputs. Don't add an `errorFormatter` that includes them.
- `POST /api/trpc` requests must carry an `Origin` matching `AUTH_URL`, or the request's own origin when `AUTH_URL` is unset. Mutations are POST, so cross-origin mutations get a 403.

## Registration review (S2-05)

- `admin.listRegistrations({ status?, yearLevel? })` lists registrations with identity, review metadata, Held Ballot priority, a signed Student Profile URL valid for 600 seconds, and validated advisory OCR. Storage signing failures return a null URL so other registrations remain reviewable. `ocrView` turns OCR PENDING older than ten minutes into FAILED; malformed OCR becomes null. Raw paths and OCR values are never included in logs or errors.
- `admin.approveRegistration({ id, yearLevel?, submittedAt? })` and `admin.rejectRegistration({ id, reason, submittedAt? })` require current Admin rights. Rejection reasons are trimmed, required, and limited to 2,000 characters. The UI sends the submission timestamp to detect a document replaced during review.
- Decisions act only on PENDING registrations, regardless of Registration/Election windows. A row lock and serializable transaction keep the decision, reviewer/time, optional corrected Held Ballot year, and audit together. Already-reviewed, resubmitted, or concurrently changed records return a conflict; no OCR fields are selected by decisions.
- The review UI requests PENDING registrations by default and passes status/Year Level filters to the server before signing documents. It polls only the selected queue every minute to renew ten-minute document URLs and OCR results; pending totals come from the lightweight `getRegistrationWindow` query. Decisions wait for server success, then refresh the queue and pending count. No sample registrations are used.
- Registration window controls retain develop's `admin.getRegistrationWindow()` and `admin.setRegistrationStatus({ status })` contract.

## Testing

Test procedures through `createCallerFactory` with a fake context. There's no HTTP involved:

```ts
// @vitest-environment node
import { createCallerFactory } from '@/server/trpc/init'
import { appRouter } from '@/server/trpc/root'

const caller = createCallerFactory(appRouter)({ headers: new Headers() })
await expect(caller.health.ping()).resolves.toEqual({ ok: true })
```

Every guarded procedure needs permission tests that reject signed-out, wrong-role and revoked callers (Design §12).
