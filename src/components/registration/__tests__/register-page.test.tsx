import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage, type RegistrationApplicant } from '../register-page'

const { getMine, submit, createUpload, signIn } = vi.hoisted(() => ({
  getMine: vi.fn(),
  submit: vi.fn(),
  createUpload: vi.fn(),
  signIn: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  signIn,
}))

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

const path = 'person-1/11111111-1111-4111-8111-111111111111'
const signedUrl = 'https://storage.example.org/signed-upload'
const fetchMock = vi.fn<typeof fetch>()
const clients: QueryClient[] = []

function showPage(applicant?: RegistrationApplicant) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  clients.push(client)
  render(
    <QueryClientProvider client={client}>
      <RegisterPage applicant={applicant} />
    </QueryClientProvider>,
  )
  return client
}

async function chooseYear(label = '2nd Year') {
  fireEvent.click(await screen.findByRole('combobox', { name: 'Year level' }))
  fireEvent.click(await screen.findByRole('option', { name: label }))
}

async function fillForm() {
  await chooseYear()
  fireEvent.change(screen.getByLabelText('Current student profile'), {
    target: { files: [new File(['image'], 'profile.png', { type: 'image/png' })] },
  })
  await screen.findByText('Student Profile uploaded.')
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
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollIntoView',
  )

  beforeAll(() => {
    // The select scrolls its active option into view; jsdom has no layout engine.
    if (!originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: () => {},
      })
    }
  })

  afterAll(() => {
    if (!originalScrollIntoView) Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
  })

  beforeEach(() => {
    getMine.mockReset().mockResolvedValue({ registration: null, canSubmit: true })
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
    expect(screen.queryByLabelText('Year level')).toBeNull()
  })

  it('offers sign-in returning to /register for signed-out visitors', async () => {
    getMine.mockRejectedValue({ data: { code: 'UNAUTHORIZED' }, message: 'private session detail' })
    showPage()
    const signInButton = await screen.findByRole('button', { name: 'Continue with Google' })
    fireEvent.click(signInButton)
    expect(signIn).toHaveBeenCalledWith('google', { redirectTo: '/register' })
    expect(screen.queryByLabelText('Year level')).toBeNull()
    expect(document.body.textContent).not.toContain('private session detail')
  })

  it('shows the registration form and account details after returning signed in', async () => {
    showPage({ name: 'Alex Santos', email: 'alex.santos@example.com' })

    await screen.findByRole('heading', { name: 'Register to vote.' })
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull()
    expect(screen.getByText('Alex Santos')).toBeTruthy()
    expect(screen.getByText('alex.santos@example.com')).toBeTruthy()
    expect(screen.getByLabelText('Year level')).toBeTruthy()
    expect(screen.getByLabelText('Current student profile')).toBeTruthy()
    expect(button().disabled).toBe(true)
  })

  it('provides a safe retry when the initial status read fails', async () => {
    getMine.mockRejectedValue(new Error('private database details'))
    showPage()
    expect((await screen.findByRole('alert')).textContent).toContain('Unable to load')
    expect(document.body.textContent).not.toContain('private database details')
    getMine.mockResolvedValue({ registration: null, canSubmit: true })
    fireEvent.click(button('Try again'))
    await screen.findByLabelText('Year level')
  })

  it('requires both Year Level and a completed upload before submitting', async () => {
    showPage()
    const picker = await screen.findByRole('combobox', { name: 'Year level' })
    expect(button().disabled).toBe(true)
    expect(picker.textContent).toContain('Select your year level')
    fireEvent.click(picker)
    await screen.findByRole('listbox')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '1st Year',
      '2nd Year',
      '3rd Year',
      '4th Year',
    ])
    fireEvent.click(screen.getByRole('option', { name: '2nd Year' }))
    expect(picker.textContent).toContain('2nd Year')
    expect(button().disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Current student profile'), {
      target: { files: [new File(['image'], 'profile.png', { type: 'image/png' })] },
    })
    await screen.findByText('Student Profile uploaded.')
    expect(button().disabled).toBe(false)
  })

  it('opens from the keyboard and restores focus when dismissed with Escape', async () => {
    showPage()
    const picker = await screen.findByRole('combobox', { name: 'Year level' })
    picker.focus()

    fireEvent.keyDown(picker, { key: 'ArrowDown' })
    const menu = await screen.findByRole('listbox')
    expect(picker.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(menu, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(picker))
    expect(picker.textContent).toContain('Select your year level')
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
    expect(screen.getByText('Pending review')).toBeDefined()
    expect(screen.getByText('profile.png')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /view submitted student profile/i })).toBeNull()
    expect(submit).toHaveBeenCalledWith(
      { yearLevel: '2', studentProfilePath: path },
      expect.anything(),
    )
    expect(screen.queryByLabelText('Current student profile')).toBeNull()
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
    expect(
      (screen.getByRole('combobox', { name: 'Year level' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect((screen.getByLabelText('Current student profile') as HTMLInputElement).disabled).toBe(
      true,
    )
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
    ['APPROVED', 'Registration approved.'],
  ])('shows %s read-only, without upload or submission controls', async (status, heading) => {
    getMine.mockResolvedValue({
      canSubmit: true,
      registration: { status, yearLevel: '2', rejectionReason: null },
    })
    showPage()
    await screen.findByRole('heading', { name: heading })
    expect(screen.queryByLabelText('Current student profile')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Submit registration' })).toBeNull()
    expect(screen.getByText('2nd Year')).toBeDefined()
    expect(screen.queryByRole('button', { name: /view submitted student profile/i })).toBeNull()
  })

  it('shows the Admin reason and prefills Year Level when resubmitting a rejection', async () => {
    getMine.mockResolvedValue(rejected())
    showPage()
    await screen.findByText('Please include the current term.')
    expect(screen.getByRole('combobox', { name: 'Year level' }).textContent).toContain('3rd Year')
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
      expect(screen.queryByLabelText('Current student profile')).toBeNull()
      if (registration) expect(screen.getByText('Please include the current term.')).toBeDefined()
    },
  )

  it('prevents stale upload submission after an invalid or failed replacement', async () => {
    showPage()
    await fillForm()
    expect(button().disabled).toBe(false)
    fireEvent.change(screen.getByLabelText('Current student profile'), {
      target: { files: [new File(['pdf'], 'replacement.pdf', { type: 'application/pdf' })] },
    })
    expect(button().disabled).toBe(true)
    expect(screen.getByRole('alert').textContent).toContain('Choose a JPEG')
    await fillForm()
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    fireEvent.change(screen.getByLabelText('Current student profile'), {
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
    expect(screen.queryByLabelText('Current student profile')).toBeNull()
  })

  it('refreshes eligibility after the server rejects a submission because the window closed', async () => {
    submit.mockRejectedValueOnce({ data: { code: 'FORBIDDEN' } })
    showPage()
    await fillForm()
    getMine.mockResolvedValue({ registration: null, canSubmit: false })
    fireEvent.click(button())
    await screen.findByRole('heading', { name: 'Registration closed' })
    expect(screen.queryByLabelText('Current student profile')).toBeNull()
  })

  it('keeps a successful submission read-only if refreshing status fails', async () => {
    showPage()
    await fillForm()
    getMine.mockRejectedValue(new Error('refresh failed'))
    fireEvent.click(button())
    await screen.findByRole('heading', { name: 'Registration submitted.' })
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Unable to refresh'),
    )
    expect(screen.queryByLabelText('Current student profile')).toBeNull()
    expect(submit).toHaveBeenCalledTimes(1)
    getMine.mockResolvedValue({
      canSubmit: true,
      registration: {
        status: 'APPROVED',
        yearLevel: '2',
        rejectionReason: null,
      },
    })
    fireEvent.click(button('Refresh status'))
    await screen.findByRole('heading', { name: 'Registration approved.' })
  })

  it('removes an editing form when refreshed eligibility closes', async () => {
    const client = showPage()
    await fillForm()
    getMine.mockResolvedValue({ registration: null, canSubmit: false })
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['registration', 'getMine'] })
    })
    await screen.findByRole('heading', { name: 'Registration closed' })
    expect(screen.queryByLabelText('Current student profile')).toBeNull()
  })
})
