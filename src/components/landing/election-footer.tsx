import { sectionInner } from './landing-styles'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { BallotEntryTrigger } from '@/components/ballot/ballot-sign-in'
import { auth } from '@/server/auth'

async function FooterBallotEntry() {
  const session = await auth()
  return session ? <Link href="/ballot">Ballot</Link> : <BallotEntryTrigger />
}

export function ElectionFooter() {
  return (
    <footer>
      <div
        className={`${sectionInner} flex min-h-[7.5rem] items-center justify-between gap-5 py-5 max-[38rem]:flex-col max-[38rem]:items-start`}
      >
        <div className="flex items-center gap-3">
          <Image src="/landing/mark.webp" alt="" width={56} height={56} />
          <div>
            <p className="text-[clamp(1.35rem,2.15vw,2rem)] leading-tight [font-family:var(--landing-text),Georgia,serif]">
              SSC COMELEC
            </p>
            <small className="text-(--landing-muted)">Student council elections · 2026</small>
          </div>
        </div>
        <nav
          className="flex flex-wrap gap-x-6 text-sm [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:font-medium [&_a:hover]:underline [&_a:hover]:underline-offset-4"
          aria-label="Footer navigation"
        >
          <Link href="/#candidates">Candidates</Link>
          <Link href="/register">Registration</Link>
          <Suspense fallback={<BallotEntryTrigger />}>
            <FooterBallotEntry />
          </Suspense>
        </nav>
      </div>
    </footer>
  )
}
