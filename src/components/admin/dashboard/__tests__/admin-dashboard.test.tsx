import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import type { inferRouterOutputs } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppRouter } from '@/server/trpc/root'

type Dashboard = inferRouterOutputs<AppRouter>['admin']['getDashboard']

const { state, setElection, setRegistration } = vi.hoisted(() => ({
  state: { data: undefined as unknown },
  setElection: vi.fn(),
  setRegistration: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: state.data,
    isPending: false,
    isError: false,
    dataUpdatedAt: new Date('2026-11-24T06:14:00Z').getTime(),
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: { kind: string }) => ({
    mutateAsync: options.kind === 'election' ? setElection : setRegistration,
    isPending: false,
  }),
}))
vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    admin: {
      getDashboard: { queryOptions: () => ({}), queryKey: () => ['dashboard'] },
      getRegistrationWindow: { queryKey: () => ['window'] },
      setElectionStatus: { mutationOptions: () => ({ kind: 'election' }) },
      setRegistrationStatus: { mutationOptions: () => ({ kind: 'registration' }) },
    },
  }),
}))

import { AdminDashboard } from '../admin-dashboard'

function dashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    phase: 'VOTING_OPEN',
    electionStatus: 'OPEN',
    registrationStatus: 'CLOSED',
    resultsReleasedAt: null,
    votingClosedAt: null,
    ballotCount: 869,
    registrations: { pending: 37, approved: 2140, rejected: 52, total: 2229 },
    pendingPreview: [
      { id: 'r1', name: 'Juan Dela Cruz', email: '21012345@example.org', yearLevel: '3' },
    ],
    recentActivity: [
      {
        id: 'a1',
        adminEmail: 'chair@example.org',
        action: 'VIEW_BALLOTS',
        target: null,
        detail: null,
        at: new Date('2026-11-24T06:12:00Z'),
      },
    ],
    turnoutBySchool: [
      { school: 'SAFAD', label: 'SAFAD', counted: 512, heldPending: 2, heldRejected: 1 },
      { school: 'SAS', label: 'SAS', counted: 1200, heldPending: 0, heldRejected: 0 },
      { school: 'SBE', label: 'SBE', counted: 0, heldPending: 0, heldRejected: 0 },
      { school: null, label: 'Not recorded', counted: 41, heldPending: 0, heldRejected: 1 },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false
  }
})

describe('AdminDashboard', () => {
  it('shows live counts, the queue preview and recent activity', () => {
    state.data = dashboard()
    render(<AdminDashboard />)

    expect(screen.getByRole('heading', { name: 'Voting is open.' })).toBeTruthy()
    expect(screen.getByText('869')).toBeTruthy()
    expect(screen.getByText('2,140')).toBeTruthy()
    expect(screen.getByText('52 rejected · 2,229 registrations')).toBeTruthy()
    expect(screen.getByText('Juan Dela Cruz')).toBeTruthy()
    expect(screen.getByText('Viewed ballot audit')).toBeTruthy()
    expect(screen.getByRole('link', { name: /View admin results/ }).getAttribute('href')).toBe(
      '/admin/results',
    )
  })

  it.each([
    ['BEFORE_VOTING', 'CLOSED', 'Before voting.', 'Open election'],
    ['VOTING_OPEN', 'OPEN', 'Voting is open.', 'Close election'],
    ['VOTING_CLOSED', 'CLOSED', 'Voting is closed.', 'Reopen election'],
  ] as const)('%s offers %s', (phase, electionStatus, title, action) => {
    state.data = dashboard({ phase, electionStatus })
    render(<AdminDashboard />)

    expect(screen.getByRole('heading', { name: title })).toBeTruthy()
    expect((screen.getByRole('button', { name: action }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows turnout by School, including Schools with no ballots and unrecorded ones', () => {
    state.data = dashboard()
    render(<AdminDashboard />)
    const table = screen.getByRole('table')
    const rows = within(table)
      .getAllByRole('row')
      .slice(1)
      .map((row) => [...row.querySelectorAll('th, td')].map((cell) => cell.textContent))
    expect(rows).toEqual([
      ['SAFAD', '512', '3'],
      ['SAS', '1,200', '0'],
      ['SBE', '0', '0'],
      ['Not recorded', '41', '1'],
    ])
  })

  it('locks reopening once results are released', () => {
    state.data = dashboard({
      phase: 'RELEASED',
      electionStatus: 'CLOSED',
      resultsReleasedAt: new Date('2026-11-24T10:00:00Z'),
    })
    render(<AdminDashboard />)

    expect(screen.getByRole('heading', { name: 'Election complete.' })).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Reopening locked' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.getByText('Public')).toBeTruthy()
    expect(screen.getByRole('link', { name: /View public results/ }).getAttribute('href')).toBe(
      '/results',
    )
  })

  it('confirms before closing the election', async () => {
    setElection.mockResolvedValue({ electionStatus: 'CLOSED' })
    state.data = dashboard()
    render(<AdminDashboard />)

    fireEvent.click(screen.getByRole('button', { name: 'Close election' }))
    expect(setElection).not.toHaveBeenCalled()
    const buttons = screen.getAllByRole('button', { name: 'Close election', hidden: true })
    fireEvent.click(buttons[buttons.length - 1])

    await waitFor(() => expect(setElection).toHaveBeenCalledWith({ status: 'CLOSED' }))
  })

  it('toggles the registration window only before voting', () => {
    setRegistration.mockResolvedValue({ registrationStatus: 'OPEN' })
    state.data = dashboard({ phase: 'BEFORE_VOTING', electionStatus: 'CLOSED' })
    const { unmount } = render(<AdminDashboard />)

    fireEvent.click(screen.getByRole('button', { name: /Open registration/ }))
    expect(setRegistration).toHaveBeenCalledWith({ status: 'OPEN' })
    unmount()

    state.data = dashboard()
    render(<AdminDashboard />)
    expect(screen.queryByRole('button', { name: /registration/i })).toBeNull()
    expect(screen.getByText('Reviews remain available')).toBeTruthy()
  })
})
