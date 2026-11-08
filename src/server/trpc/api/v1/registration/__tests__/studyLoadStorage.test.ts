// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/storage', () => ({ getSupabaseAdmin: vi.fn() }))

import { createSignedStudyLoadUpload } from '../services/studyLoadStorage'

describe('createSignedStudyLoadUpload', () => {
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
    const result = await createSignedStudyLoadUpload('person-1', bucket)

    expect(result.path).toMatch(
      /^person-1\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(result.signedUrl).toBe(`https://storage.example.org/${result.path}`)
    expect(createSignedUploadUrl).toHaveBeenCalledWith(result.path, { upsert: false })
  })

  it('creates a fresh object path for every upload', async () => {
    const first = await createSignedStudyLoadUpload('person-1', bucket)
    const second = await createSignedStudyLoadUpload('person-1', bucket)

    expect(first.path).not.toBe(second.path)
  })

  it('throws a generic error instead of exposing a Storage error', async () => {
    createSignedUploadUrl.mockResolvedValueOnce({
      data: null,
      error: { message: 'private Supabase error details' },
    })

    await expect(createSignedStudyLoadUpload('person-1', bucket)).rejects.toThrow(
      'Unable to create signed Study Load upload',
    )
  })

  it('rejects an empty successful response', async () => {
    createSignedUploadUrl.mockResolvedValueOnce({ data: null, error: null })

    await expect(createSignedStudyLoadUpload('person-1', bucket)).rejects.toThrow(
      'Unable to create signed Study Load upload',
    )
  })
})
