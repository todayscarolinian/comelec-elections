const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
const UUID_PATTERN = new RegExp(`^${UUID}$`, 'i')

/** True only for `{personId}/{uuid}`, the shape createSignedStudentProfileUpload issues. */
export function isOwnStudentProfilePath(path: string, personId: string) {
  const prefix = `${personId}/`
  if (!path.startsWith(prefix)) return false
  return UUID_PATTERN.test(path.slice(prefix.length))
}
