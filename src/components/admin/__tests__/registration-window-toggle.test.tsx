import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegistrationWindowToggle } from '../registration-window-toggle'

type QueryState = {
  isPending: boolean
  isError: boolean
  error: unknown
  data?: { registrationStatus: 'OPEN' | 'CLOSED'; pendingCount: number }
}

type MutationState = {
  mutate: ReturnType<typeof vi.fn>
  isPending: boolean
  isError: boolean
  error: unknown
}

const { state, invalidateQueries } = vi.hoisted(() => ({
  state: {} as { query: QueryState; mutation: MutationState; onSuccess?: () => unknown },
  invalidateQueries: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => state.query,
  useMutation: () => state.mutation,
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    admin: {
      getRegistrationWindow: {
        queryOptions: () => ({}),
        queryKey: () => ['admin', 'getRegistrationWindow'],
      },
      setRegistrationStatus: {
        mutationOptions: (opts: { onSuccess: () => unknown }) => {
          state.onSuccess = opts.onSuccess
          return {}
        },
      },
    },
  }),
}))

function loaded(registrationStatus: 'OPEN' | 'CLOSED', pendingCount: number): QueryState {
  return {
    isPending: false,
    isError: false,
    error: null,
    data: { registrationStatus, pendingCount },
  }
}

describe('RegistrationWindowToggle', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    state.query = loaded('CLOSED', 0)
    state.mutation = { mutate: vi.fn(), isPending: false, isError: false, error: null }
  })

  it('shows the closed window with its pending count and opens it', () => {
    state.query = loaded('CLOSED', 4)
    render(<RegistrationWindowToggle />)

    expect(screen.getByText('Registration is closed.')).toBeTruthy()
    expect(screen.getByText('4 pending Registrations')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Open Registration' }))

    expect(state.mutation.mutate).toHaveBeenCalledWith({ status: 'OPEN' })
  })

  it('shows the open window and closes it', () => {
    state.query = loaded('OPEN', 1)
    render(<RegistrationWindowToggle />)

    expect(screen.getByText('Registration is open.')).toBeTruthy()
    expect(screen.getByText('1 pending Registration')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Close Registration' }))

    expect(state.mutation.mutate).toHaveBeenCalledWith({ status: 'CLOSED' })
  })

  it('disables the button while the change is saving', () => {
    state.mutation.isPending = true
    render(<RegistrationWindowToggle />)

    expect(
      (screen.getByRole('button', { name: 'Open Registration' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('refreshes the window after a change', async () => {
    render(<RegistrationWindowToggle />)

    await state.onSuccess?.()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin', 'getRegistrationWindow'],
    })
  })

  it('shows a loading state', () => {
    state.query = { isPending: true, isError: false, error: null }
    render(<RegistrationWindowToggle />)

    expect(screen.getByRole('status').textContent).toBe('Loading Registration window...')
  })

  it.each(['FORBIDDEN', 'UNAUTHORIZED'])('tells %s callers they lack Admin access', (code) => {
    state.query = { isPending: false, isError: true, error: { data: { code } } }
    render(<RegistrationWindowToggle />)

    expect(screen.getByRole('alert').textContent).toBe("You don't have Admin access.")
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows an alert when the change fails', () => {
    state.mutation.isError = true
    state.mutation.error = { data: { code: 'INTERNAL_SERVER_ERROR' } }
    render(<RegistrationWindowToggle />)

    expect(screen.getByRole('alert').textContent).toBe(
      'Unable to update the Registration window. Please try again.',
    )
  })
})
