import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from '@/server/storage'

const STUDENT_PROFILE_BUCKET = 'student-profiles'

export const STUDENT_PROFILE_VIEW_SECONDS = 10 * 60

type ViewBucket = {
  createSignedUrl(
    path: string,
    expiresIn: number,
  ): Promise<{
    data: { signedUrl: string } | null
    error: unknown
  }>
}

export async function createSignedStudentProfileView(
  path: string,
  bucket: ViewBucket = getSupabaseAdmin().storage.from(STUDENT_PROFILE_BUCKET),
): Promise<string> {
  try {
    const { data, error } = await bucket.createSignedUrl(path, STUDENT_PROFILE_VIEW_SECONDS)
    if (error || !data) throw new Error()
    return data.signedUrl
  } catch {
    throw new Error('Unable to view Student Profile.')
  }
}

type SignedUploadBucket = {
  createSignedUploadUrl(
    path: string,
    options: { upsert: boolean },
  ): Promise<{
    data: { signedUrl: string } | null
    error: { message: string } | null
  }>
}

export async function createSignedStudentProfileUpload(
  personId: string,
  bucket: SignedUploadBucket = getSupabaseAdmin().storage.from(STUDENT_PROFILE_BUCKET),
) {
  const path = `${personId}/${randomUUID()}`
  const { data, error } = await bucket.createSignedUploadUrl(path, {
    upsert: false,
  })

  if (error || !data) {
    throw new Error('Unable to create signed Student Profile upload')
  }

  return {
    path,
    signedUrl: data.signedUrl,
  }
}

type ExistsBucket = {
  exists(path: string): Promise<{ data: boolean; error: unknown }>
}

export async function studentProfileExists(
  path: string,
  bucket: ExistsBucket = getSupabaseAdmin().storage.from(STUDENT_PROFILE_BUCKET),
) {
  try {
    const { data } = await bucket.exists(path)
    return data === true
  } catch {
    throw new Error('Unable to check Student Profile upload')
  }
}

type DownloadBucket = {
  download(path: string): Promise<{
    data: Blob | null
    error: unknown
  }>
}

export async function downloadStudentProfile(
  path: string,
  bucket: DownloadBucket = getSupabaseAdmin().storage.from(STUDENT_PROFILE_BUCKET),
): Promise<Buffer> {
  try {
    const { data, error } = await bucket.download(path)
    if (error || !data) {
      throw new Error()
    }
    return Buffer.from(await data.arrayBuffer())
  } catch {
    throw new Error('Unable to download Student Profile')
  }
}
