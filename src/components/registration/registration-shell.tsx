import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

type RegistrationShellProps = {
  children: ReactNode
}

export function RegistrationShell({ children }: Readonly<RegistrationShellProps>) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-comelec-cream font-sans text-comelec-forest">
      {/* Top pill navigation */}
      <header className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-8 lg:px-12 lg:pt-12">
        <nav
          aria-label="Primary"
          className="flex items-center justify-between rounded-full border border-comelec-forest/60 px-5 py-3.5 sm:px-8 sm:py-5"
        >
          <Link
            href="/"
            aria-label="SSC COMELEC Home"
            className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
          >
            <Image
              src="/branding/comelec-seal.png"
              alt="USC Commission on Elections seal"
              width={33}
              height={33}
              className="h-[33px] w-[33px] object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium text-comelec-forest sm:gap-12 sm:text-base lg:gap-16">
            <Link
              href="/"
              className="transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
            >
              Home
            </Link>
            <Link
              href="/candidates"
              className="transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
            >
              Candidates
            </Link>
            <Link
              href="/ballot"
              className="transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
            >
              Ballot
            </Link>
          </div>

          <div aria-hidden="true" className="hidden h-[33px] w-[33px] shrink-0 sm:block" />
        </nav>
      </header>

      {/* Main split content */}
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-stretch gap-10 px-4 pt-6 pb-12 sm:px-8 lg:flex-row lg:items-center lg:gap-20 lg:px-16 xl:gap-28">
        {/* Left editorial campaign panel */}
        <aside
          aria-label="SSC Elections 2026"
          className="comelec-poster-bg relative flex w-full shrink-0 flex-col justify-between overflow-hidden p-8 sm:p-10 lg:min-h-[760px] lg:w-[460px] xl:min-h-[800px] xl:w-[528px]"
        >
          <div
            aria-hidden="true"
            className="comelec-poster-grain pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
          />

          <div className="relative z-10 space-y-5">
            <p className="text-xs font-medium tracking-[0.08em] text-comelec-forest uppercase">
              SSC ELECTIONS
            </p>
            <p className="font-display comelec-outline-display text-5xl leading-[1.06] italic sm:text-6xl xl:text-[72px]">
              Your vote
              <br />
              starts here.
            </p>
          </div>

          <div className="relative z-10 my-8 flex justify-start pl-2 sm:pl-6 lg:my-0">
            <Image
              src="/branding/registration-dice.png"
              alt=""
              aria-hidden="true"
              width={217}
              height={247}
              className="pointer-events-none h-auto w-[160px] select-none sm:w-[200px] xl:w-[217px]"
              priority
            />
          </div>

          <div className="relative z-10 flex items-baseline justify-between gap-4 text-comelec-cream">
            <span className="font-editorial text-2xl tracking-wide">SSC COMELEC</span>
            <span className="text-sm font-medium tracking-wider">2026</span>
          </div>
        </aside>

        {/* Right dynamic content column */}
        <div className="flex w-full max-w-[672px] flex-1 flex-col justify-center">{children}</div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 lg:px-16">
        <div className="h-px w-full bg-comelec-sage" />
        <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Image
              src="/branding/comelec-seal.png"
              alt="USC Commission on Elections seal"
              width={64}
              height={64}
              className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
            />
            <div className="space-y-1">
              <p className="font-editorial text-2xl leading-none text-comelec-forest sm:text-[36px]">
                SSC COMELEC
              </p>
              <p className="text-sm text-comelec-olive">Student council elections · 2026</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-comelec-forest sm:gap-8 sm:text-base">
            <Link
              href="/candidates"
              className="transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
            >
              Candidates
            </Link>
            <Link
              href="/ballot"
              className="transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
            >
              Ballot
            </Link>
            <a
              href="mailto:comelec@usc.edu.ph"
              className="transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
            >
              Contact the Commission
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
