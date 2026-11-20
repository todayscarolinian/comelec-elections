// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { readStudentProfile } from '..'

vi.mock('server-only', () => ({}))

const image = readFileSync(path.join(__dirname, 'fixtures', 'student-profile-fake.png'))
const TERM = '1st Semester 2026'

describe('readStudentProfile', () => {
  it('reads a made-up Student Profile and matches its owner', async () => {
    const result = await readStudentProfile(image, {
      name: 'Juan Dela Cruz',
      studentId: '01234567',
      yearLevel: '3',
      term: TERM,
    })

    expect(result.fields).toEqual({
      name: 'JUAN MIGUEL B. DELA CRUZ',
      studentId: '01234567',
      yearLevel: '3',
      term: '1st semester 2026',
    })
    expect(result.matches).toEqual({ name: true, studentId: true, yearLevel: true, term: true })
  }, 60_000)

  it("doesn't match another student", async () => {
    const result = await readStudentProfile(image, {
      name: 'Maria Clara Santos',
      studentId: '07654321',
      yearLevel: '1',
      term: TERM,
    })

    expect(result.matches).toEqual({ name: false, studentId: false, yearLevel: false, term: true })
  }, 60_000)

  it('rejects an image it cannot decode', async () => {
    await expect(
      readStudentProfile(Buffer.from('not an image'), {
        name: 'Juan Dela Cruz',
        studentId: '01234567',
        yearLevel: '3',
        term: TERM,
      }),
    ).rejects.toThrow()
  }, 60_000)
})
