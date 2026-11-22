import { fireEvent, render, screen } from '@testing-library/react'
import type { inferRouterOutputs } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppRouter } from '@/server/trpc/root'

type List = inferRouterOutputs<AppRouter>['notification']['list']

const { state, markRead, markAllRead, push, toast } = vi.hoisted(() => ({
  state: { data: undefined as unknown, isError: false },
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  push: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: state.data, isError: state.isError }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: { kind: string }) => ({
    mutate: options.kind === 'one' ? markRead : markAllRead,
    isPending: false,
  }),
}))
vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    notification: {
      list: { queryOptions: () => ({}), queryKey: () => ['notifications'] },
      markRead: { mutationOptions: () => ({ kind: 'one' }) },
      markAllRead: { mutationOptions: () => ({ kind: 'all' }) },
    },
  }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('sonner', () => ({ toast }))

import { NotificationBell } from '../notification-bell'

const approved = {
  id: 'n1',
  type: 'REGISTRATION_APPROVED' as const,
  data: null,
  createdAt: new Date(),
  read: false,
}
const votingOpened = {
  id: 'n2',
  type: 'VOTING_OPENED' as const,
  data: null,
  createdAt: new Date(),
  read: true,
}

function list(items: List['items'], unreadCount = items.filter((i) => !i.read).length): List {
  return { items, unreadCount }
}

beforeEach(() => {
  vi.clearAllMocks()
  state.data = undefined
  state.isError = false
})

describe('NotificationBell', () => {
  it('shows the unread count in the badge and label', () => {
    state.data = list([approved, votingOpened])
    render(<NotificationBell />)
    expect(screen.getByLabelText('Notifications, 1 unread')).toBeTruthy()
    expect(screen.getByText('1', { selector: '[aria-hidden="true"]' })).toBeTruthy()
  })

  it('caps the badge at 9+', () => {
    state.data = list([approved], 12)
    render(<NotificationBell />)
    expect(screen.getByText('9+')).toBeTruthy()
  })

  it('shows an empty state with no badge', () => {
    state.data = list([])
    render(<NotificationBell />)
    expect(screen.getByLabelText('Notifications')).toBeTruthy()
    expect(screen.getByText('You’re all caught up.')).toBeTruthy()
    expect(screen.queryByText('Mark all as read')).toBeNull()
  })

  it('does not toast existing notifications on first load, then toasts new unread ones', () => {
    state.data = list([approved])
    const { rerender } = render(<NotificationBell />)
    expect(toast).not.toHaveBeenCalled()

    const rejected = {
      ...approved,
      id: 'n3',
      type: 'REGISTRATION_REJECTED' as const,
      data: { rejectionReason: 'Blurry' },
    }
    state.data = list([rejected, approved, { ...votingOpened, id: 'n4' }])
    rerender(<NotificationBell />)

    // Only the new unread one; the new already-read broadcast is skipped.
    expect(toast).toHaveBeenCalledExactlyOnceWith(
      'Registration needs changes',
      expect.objectContaining({
        description: 'Reason: Blurry. You can update and resubmit.',
      }),
    )

    // The same data again does not re-toast.
    state.data = list([rejected, approved, { ...votingOpened, id: 'n4' }])
    rerender(<NotificationBell />)
    expect(toast).toHaveBeenCalledTimes(1)
  })

  it('marks an unread item read and navigates to its page', () => {
    state.data = list([approved])
    render(<NotificationBell />)
    fireEvent.click(screen.getByRole('button', { name: /Unread: Registration approved/ }))
    expect(markRead).toHaveBeenCalledExactlyOnceWith({ ids: ['n1'] })
    expect(push).toHaveBeenCalledWith('/ballot')
  })

  it('does not re-mark an already read item', () => {
    state.data = list([votingOpened])
    render(<NotificationBell />)
    fireEvent.click(screen.getByRole('button', { name: /^Voting is open/ }))
    expect(markRead).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/ballot')
  })

  it('marks everything read', () => {
    state.data = list([approved])
    render(<NotificationBell />)
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(markAllRead).toHaveBeenCalledOnce()
  })

  it('shows an error message when loading fails', () => {
    state.isError = true
    render(<NotificationBell />)
    expect(screen.getByText('Couldn’t load notifications.')).toBeTruthy()
  })
})
