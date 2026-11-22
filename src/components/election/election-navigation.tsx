import { LogIn } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense, type ComponentPropsWithoutRef } from 'react'
import { BallotEntryTrigger, BallotSignInTrigger } from '@/components/ballot/ballot-sign-in'
import prisma from '@/lib/prisma'
import { auth } from '@/server/auth'
import { ElectionAccountMenu, type ElectionAccount } from './election-account-menu'
import { NotificationBell } from './notification-bell'

const sections = [
  { section: 'home', label: 'Home' },
  { section: 'candidates', label: 'Candidates' },
  { section: 'ballot', label: 'Ballot' },
  { section: 'turnout', label: 'Results' },
] as const

type Section = (typeof sections)[number]['section']
type ElectionLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  isLanding: boolean
  section: Section
}

type NavigationProps = {
  isLanding: boolean
  hideSignIn: boolean
  activeSection?: Section
}

function ElectionLink({ isLanding, section, children, ...props }: ElectionLinkProps) {
  if (section === 'candidates' || section === 'ballot') {
    return (
      <Link href={`/${section}`} {...props}>
        {children}
      </Link>
    )
  }

  const hash = `#${section}`
  if (section === 'turnout') {
    return (
      <Link href="/results" {...props}>
        {children}
      </Link>
    )
  }

  if (isLanding) {
    return (
      <a href={hash} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link href={section === 'home' ? '/' : `/${hash}`} {...props}>
      {children}
    </Link>
  )
}

function NavigationBar({
  isLanding,
  hideSignIn,
  activeSection,
  account,
}: NavigationProps & { account?: ElectionAccount | null }) {
  return (
    <header className={`sticky top-0 z-20 ${isLanding ? 'h-0' : ''}`}>
      <div className="pointer-events-none w-full px-[clamp(0.5rem,1.1vw,1rem)] pt-[clamp(0.625rem,1.35vw,1.25rem)]">
        <nav
          className="pointer-events-auto grid min-h-[4.625rem] grid-cols-[1fr_auto_1fr] items-center rounded-full border border-[#324e1f]/35 bg-[#e5efda]/44 px-[clamp(0.75rem,1.5vw,1.375rem)] py-3 text-[#17290e] shadow-[inset_0_1px_0_rgb(255_255_255/18%)] backdrop-blur-[16px] backdrop-saturate-125 max-[38rem]:grid-cols-[auto_1fr] max-[38rem]:gap-x-3 max-[38rem]:rounded-[1.25rem] max-[38rem]:py-[0.35rem] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:font-medium [&_a:hover]:underline [&_a:hover]:underline-offset-4"
          aria-label="Main navigation"
        >
          <div className="justify-self-start">
            <ElectionLink isLanding={isLanding} section="home" aria-label="SSC COMELEC home">
              <Image src="/landing/mark.webp" alt="" width={33} height={33} />
            </ElectionLink>
          </div>
          <ul className="flex flex-wrap gap-x-[clamp(1rem,4.4vw,4rem)] gap-y-1 max-[38rem]:col-span-2 max-[38rem]:row-start-2 max-[38rem]:justify-between max-[38rem]:gap-x-2 max-[38rem]:text-sm">
            {sections.map(({ section, label }) => {
              const isCurrent = section === (activeSection ?? (isLanding ? 'home' : undefined))
              return (
                <li key={section}>
                  {section === 'ballot' && !account ? (
                    <BallotEntryTrigger isCurrent={isCurrent} />
                  ) : (
                    <ElectionLink
                      isLanding={isLanding}
                      section={section}
                      className={isCurrent ? 'underline underline-offset-4' : undefined}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      {label}
                    </ElectionLink>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="flex min-w-0 items-center gap-1 justify-self-end max-[38rem]:col-start-2 max-[38rem]:row-start-1">
            {account ? (
              <>
                <NotificationBell />
                <ElectionAccountMenu account={account} />
              </>
            ) : account === null && !hideSignIn ? (
              activeSection === 'ballot' ? (
                <BallotSignInTrigger className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-1 text-sm font-medium hover:underline hover:underline-offset-4">
                  <LogIn aria-hidden="true" size={18} />
                  Sign in
                </BallotSignInTrigger>
              ) : (
                <Link
                  href={isLanding ? '/auth/sign-in' : '/auth/sign-in?next=%2Fregister'}
                  className="gap-2 px-1 text-sm"
                >
                  <LogIn aria-hidden="true" size={18} />
                  Sign in
                </Link>
              )
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  )
}

async function SessionNavigation(props: NavigationProps) {
  const session = await auth()
  if (!session) return <NavigationBar {...props} account={null} />

  // A profile lookup failure should still leave sign-out available for a valid session.
  const person = await prisma.person
    .findUnique({ where: { id: session.user.personId }, select: { name: true } })
    .catch(() => null)

  return (
    <NavigationBar {...props} account={{ name: person?.name ?? null, email: session.user.email }} />
  )
}

export function ElectionNavigation({
  isLanding = false,
  hideSignIn = false,
  activeSection,
}: Partial<NavigationProps>) {
  const props = { isLanding, hideSignIn, activeSection }
  return (
    <Suspense fallback={<NavigationBar {...props} />}>
      <SessionNavigation {...props} />
    </Suspense>
  )
}
