'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useTRPC } from '@/lib/trpc/client'

export const ADMIN_DESTINATIONS = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Registrations', href: '/admin/registrations' },
  { label: 'Ballot audit', href: '/admin/ballots' },
  { label: 'Results', href: '/admin/results' },
  { label: 'Admins', href: '/admin/admins' },
  { label: 'Activity log', href: '/admin/activity' },
] as const

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === href : pathname.startsWith(href)
}

export function AdminShell({ account, children }: { account: ReactNode; children: ReactNode }) {
  const trpc = useTRPC()
  const pathname = usePathname()
  const windowQuery = useQuery({
    ...trpc.admin.getRegistrationWindow.queryOptions(),
    refetchInterval: 60_000,
    retry: false,
  })
  const pending = windowQuery.data?.pendingCount

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-review-paper font-[Arial,Helvetica,sans-serif] text-[13px] leading-normal text-review-ink scheme-light min-[1001px]:grid-cols-[224px_minmax(0,1fr)] min-[1301px]:grid-cols-[272px_minmax(0,1fr)] [&_button]:cursor-pointer [&_button:disabled]:cursor-wait [&_button:disabled]:opacity-50 [&_button]:rounded-none [&_select]:cursor-pointer [&_select]:rounded-none [&_input]:rounded-none [&_textarea]:rounded-none [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-review-ink">
      <a
        className="fixed top-2 left-2 z-10 -translate-y-[150%] bg-review-ink p-3 text-review-paper focus:translate-y-0"
        href="#admin-main"
      >
        Skip to main content
      </a>
      <aside
        className="flex flex-wrap items-center justify-between gap-4 border border-review-line p-4 min-[761px]:px-6 min-[1001px]:sticky min-[1001px]:top-0 min-[1001px]:h-dvh min-[1001px]:flex-col min-[1001px]:flex-nowrap min-[1001px]:items-stretch min-[1001px]:justify-start min-[1001px]:px-4 min-[1001px]:py-6"
        aria-label="Commission admin"
      >
        <div className="flex min-h-10 items-center gap-3 min-[1001px]:border-b min-[1001px]:border-review-line min-[1001px]:pb-4">
          <Image
            src="/comelec-seal.png"
            alt="SSC COMELEC seal"
            loading="eager"
            width={33}
            height={33}
            className="size-[33px] shrink-0 object-contain"
          />
          <div>
            <span className="font-editorial text-lg leading-[26px] min-[1301px]:text-[22px]">
              SSC COMELEC
            </span>
            <small className="block text-[10px] text-review-muted">COMMISSION ADMIN</small>
          </div>
        </div>
        <nav
          aria-label="Admin navigation"
          className="order-last flex w-full gap-1 overflow-x-auto min-[1001px]:order-none min-[1001px]:grid min-[1001px]:gap-2 min-[1001px]:overflow-visible"
        >
          {ADMIN_DESTINATIONS.map(({ label, href }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 shrink-0 items-center justify-between gap-6 p-3 text-sm no-underline ${active ? 'bg-review-ink text-[#effed4]' : 'hover:bg-review-selected'}`}
              >
                {label}
                {href === '/admin/registrations' && (
                  <span className="text-xs" aria-label={`${pending ?? 'Unknown'} pending`}>
                    {pending ?? '—'}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="min-[1001px]:mt-auto min-[1001px]:border-t min-[1001px]:border-review-line min-[1001px]:pt-4">
          {account}
        </div>
      </aside>
      <div id="admin-main" className="min-w-0">
        {children}
      </div>
    </div>
  )
}
