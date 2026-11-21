import Image from 'next/image'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import { ElectionNavigation } from '@/components/election/election-navigation'

const inter = Inter({ subsets: ['latin'], variable: '--registration-body' })
const display = localFont({
  src: '../../../public/fonts/antimonia/Antinomia-Display-Italic-TRIAL.ttf',
  style: 'italic',
  variable: '--registration-display',
})
const text = localFont({
  src: '../../../public/fonts/antimonia/Antinomia-Text-Regular-TRIAL.ttf',
  variable: '--registration-text',
  preload: false,
})

const footerLinks = [
  { href: '/#candidates', label: 'Candidates' },
  { href: '/ballot', label: 'Ballot' },
]

const contentGutters = 'w-full px-(--registration-inset)'

function ElectionPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative isolate flex h-72 flex-col justify-between gap-8 overflow-hidden bg-[#d8e9bd] bg-[url('/landing/hero.webp')] bg-position-[73.73%_90.78%] bg-size-[137.88%_109%] p-[clamp(1.25rem,2.78vw,2.5rem)] min-[56rem]:h-[57rem] min-[56rem]:self-start"
    >
      <div>
        <p className="text-xs font-medium uppercase">SSC Elections</p>
        <p className="mt-3.5 text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.06] text-transparent italic [font-family:var(--registration-display),Georgia,serif] [-webkit-text-stroke:1px_#324e1f] min-[56rem]:mt-6 forced-colors:text-[CanvasText] forced-colors:[-webkit-text-stroke:0]">
          Your vote
          <br />
          starts here.
        </p>
      </div>
      <div className="pointer-events-none absolute end-[8%] top-[24%] -z-10 h-24 w-[36%] min-[56rem]:start-[9%] min-[56rem]:end-auto min-[56rem]:top-[45%] min-[56rem]:h-64 min-[56rem]:w-[40%]">
        <Image
          src="/landing/motif-two.webp"
          alt=""
          width={144}
          height={116}
          className="absolute start-0 top-0 h-auto w-[57%] rotate-[-163deg]"
        />
        <Image
          src="/landing/motif.webp"
          alt=""
          width={144}
          height={116}
          className="absolute end-0 top-[44%] h-auto w-[62%]"
        />
      </div>
      <div className="flex items-center justify-between gap-4 text-[#faf3e0]">
        <p className="text-lg [font-family:var(--registration-text),Georgia,serif] sm:text-2xl">
          SSC COMELEC
        </p>
        <span className="text-sm font-medium">2026</span>
      </div>
    </aside>
  )
}

export function RegistrationShell({
  children,
  signInPage = false,
}: {
  children: ReactNode
  signInPage?: boolean
}) {
  return (
    <div
      className={`flex min-h-svh flex-1 flex-col bg-[#faf3e0] text-[#324e1f] [--registration-inset:clamp(1rem,1.67vw,1.5rem)] [font-family:var(--registration-body),Arial,sans-serif] [&_:is(a,button,select):focus-visible]:outline-2 [&_:is(a,button,select):focus-visible]:outline-offset-4 ${inter.variable} ${display.variable} ${text.variable}`}
    >
      <a
        href="#registration-content"
        className="absolute start-4 top-4 z-30 -translate-y-[calc(100%+1rem)] bg-[#faf3e0] px-4 py-3 focus:translate-y-0"
      >
        {signInPage ? 'Skip to sign-in' : 'Skip to registration'}
      </a>
      <div className="flex min-h-svh flex-col">
        <ElectionNavigation hideSignIn={signInPage} />
        <main
          id="registration-content"
          tabIndex={-1}
          className={`${contentGutters} grid flex-1 scroll-mt-28 content-start items-center gap-(--registration-inset) py-(--registration-inset) min-[56rem]:grid-cols-2 min-[56rem]:content-stretch`}
        >
          <ElectionPanel />
          {children}
        </main>
      </div>
      <footer className={contentGutters}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#b6c89f] py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="SSC COMELEC home">
            <Image src="/landing/mark.webp" alt="" width={56} height={56} />
            <span>
              <span className="block text-[clamp(1.5rem,2.5vw,2.25rem)] leading-tight [font-family:var(--registration-text),Georgia,serif]">
                SSC COMELEC
              </span>
              <span className="block text-sm text-[#56654a]">Student council elections · 2026</span>
            </span>
          </Link>
          <nav aria-label="Footer navigation" className="flex gap-6 text-sm">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                className="inline-flex min-h-11 items-center hover:underline hover:underline-offset-4"
                href={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
