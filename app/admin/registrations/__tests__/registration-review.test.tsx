import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/trpc/root'
import { RegistrationReview } from '../registration-review'

type Registration = inferRouterOutputs<AppRouter>['admin']['listRegistrations'][number]
type QueryState = {
  data?: Registration[]
  isPending: boolean
  isError: boolean
  isFetching: boolean
  error?: unknown
  refetch: ReturnType<typeof vi.fn>
}
const { state, approve, reject, invalidateQueries } = vi.hoisted(() => ({
  state: {} as { query: QueryState; saving: boolean },
  approve: vi.fn(),
  reject: vi.fn(),
  invalidateQueries: vi.fn(),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => state.query,
  useQueryClient: () => ({ invalidateQueries }),
  useMutation: (options: { kind: string }) => ({
    mutateAsync: options.kind === 'approve' ? approve : reject,
    isPending: state.saving,
  }),
}))
vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    admin: {
      listRegistrations: { queryOptions: () => ({}), queryKey: () => ['listRegistrations'] },
      getRegistrationWindow: { queryKey: () => ['getRegistrationWindow'] },
      approveRegistration: { mutationOptions: () => ({ kind: 'approve' }) },
      rejectRegistration: { mutationOptions: () => ({ kind: 'reject' }) },
    },
  }),
}))
const id = '09a25b2f-c059-45b4-8eb0-36a048d8ad36'
const submittedAt = new Date('2026-11-20T05:58:00Z')
function registration(overrides: Partial<Registration> = {}): Registration {
  return {
    id,
    name: 'Juan Dela Cruz',
    email: '21012345@example.org',
    studentId: '21012345',
    yearLevel: '3',
    status: 'PENDING',
    submittedAt,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    hasHeldBallot: false,
    studentProfileUrl: 'https://storage.example.org/signed-view',
    ocrStatus: 'DONE',
    ocrResult: {
      fields: {
        name: 'Juan de la Cruz',
        studentId: '21012345',
        yearLevel: '2',
        term: '1st Semester 2026',
      },
      matches: { name: true, studentId: true, yearLevel: false, term: true },
    },
    ...overrides,
  }
}
beforeEach(() => {
  approve.mockReset().mockResolvedValue({ ok: true })
  reject.mockReset().mockResolvedValue({ ok: true })
  invalidateQueries.mockReset().mockResolvedValue(undefined)
  state.saving = false
  state.query = {
    data: [registration()],
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

describe('RegistrationReview live API wiring', () => {
  it('shows both OCR values and uses stored fuzzy match flags', () => {
    render(<RegistrationReview />)
    const findings = screen.getByRole('region', { name: 'OCR findings' })
    expect(within(findings).getByText('Juan de la Cruz')).toBeTruthy()
    expect(within(findings).getByText('Juan Dela Cruz')).toBeTruthy()
    expect(within(findings).getAllByText('Match')).toHaveLength(3)
    expect(within(findings).getByText('Doesn’t match')).toBeTruthy()
    expect(
      screen.getAllByAltText('Student profile for Juan Dela Cruz')[0].getAttribute('src'),
    ).toBe('https://storage.example.org/signed-view')
    expect(screen.queryByText(/sample data/i)).toBeNull()
  })
  it.each(['PENDING', 'FAILED'] as const)('keeps decisions available with OCR %s', (ocrStatus) => {
    state.query.data = [registration({ ocrStatus, ocrResult: null })]
    render(<RegistrationReview />)
    expect(
      screen.getByText(
        ocrStatus === 'PENDING'
          ? 'Reading the student profile. You can review the image now.'
          : 'No OCR findings are available. Review the student profile manually.',
      ),
    ).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Approve registration' }) as HTMLButtonElement).disabled,
    ).toBe(false)
  })
  it('submits corrected Year Level and submission version, then refreshes the queue', async () => {
    render(<RegistrationReview />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Year level on approval' }), {
      target: { value: '2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Approve registration' }))
    await waitFor(() => expect(approve).toHaveBeenCalledWith({ id, yearLevel: '2', submittedAt }))
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'Juan Dela Cruz approved for Year 2',
      ),
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['listRegistrations'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['getRegistrationWindow'] })
    expect(reject).not.toHaveBeenCalled()
  })
  it('requires a trimmed reason and calls rejection without OCR fields', async () => {
    render(<RegistrationReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(reject).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('Enter a reason')
    fireEvent.change(screen.getByRole('textbox', { name: /Rejection reason/ }), {
      target: { value: '  Readable current profile required  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await waitFor(() =>
      expect(reject).toHaveBeenCalledWith({
        id,
        reason: 'Readable current profile required',
        submittedAt,
      }),
    )
  })
  it('does not announce success or clear a rejection draft on failure', async () => {
    reject.mockRejectedValueOnce(new Error('private failure'))
    render(<RegistrationReview />)
    const reason = screen.getByRole('textbox', { name: /Rejection reason/ }) as HTMLTextAreaElement
    fireEvent.change(reason, { target: { value: 'Unreadable' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Unable to save the review'),
    )
    expect(screen.getByRole('status').textContent).toBe('')
    expect(reason.value).toBe('Unreadable')
  })
  it('refreshes and shows a safe conflict when another Admin already reviewed', async () => {
    approve.mockRejectedValueOnce({ data: { code: 'CONFLICT' }, message: 'private detail' })
    render(<RegistrationReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve registration' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('already reviewed'))
    expect(screen.queryByText('private detail')).toBeNull()
    expect(invalidateQueries).toHaveBeenCalled()
  })
  it('disables both decisions while either is saving', () => {
    state.saving = true
    render(<RegistrationReview />)
    expect(
      (screen.getByRole('button', { name: 'Approve registration' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect((screen.getByRole('button', { name: 'Reject' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
  })
  it('shows loading without stale records', () => {
    state.query.isPending = true
    render(<RegistrationReview />)
    expect(screen.getByRole('status').textContent).toBe('Loading registrations…')
    expect(screen.queryByRole('button', { name: 'Approve registration' })).toBeNull()
  })
  it.each(['UNAUTHORIZED', 'FORBIDDEN'])('hides stale cached records after %s', (code) => {
    state.query.isError = true
    state.query.error = { data: { code } }
    render(<RegistrationReview />)
    expect(screen.getByRole('alert').textContent).toBe("You don't have Admin access.")
    expect(screen.queryByText('Juan Dela Cruz')).toBeNull()
  })
  it('provides Retry for query errors', () => {
    state.query.isError = true
    render(<RegistrationReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(state.query.refetch).toHaveBeenCalled()
  })
  it('supports an empty queue', () => {
    state.query.data = []
    render(<RegistrationReview />)
    expect(screen.getByText('No applications match these filters.')).toBeTruthy()
  })
  it('refreshes missing documents instead of rendering a broken image', () => {
    state.query.data = [registration({ studentProfileUrl: null })]
    render(<RegistrationReview />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Refresh document' })[0])
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['listRegistrations'] })
  })
  it('shows held priority and stored review metadata', () => {
    state.query.data = [
      registration({
        status: 'APPROVED',
        reviewedBy: 'chair@example.org',
        reviewedAt: new Date('2026-11-20T06:00:00Z'),
      }),
    ]
    render(<RegistrationReview />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'APPROVED' },
    })
    expect(screen.getByText(/Reviewed by chair@example.org/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Approve registration' })).toBeNull()
  })
})
