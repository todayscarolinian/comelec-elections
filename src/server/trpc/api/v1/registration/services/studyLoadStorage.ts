import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from '@/server/storage'

const STUDY_LOAD_BUCKET = 'study-loads'

type SignedUploadBucket = {
  createSignedUploadUrl(
    path: string,
    options: { upsert: boolean },
  ): Promise<{
    data: { signedUrl: string } | null
    error: { message: string } | null
  }>
}

export async function createSignedStudyLoadUpload(
  personId: string,
  bucket: SignedUploadBucket = getSupabaseAdmin().storage.from(STUDY_LOAD_BUCKET),
) {
  const path = `${personId}/${randomUUID()}`
  const { data, error } = await bucket.createSignedUploadUrl(path, {
    upsert: false,
  })

  if (error || !data) {
    throw new Error('Unable to create signed Study Load upload')
  }

  return {
    path,
    signedUrl: data.signedUrl,
  }
}
