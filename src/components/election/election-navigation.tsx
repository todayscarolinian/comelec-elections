import { Bell, LogIn } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense, type ComponentPropsWithoutRef } from 'react'
import { BallotEntryTrigger, BallotSignInTrigger } from '@/components/ballot/ballot-sign-in'
import prisma from '@/lib/prisma'
import { auth } from '@/server/auth'
import { ElectionAccountMenu, type ElectionAccount } from './election-account-menu'
import { ElectionMobileMenu } from './election-mobile-menu'

const sections = [
  { section: 'home', label: 'Home' },
  { section: 'candidates', label: 'Candidates' },
  { section: 'ballot', label: 'Ballot' },
  { section: 'turnout', label: 'Results' },
] as const

type Section = (typeof sections)[number]['section'] | 'calendar'
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
  const links = sections.map(({ section, label }) => {
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
  })

  return (
    <header className={`sticky top-0 z-20 ${isLanding ? 'h-0' : ''}`}>
      <div className="pointer-events-none w-full px-[clamp(0.5rem,1.1vw,1rem)] pt-[clamp(0.625rem,1.35vw,1.25rem)] max-[38rem]:p-0">
        <nav
          className="pointer-events-auto relative grid min-h-[4.625rem] grid-cols-[1fr_auto_1fr] items-center rounded-full border border-[#324e1f]/35 bg-[#e5efda]/44 px-[clamp(0.75rem,1.5vw,1.375rem)] py-3 text-[#17290e] shadow-[inset_0_1px_0_rgb(255_255_255/18%)] backdrop-blur-[16px] backdrop-saturate-125 max-[38rem]:flex max-[38rem]:min-h-14 max-[38rem]:justify-between max-[38rem]:gap-2 max-[38rem]:rounded-none max-[38rem]:border-x-0 max-[38rem]:border-t-0 max-[38rem]:border-comelec-sage max-[38rem]:bg-comelec-cream/95 max-[38rem]:px-4 max-[38rem]:py-1 max-[38rem]:text-comelec-forest max-[38rem]:shadow-none [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:font-medium [&_a:hover]:underline [&_a:hover]:underline-offset-4"
          aria-label="Main navigation"
        >
          <div className="justify-self-start">
            <ElectionLink
              isLanding={isLanding}
              section="home"
              aria-label="SSC COMELEC home"
              className="gap-2 whitespace-nowrap"
            >
              <Image
                src="/landing/mark.webp"
                alt=""
                width={33}
                height={33}
                className="shrink-0 max-[38rem]:size-7"
              />
              <span className="font-editorial text-lg leading-none min-[38rem]:hidden">
                SSC COMELEC
              </span>
            </ElectionLink>
          </div>
          <ul className="flex flex-wrap gap-x-[clamp(1rem,4.4vw,4rem)] gap-y-1 max-[38rem]:hidden">
            {links}
          </ul>
          <div className="flex min-w-0 items-center gap-1 justify-self-end">
            {account ? (
              <>
                <div className="max-[38rem]:hidden">
                  <ElectionLink
                    isLanding={isLanding}
                    section="calendar"
                    className="min-w-11 shrink-0 justify-center"
                    aria-label="Election calendar"
                  >
                    <Bell aria-hidden="true" size={20} />
                  </ElectionLink>
                </div>
                <ElectionAccountMenu account={account} />
              </>
            ) : account === null && !hideSignIn ? (
              activeSection === 'ballot' ? (
                <BallotSignInTrigger className="inline-flex min-h-11 min-w-10 cursor-pointer items-center justify-center gap-2 px-1 text-sm font-medium hover:underline hover:underline-offset-4">
                  <LogIn aria-hidden="true" size={18} className="max-[38rem]:hidden" />
                  Sign in
                </BallotSignInTrigger>
              ) : (
                <Link
                  href={isLanding ? '/auth/sign-in' : '/auth/sign-in?next=%2Fregister'}
                  className="min-w-10 justify-center gap-2 px-1 text-sm"
                >
                  <LogIn aria-hidden="true" size={18} className="max-[38rem]:hidden" />
                  Sign in
                </Link>
              )
            ) : null}
            <ElectionMobileMenu>
              {links}
              {account && (
                <li>
                  <ElectionLink isLanding={isLanding} section="calendar">
                    Election calendar
                  </ElectionLink>
                </li>
              )}
            </ElectionMobileMenu>
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
