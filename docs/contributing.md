# Contributing

- [Git Conventions and Standards](#git-conventions-and-standards)
  - [Repository Structure](#repository-structure)
  - [Branching Strategy](#branching-strategy)
  - [Commit Standards](#commit-standards)
  - [Pull Request (PR) Process](#pull-request-pr-process)
  - [Version Tagging](#version-tagging)
- [Git Hooks and CI](#git-hooks-and-ci)
- [PostgreSQL integration tests](#postgresql-integration-tests)
- [Step-by-Step Instructions for Developers](#step-by-step-instructions-for-developers)
  - [Setting Up Git](#setting-up-git)
  - [Cloning the Repository](#cloning-the-repository)
  - [Creating a New Branch](#creating-a-new-branch)
  - [Writing and Committing Code](#writing-and-committing-code)
  - [Pushing Your Branch](#pushing-your-branch)
  - [Creating a Pull Request (PR)](#creating-a-pull-request-pr)
  - [Updating Your Branch](#updating-your-branch)
  - [Merging Your Branch](#merging-your-branch)
  - [Best Practices](#best-practices)

## Git Conventions and Standards

### Repository Structure

- **Main branches:**
  - `main`: stable branch containing production-ready code.
  - `develop`: integration branch for ongoing development. All ticket branches start from and merge into `develop`.
- **Ticket branches:** the branch name is exactly the ticket ID, `S<SPRINT>-<TICKET>` (e.g., `S1-03` for Sprint 1, Ticket 3).
  - Sprint 1 tickets in the [Sprint Plan](./sprint-plan.md) already use this format.
  - Later sprints number tasks as `<SPRINT>.<TASK>`; prefix `S` and zero-pad the task: `2.1` → `S2-01`, `2.10` → `S2-10`, `3.7` → `S3-07`.

### Branching Strategy

- Never commit directly to `main` or `develop`.
- One PR per ticket; merge through Pull Requests only.

### Commit Standards

- **Message format:** `<type>: <subject>` ([Conventional Commits](https://www.conventionalcommits.org/), **no scope**).
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
  - Example: `feat: add study load upload`
  - Not allowed: `feat(auth): add sign-in` (scopes are rejected).
- If there is a body, leave a blank line after the header and keep body lines at 100 characters or fewer.
- **Granularity:** commit small, logical changes.

See [`scripts/validate-commit-msg/README.md`](../scripts/validate-commit-msg/README.md) for the full rules.

### Pull Request (PR) Process

- Target `develop`.
- Title format: `[<Ticket ID>] <Ticket title>` (e.g., `[S1-03] Create the Person on sign-in`).
- Describe what you changed and why, and link the ticket.
- At least one reviewer must approve before merging. Anything touching `castBallot`, procedure guards, Results or `AuditLog` needs a **second** reviewer (see [Code Owners](./code-owners.md)).
- CI (lint, build and typecheck, unit tests) must pass.

### Version Tagging

- Use semantic versioning: `v<MAJOR>.<MINOR>.<PATCH>` (e.g., `v1.0.0`).

## Git Hooks and CI

Hooks are managed by [lefthook](https://lefthook.dev/) and installed automatically by `npm install`. If they are missing, run `npx lefthook install`.

| Hook         | What it does                                                                  |
| ------------ | ----------------------------------------------------------------------------- |
| `pre-commit` | `oxlint --fix` and `prettier --write` on staged files, then re-stages them    |
| `commit-msg` | Validates the commit message format (`scripts/validate-commit-msg`)           |
| `pre-push`   | Validates the branch name (`scripts/validate-branch-name`)                    |

GitHub Actions run on every PR: **Lint Check** (`npm run lint`), **Build and Typescript Check** (`npm run build`, `npm run typecheck`) and **Unit Tests** (tests affected by the PR; the full suite runs on every push to `develop`). PRs are auto-assigned to their author.

Useful scripts:

```bash
npm run lint        # oxlint
npm run lint:fix    # oxlint --fix
npm run typecheck   # next typegen && tsc --noEmit
npm test            # vitest (watch mode)
npm run test:run    # vitest run (once)
```

## Step-by-Step Instructions for Developers

### Setting Up Git

1. Install Git from [Git's official site](https://git-scm.com/).
2. Set up your Git profile:

   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. Verify the configuration:

   ```bash
   git config --list
   ```

### Cloning the Repository

See [Installation](./installation.md).

### Creating a New Branch

1. Switch to `develop` and pull the latest changes:

   ```bash
   git checkout develop
   git pull origin develop
   ```

2. Create a branch named after the ticket ID:

   ```bash
   git checkout -b S1-03
   ```

### Writing and Committing Code

1. Write your code and save your changes.
2. Check modified files:

   ```bash
   git status
   ```

3. Stage files:

   ```bash
   git add <file-name>
   ```

4. Commit:

   ```bash
   git commit -m "feat: create person on first sign-in"
   ```

### Pushing Your Branch

```bash
git push origin S1-03
```

### Creating a Pull Request (PR)

1. Open the repository on GitHub.
2. Find your branch and click **Compare & pull request**, with `develop` as the base.
3. Fill out the PR details:
   - Title: `[S1-03] Create the Person on sign-in`
   - Description: what you did and why.
4. Request reviewers and submit.

### Updating Your Branch

1. Pull updates from `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout S1-03
   git merge develop
   ```

2. Resolve conflicts, if any:

   ```bash
   git add <file-name>
   git merge --continue
   ```

### Merging Your Branch

1. After approval and passing CI, merge the PR into `develop`.
2. Sync your local `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   ```

### Best Practices

- Pull from `develop` often to avoid conflicts.
- Write clear commit messages.
- Delete merged branches:

  ```bash
  git branch -d S1-03
  ```
## PostgreSQL integration tests

Run the same server-side voting tests as CI against a disposable local Postgres in Docker (works in PowerShell, Git Bash, macOS and Linux; Docker must be running):

```sh
npm run test:integration:docker
```

This recreates the `postgres` container from `docker-compose.test.yml` on `127.0.0.1:55432`, waits for it to be healthy, applies Prisma migrations, and runs the suite. The database lives in tmpfs, so each run starts empty, and fixture tables are cleared between tests. Production `.env` settings are not used.

The container keeps running so you can re-run `npm run test:integration` quickly. Stop it with:

```sh
npm run db:test:down
```

To use a different Postgres instance, set `COMELEC_TEST_DB_PORT` to its port; the host, user, password and database are fixed to `127.0.0.1` / `comelec_test`.
