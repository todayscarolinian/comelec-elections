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
