import { describe, expect, it } from 'vitest'
import { isOwnStudentProfilePath } from '../core/studentProfilePath'

const personId = 'person-1'
const uuid = '11111111-1111-4111-8111-111111111111'

describe('isOwnStudentProfilePath', () => {
  it('accepts {personId}/{uuid}', () => {
    expect(isOwnStudentProfilePath(`${personId}/${uuid}`, personId)).toBe(true)
  })
  it.each([
    ['another person', `person-2/${uuid}`],
    ['a prefix of another id', `person-10/${uuid}`],
    ['parent traversal', `${personId}/../person-2/${uuid}`],
    ['an extra segment', `${personId}/${uuid}/x`],
    ['not a UUID', `${personId}/photo.png`],
    ['no folder', uuid],
    ['empty', ''],
  ])('rejects %s', (_, path) => {
    expect(isOwnStudentProfilePath(path, personId)).toBe(false)
  })
})
