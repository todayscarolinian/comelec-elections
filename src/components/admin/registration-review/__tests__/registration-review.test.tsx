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
const { state, approve, reject, invalidateQueries, listQueryOptions } = vi.hoisted(() => ({
  state: {} as { query: QueryState; saving: boolean; pendingCount?: number },
  listQueryOptions: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  invalidateQueries: vi.fn(),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { kind: string; input?: { status?: string; yearLevel?: string } }) => {
    if (options.kind === 'window')
      return {
        data: {
          pendingCount:
            state.pendingCount ??
            state.query.data?.filter((item) => item.status === 'PENDING').length ??
            0,
        },
      }
    return {
      ...state.query,
      data: state.query.data?.filter(
        (item) =>
          (!options.input?.status || item.status === options.input.status) &&
          (!options.input?.yearLevel || item.yearLevel === options.input.yearLevel),
      ),
    }
  },
  useQueryClient: () => ({ invalidateQueries }),
  useMutation: (options: { kind: string }) => ({
    mutateAsync: options.kind === 'approve' ? approve : reject,
    isPending: state.saving,
  }),
}))
vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    admin: {
      listRegistrations: {
        queryOptions: (input: unknown) => {
          listQueryOptions(input)
          return { kind: 'list', input }
        },
        queryKey: () => ['listRegistrations'],
      },
      getRegistrationWindow: {
        queryOptions: () => ({ kind: 'window' }),
        queryKey: () => ['getRegistrationWindow'],
      },
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
  listQueryOptions.mockClear()
  state.pendingCount = undefined
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
  it('requests only the pending queue by default', () => {
    render(<RegistrationReview />)
    expect(listQueryOptions).toHaveBeenLastCalledWith({ status: 'PENDING' })
  })
  it('sends status and Year Level filters to the server, including explicit All choices', () => {
    state.query.data = [
      registration(),
      registration({ id: 'second', status: 'APPROVED', yearLevel: '2' }),
    ]
    render(<RegistrationReview />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'APPROVED' },
    })
    expect(listQueryOptions).toHaveBeenLastCalledWith({ status: 'APPROVED' })
    fireEvent.change(screen.getByRole('combobox', { name: /^Year level$/ }), {
      target: { value: '2' },
    })
    expect(listQueryOptions).toHaveBeenLastCalledWith({ status: 'APPROVED', yearLevel: '2' })
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'ALL' } })
    expect(listQueryOptions).toHaveBeenLastCalledWith({ yearLevel: '2' })
    fireEvent.change(screen.getByRole('combobox', { name: /^Year level$/ }), {
      target: { value: 'ALL' },
    })
    expect(listQueryOptions).toHaveBeenLastCalledWith({})
  })
  it('gets total pending count independently of the signed queue filter', () => {
    state.pendingCount = 12
    state.query.data = [registration({ status: 'APPROVED' })]
    render(<RegistrationReview />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'APPROVED' },
    })
    expect(screen.getByText('12 applications awaiting review')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Pending (12)' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Approved' })).toBeTruthy()
  })
  it('keeps name search local without broadening the server query', () => {
    render(<RegistrationReview />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search applicants' }), {
      target: { value: 'no match' },
    })
    expect(screen.getByText('No applications match these filters.')).toBeTruthy()
    expect(listQueryOptions).toHaveBeenLastCalledWith({ status: 'PENDING' })
  })
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
  it.each([
    [{}, /OCR: 1 field doesn’t match/],
    [
      {
        ocrResult: {
          fields: { name: 'Juan Dela Cruz', studentId: '21012345', yearLevel: '3', term: 'x' },
          matches: { name: true, studentId: true, yearLevel: true, term: true },
        },
      },
      /OCR: all fields match/,
    ],
    [{ ocrStatus: 'PENDING' as const, ocrResult: null }, /OCR pending/],
    [{ ocrStatus: 'FAILED' as const, ocrResult: null }, /OCR unavailable/],
  ])('shows the OCR state on the queue row (%#)', (overrides, name) => {
    state.query.data = [registration(overrides)]
    render(<RegistrationReview />)
    expect(screen.getByRole('button', { name })).toBeTruthy()
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
  it('keeps cached records hidden after a denied refresh until a refresh succeeds', () => {
    const { rerender } = render(<RegistrationReview />)
    state.query.isError = true
    state.query.error = { data: { code: 'FORBIDDEN' } }
    rerender(<RegistrationReview />)

    state.query.error = new Error('Temporary outage')
    rerender(<RegistrationReview />)
    expect(screen.queryByRole('heading', { name: 'Juan Dela Cruz' })).toBeNull()

    state.query.isError = false
    rerender(<RegistrationReview />)
    expect(screen.getByRole('heading', { name: 'Juan Dela Cruz' })).toBeTruthy()
  })
  it('provides Retry for query errors', () => {
    state.query.isError = true
    state.query.data = undefined
    render(<RegistrationReview />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(state.query.refetch).toHaveBeenCalled()
  })
  it('keeps the active rejection draft when a background refresh fails', () => {
    const { rerender } = render(<RegistrationReview />)
    const reason = screen.getByRole<HTMLTextAreaElement>('textbox', { name: /Rejection reason/ })
    fireEvent.change(reason, { target: { value: 'Unreadable' } })

    state.query.isError = true
    state.query.error = new Error('Temporary outage')
    rerender(<RegistrationReview />)

    expect(screen.getByRole('alert').textContent).toContain('Unable to refresh registrations')
    expect(screen.getByRole('textbox', { name: /Rejection reason/ })).toBe(reason)
    expect(reason.value).toBe('Unreadable')
  })
  it('does not allow a second decision after saving if the queue refresh fails', async () => {
    const { rerender } = render(<RegistrationReview />)
    invalidateQueries.mockImplementationOnce(async () => {
      state.query.isError = true
      state.query.error = new Error('Temporary outage')
      rerender(<RegistrationReview />)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Approve registration' }))

    await screen.findByText('Juan Dela Cruz approved for Year 3.')
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Approve registration' })
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(approve).toHaveBeenCalledTimes(1)
  })
  it('keeps the same applicant and draft when a refresh moves them to another page', () => {
    const selected = registration({ id: 'page-two', name: 'Page Two Applicant' })
    const rows = Array.from({ length: 9 }, (_, i) =>
      registration({ id: `row-${i}`, name: `Applicant ${i}` }),
    )
    state.query.data = [...rows, selected]
    const { rerender } = render(<RegistrationReview />)
    fireEvent.click(screen.getByRole('button', { name: /Next applicants/ }))
    fireEvent.click(screen.getByRole('button', { name: /Page Two Applicant/ }))
    const reason = screen.getByRole<HTMLTextAreaElement>('textbox', { name: /Rejection reason/ })
    fireEvent.change(reason, { target: { value: 'Unreadable' } })

    state.query.data = [registration({ hasHeldBallot: true }), ...rows, selected]
    rerender(<RegistrationReview />)

    expect(screen.getByRole('heading', { name: 'Page Two Applicant' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /Rejection reason/ })).toBe(reason)
    expect(reason.value).toBe('Unreadable')

    state.query.data = rows
    rerender(<RegistrationReview />)
    expect(screen.queryByRole('button', { name: 'Approve registration' })).toBeNull()
    expect(screen.getByText('This application is no longer in this queue.')).toBeTruthy()

    state.query.data = [...rows, selected]
    rerender(<RegistrationReview />)
    expect(screen.getByRole('main').classList.contains('is-detail')).toBe(false)
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
  it('keeps both images stable across URL renewal and uses the new URL after a load failure', () => {
    const { rerender } = render(<RegistrationReview />)
    const alt = 'Student profile for Juan Dela Cruz'
    const images = screen.getAllByAltText(alt)
    const renewedUrl = 'https://storage.example.org/renewed-view'

    state.query.data = [registration({ studentProfileUrl: renewedUrl })]
    rerender(<RegistrationReview />)

    const refreshedImages = screen.getAllByAltText(alt)
    expect(refreshedImages[0]).toBe(images[0])
    expect(refreshedImages[1]).toBe(images[1])
    expect(images[0].getAttribute('src')).toBe('https://storage.example.org/signed-view')
    fireEvent.error(images[0])
    expect(screen.getAllByAltText(alt)[0].getAttribute('src')).toBe(renewedUrl)

    const replacementUrl = 'https://storage.example.org/replacement-view'
    state.query.data = [
      registration({
        submittedAt: new Date('2026-11-20T06:00:00Z'),
        studentProfileUrl: replacementUrl,
      }),
    ]
    rerender(<RegistrationReview />)
    expect(screen.getAllByAltText(alt).map((image) => image.getAttribute('src'))).toEqual([
      replacementUrl,
      replacementUrl,
    ])
  })
  it('shows held ballot status without priority on a rejected application', () => {
    state.query.data = [registration({ status: 'REJECTED', hasHeldBallot: true })]
    render(<RegistrationReview />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'REJECTED' },
    })
    expect(screen.getByRole('button', { name: /Held Ballot/ })).toBeTruthy()
    expect(screen.queryByText('Held Ballot · priority review')).toBeNull()
  })
  it('shows stored review metadata', () => {
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
