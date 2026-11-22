# Setup & Installation

Requires Node.js 22 and npm.

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd live-voting
   ```

2. **Install dependencies** (this also installs the lefthook git hooks):

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000/) in your browser.

Before opening a PR, read [Contributing](./contributing.md).

## Google sign-in (S1-02)

Auth.js is pinned to `next-auth@5.0.0-beta.32`. It uses the Google provider and
encrypted JWT cookie sessions with an absolute eight-hour lifetime, without a
database adapter. Check
[Auth.js security guidance](https://authjs.dev/security) and dependency advisories
when updating this beta dependency.

### Local environment

1. Copy `.env.example` to `.env.local`; do not overwrite an existing environment file.
2. Generate a secret locally with `openssl rand -base64 32` and set `AUTH_SECRET`.
3. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` from the OAuth client described below.
4. Set `ALLOWED_HOSTED_DOMAIN` to the client's confirmed Google Workspace domain
   (domain only, without `@` or a URL). `example.com` is a placeholder for tests,
   not the client's confirmed domain. Missing/blank configuration denies sign-in.
5. For local development, set `AUTH_URL=http://localhost:3000`. Restart the server
   after changing environment variables.

Keep real environment files ignored and credentials out of Git, screenshots, and
issue comments. Only `.env.example` is intended to be committed. Unit tests use
fake credentials and the placeholder domain; they need no Google account or database.

### Google OAuth client (manual setup)

In the [Google Cloud console](https://console.cloud.google.com/apis/credentials):

1. Select/create the election's Google Cloud project and configure its OAuth
   consent screen. Set the audience and test users as required for that project.
2. Create an OAuth client with application type **Web application**.
3. Register the local origin `http://localhost:3000` and this exact authorized
   redirect URI: `http://localhost:3000/api/auth/callback/google`.
4. Register corresponding HTTPS origins and `/api/auth/callback/google` redirect
   URIs for staging and production once their hostnames are known. Use separate
   OAuth clients/secrets per environment where appropriate.
5. Store the client ID/secret in the appropriate local or deployment environment.
   Set `AUTH_SECRET` and `ALLOWED_HOSTED_DOMAIN` there too. Replace/unset the local
   `AUTH_URL` on deployment; Vercel can infer its URL when `AUTH_URL` is unset.

Google's `hd` authorization parameter only filters the account picker. The actual
server-side `signIn` callback requires an exact matching `profile.hd`, literal
`profile.email_verified === true`, and a nonempty email. A valid university-looking
email address alone is insufficient. OAuth tokens are never added to JWT/session
data; no Google API offline access or refresh-token storage is requested.

### Try the flow

- Open `/api/auth/signin` and choose Google.
- A verified account in the configured Workspace should sign in.
- Personal Google accounts and accounts from another Workspace must be rejected.
- `/auth/error?error=AccessDenied` displays the configured university-only message;
  other OAuth/configuration failures get a separate safe message.
- Inspect `/api/auth/session`: S1-02 exposes only `expires` and `user.email`, with
  the email trimmed and lowercased. It must not expose Google tokens, name, or photo.
- `/api/auth/signout` provides the built-in sign-out flow.

The encrypted JWT includes server-issued `signedInAt` metadata. Session reads and
client-triggered updates never reset it: sign-in is required again at eight hours,
even if the session endpoint is polled continuously. Public `expires` reports this
fixed deadline; `signedInAt` and Google tokens are not exposed in the session.
Cookies from before this expiry fix lack the timestamp and require fresh sign-in.
Use `auth()` for server-side authentication; raw JWT decoding bypasses the callback
that enforces this absolute deadline.

`Person` persistence and the final `personId`/`email` identity contract are S1-03.
S1-02's email-only sessions are not database-backed voter/admin authorization;
those guards remain S1-04. No fake `personId` is generated in the meantime.

Run `npm run lint`, `npm run test:run`, `npm run typecheck`, then `npm run build`.
Live Workspace sign-in/rejection checks remain pending until real credentials and
the Workspace domain are available. Passing unit tests does not prove Google
Cloud client configuration or the live OAuth callback works.
