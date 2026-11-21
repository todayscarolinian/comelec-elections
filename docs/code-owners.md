# Live Voting: Code Owners

| | |
|---|---|
| **Last updated** | 2026-11-06 |
| **Related** | [Sprint Plan](./sprint-plan.md) · [Software Design](./software-design.md) · [Dev Kickoff Guide](./dev-kickoff-guide.md) · [ADR 0007: tRPC API Layer](./adr/0007-trpc-api-layer.md) |

Each area has an owner who reviews and approves changes to it. Paths follow [Software Design §11](./software-design.md#11-project-structure-proposed). `v1/` below is short for `src/server/trpc/api/v1/`, where each entity has `__tests__/`, `core/`, `services/`, `schema.ts` and `router.ts`.

| Area | Covers | Owners | Main paths |
|---|---|---|---|
| **Auth + Infrastructure** | Next.js, Auth.js, tRPC setup, procedure guards, CI/CD, deploys | Miguel | `src/server/auth/`, `src/server/trpc/init.ts`, `src/server/trpc/root.ts`, `src/server/trpc/server.tsx`, `src/server/trpc/origin.ts`, `app/api/auth/`, `app/api/trpc/`, `src/lib/trpc/`, `src/types/next-auth.d.ts`, `next.config.ts`, CI config |
| **Data + Migrations** | Prisma, RLS | Jhanell | `prisma/`, `src/lib/db.ts` |
| **Registration** | Upload, Register, OCR | Adrian | `v1/registration/`, `src/server/storage.ts`, `app/register/`, `app/admin/registrations/` |
| **Voting** | Election config, Ballots, Turnout | Ethan | `src/election.ts`, `v1/election/`, `v1/ballot/`, `app/vote/`, `app/api/turnout/`, `public/candidates/` |
| **Admin + Results** | Windows, Admin grant/revoke, Results release, Ballot audit, audit logs | Nina, Cliff | `v1/admin/`, `v1/results/`, `v1/audit/`, `app/admin/` (except `registrations/`), `app/results/` |
| **QA + Dry Run** | Integration tests, concurrency, load check, dry run | Jhanell, Miguel, Charles | `v1/*/__tests__/` (shared with each area's owners), test setup, dry-run script |
| **User Interface and Experience** | Page design, layout, components, mobile-first UX | Charles, Neah | `app/**/page.tsx`, `app/layout.tsx`, shared components, `app/globals.css` |

## Review rules

From the [Dev Kickoff Guide](./dev-kickoff-guide.md#agree-on):

- One PR per task, with at least one reviewer from the owning area.
- Anything touching `v1/ballot/`, `trpc/init.ts` (procedure guards), `v1/results/` or `v1/audit/` needs a **second reviewer**.
- A new procedure must use the narrowest procedure type that fits (`publicProcedure` → `protectedProcedure` → `voterProcedure` → `adminProcedure`). Reviewers check this first.
- Production deploys are done only by the Auth + Infrastructure owner.
- Schema migrations are written by the implementer and run manually by a developer, never on deploy.
