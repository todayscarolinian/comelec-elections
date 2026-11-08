export const STUDY_LOAD_MAX_BYTES = 5 * 1024 * 1024

export const STUDY_LOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function getStudyLoadValidationError(file: { size: number; type: string }) {
  if (!(STUDY_LOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'Choose a JPEG, PNG, or WebP image.'
  }

  if (file.size > STUDY_LOAD_MAX_BYTES) {
    return 'Study Load must be 5 MB or smaller.'
  }

  return null
}
