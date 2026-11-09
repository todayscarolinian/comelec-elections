import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STUDENT_PROFILE_MAX_BYTES } from '@/lib/student-profile'
import { StudyLoadUpload } from '../study-load-upload'

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }))

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
const studyLoadPath = 'person-1/11111111-1111-4111-8111-111111111111'

function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText('Study Load'), {
    target: { files: [file] },
  })
}

describe('StudyLoadUpload', () => {
  beforeEach(() => {
    mutateAsync.mockReset()
    mutateAsync.mockResolvedValue({ path: studyLoadPath, signedUrl })
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['JPEG', 'image/jpeg', 'study-load.jpg'],
    ['PNG', 'image/png', 'study-load.png'],
    ['WebP', 'image/webp', 'study-load.webp'],
  ])('uploads a supported %s image directly to Storage', async (_, type, name) => {
    const onUploaded = vi.fn()
    render(<StudyLoadUpload onUploaded={onUploaded} />)
    const file = new File(['image'], name, { type })

    selectFile(file)

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(studyLoadPath))
    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': type },
      body: file,
    })
    expect(screen.getByRole('status').textContent).toBe('Study Load uploaded.')
  })

  it('rejects an unsupported file type before requesting an upload', () => {
    render(<StudyLoadUpload onUploaded={vi.fn()} />)

    selectFile(new File(['document'], 'study-load.pdf', { type: 'application/pdf' }))

    expect(screen.getByRole('alert').textContent).toBe('Choose a JPEG, PNG, or WebP image.')
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a file exactly 5 MB in size', async () => {
    const onUploaded = vi.fn()
    render(<StudyLoadUpload onUploaded={onUploaded} />)

    selectFile(
      new File([new Uint8Array(STUDENT_PROFILE_MAX_BYTES)], 'study-load.jpg', {
        type: 'image/jpeg',
      }),
    )

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(studyLoadPath))
    expect(mutateAsync).toHaveBeenCalledTimes(1)
  })

  it('rejects a file larger than 5 MB before requesting an upload', () => {
    render(<StudyLoadUpload onUploaded={vi.fn()} />)

    selectFile(
      new File([new Uint8Array(STUDENT_PROFILE_MAX_BYTES + 1)], 'study-load.jpg', {
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
    render(<StudyLoadUpload onUploaded={onUploaded} />)

    selectFile(new File(['image'], 'study-load.png', { type: 'image/png' }))

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Unable to upload the Study Load. Please try again.',
    )
    expect(onUploaded).not.toHaveBeenCalled()
  })

  it('does not render the signed URL or object path', async () => {
    const onUploaded = vi.fn()
    const { container } = render(<StudyLoadUpload onUploaded={onUploaded} />)

    selectFile(new File(['image'], 'study-load.webp', { type: 'image/webp' }))

    await waitFor(() => expect(onUploaded).toHaveBeenCalled())
    expect(container.textContent).not.toContain(signedUrl)
    expect(container.textContent).not.toContain(studyLoadPath)
  })
})
