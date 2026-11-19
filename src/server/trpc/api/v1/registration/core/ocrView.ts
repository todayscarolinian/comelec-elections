export const OCR_STALE_AFTER_MS = 10 * 60 * 1000

type OcrStatus = 'PENDING' | 'DONE' | 'FAILED'

export function ocrView<T extends { ocrStatus: OcrStatus; submittedAt: Date }>(
  registration: T,
  now: Date,
): OcrStatus {
  if (
    registration.ocrStatus === 'PENDING' &&
    now.getTime() - registration.submittedAt.getTime() > OCR_STALE_AFTER_MS
  ) {
    return 'FAILED'
  }
  return registration.ocrStatus
}
