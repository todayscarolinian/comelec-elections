export function AuthErrorMessage({
  error,
  allowedDomain,
}: Readonly<{ error?: string; allowedDomain?: string }>) {
  const configurationError = !allowedDomain?.trim() || error === 'Configuration'
  const accessDenied = error === 'AccessDenied' && !configurationError
  const heading = configurationError
    ? 'Sign-in unavailable'
    : accessDenied
      ? 'Sign-in not allowed'
      : 'Unable to sign in'
  const message = configurationError
    ? 'Organization sign-in is not configured. Contact the election administrator.'
    : accessDenied
      ? `Only @${allowedDomain} organization accounts can sign in.`
      : 'We could not complete your Google sign-in. Please try again.'

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16 text-zinc-950 dark:text-zinc-50">
      <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
      <p className="mt-4 max-w-prose text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        {message}
      </p>
      {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Auth.js serves HTML, not a Next.js page. */}
      <a
        href="/api/auth/signin"
        className="mt-8 w-fit rounded-full bg-zinc-900 px-6 py-3 font-medium text-zinc-50 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 dark:focus-visible:outline-zinc-100"
      >
        Try again
      </a>
    </main>
  )
}
