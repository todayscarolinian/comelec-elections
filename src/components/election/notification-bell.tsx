'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useRef } from 'react'
import { toast } from 'sonner'
import { notificationCopy } from '@/lib/notifications/copy'
import { useTRPC } from '@/lib/trpc/client'
import type { AppRouter } from '@/server/trpc/root'

type Item = inferRouterOutputs<AppRouter>['notification']['list']['items'][number]

const POLL_MS = 30_000
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function timeAgo(date: Date, now = Date.now()) {
  const seconds = Math.round((date.getTime() - now) / 1000)
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function NotificationBell() {
  const trpc = useTRPC()
  const client = useQueryClient()
  const router = useRouter()
  const menu = useRef<HTMLDetailsElement>(null)
  // null until the first fetch, which only records what already exists (no toasts).
  const seen = useRef<Set<string> | null>(null)

  const list = useQuery({
    ...trpc.notification.list.queryOptions({ limit: 20 }),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    retry: false,
  })
  const invalidate = () => client.invalidateQueries({ queryKey: trpc.notification.list.queryKey() })
  const markRead = useMutation(
    trpc.notification.markRead.mutationOptions({ onSuccess: invalidate }),
  )
  const markAllRead = useMutation(
    trpc.notification.markAllRead.mutationOptions({ onSuccess: invalidate }),
  )

  function openItem(item: Item) {
    if (!item.read) markRead.mutate({ ids: [item.id] })
    if (menu.current) menu.current.open = false
    router.push(notificationCopy(item.type, item.data).href)
  }

  const items = list.data?.items
  const toastNew = useEffectEvent((current: Item[]) => {
    if (seen.current === null) {
      seen.current = new Set(current.map(({ id }) => id))
      return
    }
    for (const item of current) {
      if (seen.current.has(item.id)) continue
      seen.current.add(item.id)
      if (item.read) continue
      const copy = notificationCopy(item.type, item.data)
      toast(copy.title, {
        description: copy.body,
        action: { label: 'View', onClick: () => openItem(item) },
      })
    }
  })
  useEffect(() => {
    if (items) toastNew(items)
  }, [items])

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      if (
        menu.current?.open &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      ) {
        menu.current.open = false
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

  const unread = list.data?.unreadCount ?? 0
  const badge = unread > 9 ? '9+' : String(unread)

  return (
    <details ref={menu} className="relative shrink-0">
      <summary
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden"
      >
        <Bell aria-hidden="true" size={20} />
        <span aria-live="polite" className="sr-only">
          {unread > 0 ? `${unread} unread notifications` : ''}
        </span>
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute end-1 top-1.5 grid min-w-4 place-items-center rounded-full bg-[#9b2c1f] px-1 text-[0.625rem] leading-4 font-semibold text-white"
          >
            {badge}
          </span>
        ) : null}
      </summary>
      <div className="absolute end-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-[10px] border border-comelec-sage bg-comelec-cream p-2 text-comelec-forest shadow-[0_12px_32px_rgba(10,20,5,0.2)]">
        <div className="mx-2 flex items-center justify-between gap-2 border-b border-comelec-sage pt-2 pb-3">
          <p className="font-medium">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="min-h-8 cursor-pointer rounded-md px-2 text-sm font-medium text-comelec-olive hover:bg-comelec-sage/55 focus-visible:outline-2 disabled:opacity-60"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        {list.isError ? (
          <p className="px-3 py-6 text-center text-sm text-comelec-olive">
            Couldn’t load notifications.
          </p>
        ) : !items ? (
          <p className="px-3 py-6 text-center text-sm text-comelec-olive">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-comelec-olive">You’re all caught up.</p>
        ) : (
          <ul className="mt-1 max-h-[min(24rem,60vh)] overflow-y-auto">
            {items.map((item) => {
              const copy = notificationCopy(item.type, item.data)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    aria-label={`${item.read ? '' : 'Unread: '}${copy.title}. ${copy.body} ${timeAgo(item.createdAt)}`}
                    className="flex w-full cursor-pointer gap-3 rounded-md px-3 py-2.5 text-start hover:bg-comelec-sage/55 focus-visible:outline-2"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-[#9b2c1f]'}`}
                    />
                    <span className="min-w-0">
                      <span className={`block text-sm ${item.read ? '' : 'font-semibold'}`}>
                        {copy.title}
                      </span>
                      <span className="mt-0.5 block text-sm wrap-anywhere text-comelec-olive">
                        {copy.body}
                      </span>
                      <span className="mt-1 block text-xs text-comelec-olive">
                        {timeAgo(item.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </details>
  )
}
