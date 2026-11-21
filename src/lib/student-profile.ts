export const STUDENT_PROFILE_MAX_BYTES = 5 * 1024 * 1024

export const STUDENT_PROFILE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function getStudentProfileValidationError(file: { size: number; type: string }) {
  if (!(STUDENT_PROFILE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'Choose a JPEG, PNG, or WebP image.'
  }

  if (file.size > STUDENT_PROFILE_MAX_BYTES) {
    return 'Student Profile must be 5 MB or smaller.'
  }

  return null
}
