'use client'

import { Menu, X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

export function ElectionMobileMenu({ children }: { children: ReactNode }) {
  const drawer = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const menu = drawer.current
    if (!menu) return

    const desktop = window.matchMedia('(min-width: 38rem)')
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches && menu?.open) menu.close()
    }
    function closeOnLink(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest('a')) menu?.close()
    }

    desktop.addEventListener('change', closeOnDesktop)
    menu.addEventListener('click', closeOnLink)
    return () => {
      desktop.removeEventListener('change', closeOnDesktop)
      menu.removeEventListener('click', closeOnLink)
    }
  }, [])

  return (
    <div className="shrink-0 min-[38rem]:hidden">
      <button
        type="button"
        aria-label="Navigation menu"
        aria-haspopup="dialog"
        aria-controls={id}
        className="grid size-11 cursor-pointer place-items-center rounded-md hover:bg-comelec-sage/25 focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true })
          drawer.current?.showModal()
        }}
      >
        <Menu aria-hidden="true" size={22} />
      </button>
      <dialog
        ref={drawer}
        id={id}
        aria-labelledby={`${id}-title`}
        closedby="any"
        className="fixed inset-y-0 end-0 start-auto m-0 h-dvh max-h-none w-[min(19rem,calc(100%-2.5rem))] max-w-none overflow-y-auto overscroll-contain border-s border-comelec-sage bg-comelec-cream px-4 text-comelec-forest shadow-[-12px_0_32px_rgb(23_41_14/16%)] backdrop:bg-[#17290e]/45 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:starting:translate-x-full"
      >
        <div className="flex min-h-14 items-center justify-between border-b border-comelec-sage">
          <h2 id={`${id}-title`} className="font-editorial text-xl">
            Menu
          </h2>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="grid size-11 cursor-pointer place-items-center rounded-md hover:bg-comelec-sage/25 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => drawer.current?.close()}
          >
            <X aria-hidden="true" size={22} />
          </button>
        </div>
        <ul className="grid gap-1 py-3 text-sm [&_[aria-current=page]]:bg-comelec-sage/35 [&_[aria-current=page]]:no-underline [&_li>*]:min-h-12 [&_li>*]:w-full [&_li>*]:rounded-md [&_li>*]:px-3 [&_li>*:hover]:bg-comelec-sage/25">
          {children}
        </ul>
      </dialog>
    </div>
  )
}
