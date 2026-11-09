import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from '@/server/storage'

const STUDENT_PROFILE_BUCKET = 'student-profiles'

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
