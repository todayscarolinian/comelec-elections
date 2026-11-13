// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/storage', () => ({ getSupabaseAdmin: vi.fn() }))

import {
  createSignedStudentProfileUpload,
  studentProfileExists,
} from '../services/studentProfileStorage'

describe('createSignedStudentProfileUpload', () => {
  const createSignedUploadUrl = vi.fn()
  const bucket = { createSignedUploadUrl }

  beforeEach(() => {
    createSignedUploadUrl.mockReset()
    createSignedUploadUrl.mockImplementation(async (path: string) => ({
      data: { signedUrl: `https://storage.example.org/${path}` },
      error: null,
    }))
  })

  it('creates a non-overwriting upload under the Person namespace', async () => {
    const result = await createSignedStudentProfileUpload('person-1', bucket)

    expect(result.path).toMatch(
      /^person-1\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(result.signedUrl).toBe(`https://storage.example.org/${result.path}`)
    expect(createSignedUploadUrl).toHaveBeenCalledWith(result.path, { upsert: false })
  })

  it('creates a fresh object path for every upload', async () => {
    const first = await createSignedStudentProfileUpload('person-1', bucket)
    const second = await createSignedStudentProfileUpload('person-1', bucket)

    expect(first.path).not.toBe(second.path)
  })

  it('throws a generic error instead of exposing a Storage error', async () => {
    createSignedUploadUrl.mockResolvedValueOnce({
      data: null,
      error: { message: 'private Supabase error details' },
    })

    await expect(createSignedStudentProfileUpload('person-1', bucket)).rejects.toThrow(
      'Unable to create signed Student Profile upload',
    )
  })

  it('rejects an empty successful response', async () => {
    createSignedUploadUrl.mockResolvedValueOnce({ data: null, error: null })

    await expect(createSignedStudentProfileUpload('person-1', bucket)).rejects.toThrow(
      'Unable to create signed Student Profile upload',
    )
  })
})

describe('studentProfileExists', () => {
  const exists = vi.fn()
  const bucket = { exists }

  beforeEach(() => exists.mockReset())

  it('returns true when the object exists', async () => {
    exists.mockResolvedValueOnce({ data: true, error: null })
    await expect(studentProfileExists('person-1/x', bucket)).resolves.toBe(true)
    expect(exists).toHaveBeenCalledWith('person-1/x')
  })

  it('returns false when the object is missing', async () => {
    exists.mockResolvedValueOnce({ data: false, error: { message: 'Object not found' } })
    await expect(studentProfileExists('person-1/x', bucket)).resolves.toBe(false)
  })

  it('throws a generic error when Storage fails', async () => {
    exists.mockRejectedValueOnce(new Error('private Supabase error details'))
    await expect(studentProfileExists('person-1/x', bucket)).rejects.toThrow(
      'Unable to check Student Profile upload',
    )
  })
})
