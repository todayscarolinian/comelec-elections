import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { STUDENT_PROFILE_MAX_BYTES } from '@/lib/student-profile'
import { StudentProfileUpload } from '../student-profile-upload'

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }))

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync }),
}))

vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    registration: {
      createStudentProfileUpload: {
        mutationOptions: () => ({}),
      },
    },
  }),
}))

const fetchMock = vi.fn<typeof fetch>()
const signedUrl = 'https://storage.example.org/signed-upload'
const studentProfilePath = 'person-1/11111111-1111-4111-8111-111111111111'

function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText('Student Profile'), {
    target: { files: [file] },
  })
}

describe('StudentProfileUpload', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear()
    mutateAsync.mockReset()
    mutateAsync.mockResolvedValue({ path: studentProfilePath, signedUrl })
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['JPEG', 'image/jpeg', 'student-profile.jpg'],
    ['PNG', 'image/png', 'student-profile.png'],
    ['WebP', 'image/webp', 'student-profile.webp'],
  ])('uploads a supported %s image directly to Storage', async (_, type, name) => {
    const onUploaded = vi.fn()
    render(<StudentProfileUpload onUploaded={onUploaded} />)
    const file = new File(['image'], name, { type })

    selectFile(file)

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(studentProfilePath))
    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': type },
      body: file,
    })
    expect(screen.getByText(name)).toBeTruthy()
    expect(toast.success).toHaveBeenCalledExactlyOnceWith('Student Profile uploaded', {
      description: name,
    })
  })

  it('describes the upload and guides students through the ISMIS tutorial', () => {
    render(<StudentProfileUpload onUploaded={vi.fn()} />)

    const input = screen.getByLabelText('Student Profile')
    const hint = document.getElementById(input.getAttribute('aria-describedby') ?? '')

    const help = screen.getByRole('button', { name: 'Where do I find my Student Profile?' })
    const dialog = screen.getByRole('dialog', { hidden: true }) as HTMLDialogElement
    // jsdom does not implement the native dialog methods.
    Object.assign(dialog, {
      showModal: () => {
        dialog.open = true
      },
      close: () => {
        dialog.open = false
      },
    })

    expect(hint?.textContent).toContain('Make sure your name and current enrollment are readable.')
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(help)
    expect(screen.getByRole('dialog', { name: 'Log in to ISMIS' })).toBe(dialog)
    const tutorial = within(dialog)

    fireEvent.click(tutorial.getByRole('button', { name: 'Next' }))
    expect(tutorial.getByRole('heading', { name: 'Open My Profile' })).toBeTruthy()
    fireEvent.click(tutorial.getByRole('button', { name: 'Back' }))
    expect(tutorial.getByRole('heading', { name: 'Log in to ISMIS' })).toBeTruthy()
    fireEvent.click(tutorial.getByRole('button', { name: 'Next' }))
    fireEvent.click(tutorial.getByRole('button', { name: 'Next' }))
    expect(tutorial.getByRole('heading', { name: 'Take a screenshot' })).toBeTruthy()
    fireEvent.click(tutorial.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mutateAsync).not.toHaveBeenCalled()

    fireEvent.click(help)
    expect(screen.getByRole('dialog', { name: 'Log in to ISMIS' })).toBeTruthy()
  })

  it('uploads an image dropped on the file picker', async () => {
    const onUploaded = vi.fn()
    render(<StudentProfileUpload onUploaded={onUploaded} />)
    const file = new File(['image'], 'profile.png', { type: 'image/png' })

    fireEvent.drop(screen.getByLabelText('Student Profile'), { dataTransfer: { files: [file] } })

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(studentProfilePath))
    expect(screen.getByText('profile.png')).toBeDefined()
  })

  it('rejects an unsupported file type before requesting an upload', () => {
    render(<StudentProfileUpload onUploaded={vi.fn()} />)

    selectFile(new File(['document'], 'student-profile.pdf', { type: 'application/pdf' }))

    expect(screen.getByRole('alert').textContent).toBe('Choose a JPEG, PNG, or WebP image.')
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a file exactly 5 MB in size', async () => {
    const onUploaded = vi.fn()
    render(<StudentProfileUpload onUploaded={onUploaded} />)

    selectFile(
      new File([new Uint8Array(STUDENT_PROFILE_MAX_BYTES)], 'student-profile.jpg', {
        type: 'image/jpeg',
      }),
    )

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(studentProfilePath))
    expect(mutateAsync).toHaveBeenCalledTimes(1)
  })

  it('rejects a file larger than 5 MB before requesting an upload', () => {
    render(<StudentProfileUpload onUploaded={vi.fn()} />)

    selectFile(
      new File([new Uint8Array(STUDENT_PROFILE_MAX_BYTES + 1)], 'student-profile.jpg', {
        type: 'image/jpeg',
      }),
    )

    expect(screen.getByRole('alert').textContent).toBe('Student Profile must be 5 MB or smaller.')
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a safe error when the direct Storage upload fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    const onUploaded = vi.fn()
    render(<StudentProfileUpload onUploaded={onUploaded} />)

    selectFile(new File(['image'], 'student-profile.png', { type: 'image/png' }))

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Unable to upload the Student Profile. Please try again.',
    )
    expect(onUploaded).not.toHaveBeenCalled()
  })

  it('does not render the signed URL or object path', async () => {
    const onUploaded = vi.fn()
    const { container } = render(<StudentProfileUpload onUploaded={onUploaded} />)

    selectFile(new File(['image'], 'student-profile.webp', { type: 'image/webp' }))

    await waitFor(() => expect(onUploaded).toHaveBeenCalled())
    expect(container.textContent).not.toContain(signedUrl)
    expect(container.textContent).not.toContain(studentProfilePath)
  })

  it('invalidates the prior upload before validating a replacement', async () => {
    const events: string[] = []
    render(
      <StudentProfileUpload
        onUploadStart={() => events.push('started')}
        onUploaded={() => events.push('uploaded')}
      />,
    )
    selectFile(new File(['image'], 'profile.png', { type: 'image/png' }))
    await waitFor(() => expect(events).toEqual(['started', 'uploaded']))

    selectFile(new File(['pdf'], 'replacement.pdf', { type: 'application/pdf' }))
    expect(events).toEqual(['started', 'uploaded', 'started'])
    expect(screen.queryByText('profile.png')).toBeNull()
    expect(toast.success).toHaveBeenCalledTimes(1)
  })

  it('can be disabled while the parent form is submitting', () => {
    render(<StudentProfileUpload disabled onUploaded={vi.fn()} />)
    expect((screen.getByLabelText('Student Profile') as HTMLInputElement).disabled).toBe(true)
  })

  it('locks file selection until an in-flight upload finishes', async () => {
    let finish!: (response: Response) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    render(<StudentProfileUpload onUploaded={vi.fn()} />)
    selectFile(new File(['image'], 'profile.png', { type: 'image/png' }))
    await waitFor(() => expect(screen.getByText('Uploading Student Profile...')).toBeDefined())
    expect((screen.getByLabelText('Student Profile') as HTMLInputElement).disabled).toBe(true)
    finish(new Response(null, { status: 200 }))
    await waitFor(() =>
      expect((screen.getByLabelText('Student Profile') as HTMLInputElement).disabled).toBe(false),
    )
  })

  it('invalidates a successful upload when its replacement fails', async () => {
    const events: string[] = []
    render(
      <StudentProfileUpload
        onUploadStart={() => events.push('started')}
        onUploaded={() => events.push('uploaded')}
      />,
    )
    selectFile(new File(['image'], 'profile.png', { type: 'image/png' }))
    await waitFor(() => expect(events).toEqual(['started', 'uploaded']))
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    selectFile(new File(['replacement'], 'replacement.png', { type: 'image/png' }))
    await screen.findByRole('alert')
    expect(events).toEqual(['started', 'uploaded', 'started'])
    expect(screen.queryByText('profile.png')).toBeNull()
    expect(toast.success).toHaveBeenCalledTimes(1)
  })
})
