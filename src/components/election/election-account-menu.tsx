'use client'

import { ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { signOutFromElection } from '@/server/auth/actions'

export type ElectionAccount = { name: string | null; email: string }

function SignOutButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md bg-[#e7edd4] px-3 text-start text-sm font-medium hover:bg-comelec-sage/55 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
    >
      <LogOut aria-hidden="true" size={18} />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}

export function ElectionAccountMenu({ account }: { account: ElectionAccount }) {
  const menu = useRef<HTMLDetailsElement>(null)
  const name = account.name && account.name !== account.email ? account.name : 'Account'
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      const details = menu.current
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      const details = menu.current
      if (event.key !== 'Escape' || !details?.open || !details.contains(document.activeElement)) {
        return
      }
      event.preventDefault()
      details.open = false
      details.querySelector('summary')?.focus()
    }

    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [])

  return (
    <details ref={menu} className="group relative min-w-0 justify-self-end">
      <summary
        aria-label={`Account menu for ${name === 'Account' ? account.email : name}`}
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 max-[38rem]:min-w-10 max-[38rem]:justify-center [&::-webkit-details-marker]:hidden"
      >
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e2ebd1] text-[0.6875rem]"
        >
          {initials}
        </span>
        <span className="max-w-24 truncate max-[38rem]:hidden sm:max-w-36">{name}</span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className="shrink-0 group-open:rotate-180 max-[38rem]:hidden"
        />
      </summary>
      <div className="absolute end-0 top-full z-30 mt-2 w-[min(17.75rem,calc(100vw-2rem))] rounded-[10px] border border-comelec-sage bg-comelec-cream p-2 text-comelec-forest shadow-[0_12px_32px_rgba(10,20,5,0.2)]">
        <div className="mx-2 border-b border-comelec-sage px-0 pb-3 pt-2">
          <p className="font-medium wrap-anywhere">{name}</p>
          <p className="mt-1 text-sm wrap-anywhere text-comelec-olive">{account.email}</p>
        </div>
        <form action={signOutFromElection} className="mt-2">
          <SignOutButton />
        </form>
      </div>
    </details>
  )
}
