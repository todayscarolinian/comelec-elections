import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from '../register-page'

const { getMine, submit, createUpload, signIn } = vi.hoisted(() => ({
  getMine: vi.fn(),
  submit: vi.fn(),
  createUpload: vi.fn(),
  signIn: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ signIn }))

vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    registration: {
      getMine: {
        queryOptions: () => ({ queryKey: ['registration', 'getMine'], queryFn: getMine }),
      },
      submit: { mutationOptions: () => ({ mutationFn: submit }) },
      createStudentProfileUpload: { mutationOptions: () => ({ mutationFn: createUpload }) },
    },
  }),
}))

const account = { name: 'Alex Santos', email: 'alex.santos@example.org' }
const path = 'person-1/11111111-1111-4111-8111-111111111111'
const signedUrl = 'https://storage.example.org/signed-upload'
const fetchMock = vi.fn<typeof fetch>()
const clients: QueryClient[] = []

function showPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  clients.push(client)
  render(
    <QueryClientProvider client={client}>
      <RegisterPage />
    </QueryClientProvider>,
  )
  return client
}

async function fillForm() {
  fireEvent.change(await screen.findByLabelText('Year Level'), { target: { value: '2' } })
  fireEvent.change(screen.getByLabelText('Student Profile'), {
    target: { files: [new File(['image'], 'profile.png', { type: 'image/png' })] },
  })
  await screen.findByText('profile.png')
}

function button(label = 'Submit registration') {
  return screen.getByRole('button', { name: label }) as HTMLButtonElement
}

function rejected(canSubmit = true) {
  return {
    canSubmit,
    registration: {
      status: 'REJECTED',
      yearLevel: '3',
      rejectionReason: 'Please include the current term.',
    },
  }
}

describe('RegisterPage', () => {
  beforeEach(() => {
    getMine.mockReset().mockResolvedValue({ account, registration: null, canSubmit: true })
    submit.mockReset().mockResolvedValue({ status: 'PENDING' })
    createUpload.mockReset().mockResolvedValue({ path, signedUrl })
    signIn.mockReset().mockResolvedValue(undefined)
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    clients.splice(0).forEach((client) => client.clear())
    vi.unstubAllGlobals()
  })

  it('shows loading without exposing a form before eligibility is known', () => {
    getMine.mockReturnValue(new Promise(() => {}))
    showPage()
    expect(screen.getByRole('status').textContent).toContain('Loading registration')
    expect(screen.queryByLabelText('Year Level')).toBeNull()
  })

  it('offers sign-in returning to /register for signed-out visitors', async () => {
    getMine.mockRejectedValue({ data: { code: 'UNAUTHORIZED' }, message: 'private session detail' })
    showPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Continue with Google' }))
    expect(signIn).toHaveBeenCalledWith('google', { redirectTo: '/register' })
    expect(screen.queryByLabelText('Year Level')).toBeNull()
    expect(document.body.textContent).not.toContain('private session detail')
  })

  it('provides a safe retry when the initial status read fails', async () => {
    getMine.mockRejectedValue(new Error('private database details'))
    showPage()
    expect((await screen.findByRole('alert')).textContent).toContain('Unable to load')
    expect(document.body.textContent).not.toContain('private database details')
    getMine.mockResolvedValue({ registration: null, canSubmit: true })
    fireEvent.click(button('Try again'))
    await screen.findByLabelText('Year Level')
  })

  it('requires both Year Level and a completed upload before submitting', async () => {
    showPage()
    await screen.findByLabelText('Year Level')
    expect(screen.getByText(account.name)).toBeDefined()
    expect(screen.getByText(account.email)).toBeDefined()
    expect(button().disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Year Level'), { target: { value: '2' } })
    expect(button().disabled).toBe(true)
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Choose your Year Level',
      '1st Year',
      '2nd Year',
      '3rd Year',
      '4th Year',
    ])
    await fillForm()
    expect(button().disabled).toBe(false)
  })

  it('links to the Terms of Service and Privacy Policy next to the submit button', async () => {
    showPage()
    await screen.findByLabelText('Year Level')
    expect(screen.getByRole('link', { name: 'Terms of Service' }).getAttribute('href')).toBe(
      '/terms',
    )
    expect(screen.getByRole('link', { name: 'Privacy Policy' }).getAttribute('href')).toBe(
      '/privacy',
    )
  })

  it('submits the selected Year Level and uploaded path, then shows pending review', async () => {
    showPage()
    await fillForm()
    getMine.mockResolvedValue({
      canSubmit: true,
      registration: {
        status: 'PENDING',
        yearLevel: '2',
        rejectionReason: null,
      },
    })
    fireEvent.click(button())
    await screen.findByRole('heading', { name: 'Registration submitted.' })
    expect(submit).toHaveBeenCalledWith(
      { yearLevel: '2', studentProfilePath: path },
      expect.anything(),
    )
    expect(screen.queryByLabelText('Student Profile')).toBeNull()
  })

  it('locks the form during submission and rejects a second click', async () => {
    let finish!: (value: { status: string }) => void
    submit.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    showPage()
    await fillForm()
    fireEvent.click(button())
    await waitFor(() => expect(button('Submitting…').disabled).toBe(true))
    expect((screen.getByLabelText('Year Level') as HTMLSelectElement).disabled).toBe(true)
    expect((screen.getByLabelText('Student Profile') as HTMLInputElement).disabled).toBe(true)
    fireEvent.click(button('Submitting…'))
    expect(submit).toHaveBeenCalledTimes(1)
    getMine.mockResolvedValue({
      canSubmit: true,
      registration: {
        status: 'PENDING',
        yearLevel: '2',
        rejectionReason: null,
      },
    })
    await act(async () => {
      finish({ status: 'PENDING' })
    })
    await screen.findByRole('heading', { name: 'Registration submitted.' })
  })

  it.each([
    ['PENDING', 'Registration submitted.'],
    ['APPROVED', 'Registration approved'],
  ])('shows %s read-only, without upload or submission controls', async (status, heading) => {
    getMine.mockResolvedValue({
      canSubmit: true,
      registration: { status, yearLevel: '2', rejectionReason: null },
    })
    showPage()
    await screen.findByRole('heading', { name: heading })
    expect(screen.queryByLabelText('Student Profile')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Submit registration' })).toBeNull()
    expect(screen.getByText('2nd Year')).toBeDefined()
  })

  it('shows the Admin reason and prefills Year Level when resubmitting a rejection', async () => {
    getMine.mockResolvedValue(rejected())
    showPage()
    await screen.findByText('Please include the current term.')
    expect((screen.getByLabelText('Year Level') as HTMLSelectElement).value).toBe('3')
    expect(button('Resubmit registration').disabled).toBe(true)
    await fillForm()
    getMine.mockResolvedValue({
      canSubmit: true,
      registration: {
        status: 'PENDING',
        yearLevel: '2',
        rejectionReason: null,
      },
    })
    fireEvent.click(button('Resubmit registration'))
    await screen.findByRole('heading', { name: 'Registration submitted.' })
    expect(screen.queryByText('Please include the current term.')).toBeNull()
  })

  it.each([null, rejected(false).registration])(
    'hides submission controls when closed and preserves existing status',
    async (registration) => {
      getMine.mockResolvedValue({ registration, canSubmit: false })
      showPage()
      await screen.findByRole('heading', { name: 'Registration closed' })
      expect(screen.queryByLabelText('Student Profile')).toBeNull()
      if (registration) expect(screen.getByText('Please include the current term.')).toBeDefined()
    },
  )

  it('prevents stale upload submission after an invalid or failed replacement', async () => {
    showPage()
    await fillForm()
    expect(button().disabled).toBe(false)
    fireEvent.change(screen.getByLabelText('Student Profile'), {
      target: { files: [new File(['pdf'], 'replacement.pdf', { type: 'application/pdf' })] },
    })
    expect(button().disabled).toBe(true)
    expect(screen.getByRole('alert').textContent).toContain('Choose a JPEG')
    await fillForm()
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    fireEvent.change(screen.getByLabelText('Student Profile'), {
      target: { files: [new File(['image'], 'replacement.png', { type: 'image/png' })] },
    })
    await screen.findByRole('alert')
    expect(button().disabled).toBe(true)
    expect(submit).not.toHaveBeenCalled()
  })

  it('shows a safe submission error and allows retry', async () => {
    submit.mockRejectedValueOnce(new Error('private backend detail'))
    showPage()
    await fillForm()
    fireEvent.click(button())
    expect((await screen.findByRole('alert')).textContent).toContain('Unable to submit')
    expect(document.body.textContent).not.toContain('private backend detail')
    expect(button().disabled).toBe(false)
  })

  it('offers sign-in again if the session expires during submission', async () => {
    submit.mockRejectedValueOnce({ data: { code: 'UNAUTHORIZED' } })
    showPage()
    await fillForm()
    fireEvent.click(button())
    await screen.findByRole('button', { name: 'Continue with Google' })
    expect(screen.queryByLabelText('Student Profile')).toBeNull()
  })

  it('refreshes eligibility after the server rejects a submission because the window closed', async () => {
    submit.mockRejectedValueOnce({ data: { code: 'FORBIDDEN' } })
    showPage()
    await fillForm()
    getMine.mockResolvedValue({ registration: null, canSubmit: false })
    fireEvent.click(button())
    await screen.findByRole('heading', { name: 'Registration closed' })
    expect(screen.queryByLabelText('Student Profile')).toBeNull()
  })

  it('keeps a successful submission read-only if refreshing status fails', async () => {
    const client = showPage()
    await fillForm()
    getMine.mockRejectedValue(new Error('refresh failed'))
    fireEvent.click(button())
    await screen.findByRole('heading', { name: 'Registration submitted.' })
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Unable to refresh'),
    )
    expect(screen.queryByLabelText('Student Profile')).toBeNull()
    expect(submit).toHaveBeenCalledTimes(1)
    getMine.mockResolvedValue({
      canSubmit: true,
      registration: {
        status: 'APPROVED',
        yearLevel: '2',
        rejectionReason: null,
      },
    })
    expect(screen.queryByRole('button', { name: 'Refresh status' })).toBeNull()
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['registration', 'getMine'] })
    })
    await screen.findByRole('heading', { name: 'Registration approved' })
  })

  it('removes an editing form when refreshed eligibility closes', async () => {
    const client = showPage()
    await fillForm()
    getMine.mockResolvedValue({ registration: null, canSubmit: false })
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['registration', 'getMine'] })
    })
    await screen.findByRole('heading', { name: 'Registration closed' })
    expect(screen.queryByLabelText('Student Profile')).toBeNull()
  })
})
