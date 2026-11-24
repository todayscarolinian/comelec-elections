# COMELEC Elections (live-voting)

Online registration and voting app for the university's student elections. It replaces the election commission's Google Form, which needed 3–4 days of manual checking in Google Sheets after voting closed.

- **Restricted.** Only verified Google Workspace accounts on the university domain can sign in.
- **One person, one Ballot.** Nobody can vote twice, and a Ballot can't be changed after it's cast.
- **Validated before voting.** Applicants upload their ISMIS Student Profile during the Registration Period, and Admins approve or reject each Registration. OCR reads the screenshot to help Admins, who still decide.
- **Late Registrations.** People who missed the Registration Period can register and vote on election day. Their Held Ballot counts once an Admin approves the Registration.
- **Auditable.** Admins can see each Ballot with the name of the Voter who cast it.
- **Turnout is public, Results are not.** Anyone can follow the Turnout count. Per-Candidate counts stay hidden until Admins release the Results.

Domain terms (Election, Registration, Voter, Ballot, Held Ballot, Turnout, Results, …) are used exactly as defined in the [Glossary](./docs/GLOSSARY.md).

## Attribution

Built by the Today's Carolinian Web Development Department for the university's SSC Commission on Elections (COMELEC), and by the living Triune God who reigns over all things that without Him none would be possible.

## Tech stack

| Concern      | Choice                                                                      |
| ------------ | --------------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4               |
| Auth         | Auth.js (`next-auth` v5 beta), Google provider, JWT sessions, no adapter    |
| API          | tRPC v11 with zod schemas and TanStack Query                                |
| Database     | Postgres on Supabase, accessed only through Prisma 7 (`@prisma/adapter-pg`) |
| File storage | Supabase Storage (private bucket for Student Profiles)                      |
| OCR          | PP-OCR models run locally with `onnxruntime-node` (`models/ocr/`)           |
| Tests        | Vitest, Testing Library, Postgres in Docker for integration tests           |
| Tooling      | oxlint, Prettier, lefthook                                                  |
| Hosting      | Vercel (`syd1`), deploys from `main` only                                   |

## Getting started

Requires **Node.js 22** and npm.

```bash
git clone <repository-url>
cd live-voting
npm install        # also runs `prisma generate` and installs the git hooks
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable                        | Required | Purpose                                                                                 |
| ------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                   | Yes      | Encrypts the session cookie. Generate with `openssl rand -base64 32`.                   |
| `AUTH_GOOGLE_ID`                | Yes      | Google OAuth client ID                                                                  |
| `AUTH_GOOGLE_SECRET`            | Yes      | Google OAuth client secret                                                              |
| `ALLOWED_HOSTED_DOMAIN`         | Yes      | Workspace domain allowed to sign in (domain only, no `@`). Empty denies every sign-in.  |
| `AUTH_URL`                      | Local    | `http://localhost:3000` locally. Unset it on Vercel.                                    |
| `DATABASE_URL`                  | Yes      | Postgres connection string used by the app at runtime                                   |
| `DIRECT_URL`                    | Yes      | Direct (non-pooled) Postgres connection used by the Prisma CLI for migrations           |
| `SUPABASE_URL`                  | Yes      | Supabase project URL, for Student Profile uploads                                       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service-role key (server only, never expose to the browser)                    |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No       | Google Analytics 4 ID. Set in Vercel Production only; leave empty to disable analytics. |

Never commit real secrets. Only `.env.example` belongs in Git. See [Installation](./docs/installation.md) for setting up the Google OAuth client and trying the sign-in flow.

### Database

The schema lives in [`prisma/schema.prisma`](./prisma/schema.prisma) and migrations in [`prisma/migrations/`](./prisma/migrations/). The Prisma CLI config is [`prisma7.config.ts`](./prisma7.config.ts), which reads `DIRECT_URL`. The Prisma client is generated into `src/generated/prisma` on `npm install`.

## Scripts

| Command                           | What it does                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                     | Start the dev server                                                           |
| `npm run build` / `npm start`     | Production build / serve it                                                    |
| `npm run lint` / `lint:fix`       | Run oxlint                                                                     |
| `npm run format`                  | Format everything with Prettier                                                |
| `npm run typecheck`               | `next typegen` and `tsc --noEmit`                                              |
| `npm test`                        | Unit tests in watch mode                                                       |
| `npm run test:run`                | Unit tests once                                                                |
| `npm run test:integration:docker` | Start a throwaway Postgres in Docker, migrate it and run the integration tests |
| `npm run db:test:down`            | Stop the test database                                                         |

Unit tests use fake credentials and need no Google account or database. Integration tests (`tests/integration/`) run against the disposable Postgres in [`docker-compose.test.yml`](./docker-compose.test.yml), whose data lives in tmpfs.

## Project structure

```
app/                    Next.js routes: landing, register, ballot, candidates, results, admin, auth
  api/auth/             Auth.js handler
  api/trpc/             tRPC endpoint
  api/turnout/          Public, cached Turnout count (outside tRPC so the cache is shared)
src/
  election.ts           Hardcoded Election definition: Questions, Candidates, Parties (ADR 0003)
  components/           UI, grouped by feature
  lib/                  Client-side helpers: tRPC client, Prisma client, analytics
  server/auth/          Sign-in policy and Person upsert
  server/ocr/           Student Profile OCR (advisory, ADR 0006)
  server/trpc/          tRPC routers under api/v1/<entity>/ (see its README)
  server/turnout/       Turnout query
prisma/                 Schema and migrations
models/ocr/             ONNX OCR models
tests/integration/      Postgres integration tests
docs/                   Product spec, design doc, ADRs, contributing guide
scripts/                Commit message and branch name validators used by the git hooks
```

Before adding a tRPC procedure, read [`src/server/trpc/README.md`](./src/server/trpc/README.md).

## Contributing

Branch from `develop` and open PRs against it. `main` is production and is what Vercel deploys.

- **Branch names** are the ticket ID, e.g. `S1-03`.
- **Commits** follow Conventional Commits **without a scope**, e.g. `feat: add study load upload`.
- **PR titles** look like `[S1-03] Create the Person on sign-in`.
- Changes to `castBallot`, procedure guards, Results or `AuditLog` need a second reviewer.

lefthook lints and formats staged files on commit and checks the commit message and branch name. CI runs lint, build, typecheck, unit tests and integration tests on every PR. Full details are in [Contributing](./docs/contributing.md).

## Documentation

- [Installation](./docs/installation.md): local setup and Google OAuth
- [Contributing](./docs/contributing.md): branching, commits, PRs, hooks and CI
- [Product Spec](./docs/product-spec.md): what the app does and why
- [Software Design](./docs/software-design.md): how it's built
- [Sprint Plan](./docs/sprint-plan.md)
- [Glossary](./docs/GLOSSARY.md)
- [Code Owners](./docs/code-owners.md)
- [Security Report](./docs/security-report.md)
- [Architecture Decision Records](./docs/adr/)
