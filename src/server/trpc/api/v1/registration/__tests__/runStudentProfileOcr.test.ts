// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { readStudentProfile, downloadStudentProfile } = vi.hoisted(() => ({
  readStudentProfile: vi.fn(),
  downloadStudentProfile: vi.fn(),
}))

vi.mock('@/server/ocr', () => ({ readStudentProfile }))
vi.mock('../services/studentProfileStorage', () => ({ downloadStudentProfile }))

import { CURRENT_TERM } from '@/election'
import { Prisma } from '@/generated/prisma/client'
import type { Db } from '@/server/trpc/init'
import { runStudentProfileOcr } from '../core/runStudentProfileOcr'

const personId = 'person-1'
const studentProfilePath = `${personId}/11111111-1111-4111-8111-111111111111`
const image = Buffer.from('fake-image')
const reading = {
  fields: { name: 'Test Voter', studentId: '01234567', yearLevel: '2', term: CURRENT_TERM },
  matches: { name: true, studentId: true, yearLevel: true, term: true },
}

function setup(count = 1) {
  const updateMany = vi.fn<(args: unknown) => Promise<{ count: number }>>(async () => ({ count }))
  const db = { registration: { updateMany } } as unknown as Db
  const job = {
    db,
    personId,
    studentProfilePath,
    name: 'Test Voter',
    email: '01234567@usc.edu.ph',
    yearLevel: '2',
  }
  return { updateMany, job }
}

describe('runStudentProfileOcr', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    downloadStudentProfile.mockResolvedValue(image)
    readStudentProfile.mockResolvedValue(reading)
  })

  it('passes the expected values, keeping the leading zero of the student ID', async () => {
    const { job } = setup()
    await runStudentProfileOcr(job)
    expect(downloadStudentProfile).toHaveBeenCalledWith(studentProfilePath)
    expect(readStudentProfile).toHaveBeenCalledWith(image, {
      name: 'Test Voter',
      studentId: '01234567',
      yearLevel: '2',
      term: CURRENT_TERM,
    })
  })

  it('writes DONE and the result, scoped to the uploaded path', async () => {
    const { job, updateMany } = setup()
    await runStudentProfileOcr(job)
    expect(updateMany).toHaveBeenCalledWith({
      where: { personId, studentProfilePath },
      data: { ocrStatus: 'DONE', ocrResult: reading },
    })
  })

  it('writes FAILED and does not throw when OCR fails', async () => {
    readStudentProfile.mockRejectedValue(new Error('boom'))
    const { job, updateMany } = setup()

    await expect(runStudentProfileOcr(job)).resolves.toBeUndefined()

    expect(updateMany).toHaveBeenCalledWith({
      where: { personId, studentProfilePath },
      data: { ocrStatus: 'FAILED', ocrResult: Prisma.DbNull },
    })
  })

  it('writes FAILED and skips OCR when the download fails', async () => {
    downloadStudentProfile.mockRejectedValue(new Error('boom'))
    const { job, updateMany } = setup()

    await expect(runStudentProfileOcr(job)).resolves.toBeUndefined()

    expect(readStudentProfile).not.toHaveBeenCalled()
    expect(updateMany).toHaveBeenCalledWith({
      where: { personId, studentProfilePath },
      data: { ocrStatus: 'FAILED', ocrResult: Prisma.DbNull },
    })
  })

  it('matches 0 rows and does not throw for a stale result', async () => {
    const { job, updateMany } = setup(0)

    await expect(runStudentProfileOcr(job)).resolves.toBeUndefined()

    // The write is scoped to the path that was uploaded, so a resubmission
    // with a different path is never matched or overwritten.
    expect(updateMany).toHaveBeenCalledTimes(1)
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { personId, studentProfilePath } }),
    )
  })

  it('does not throw when the FAILED write itself fails', async () => {
    readStudentProfile.mockRejectedValue(new Error('boom'))
    const { job, updateMany } = setup()
    updateMany.mockRejectedValue(new Error('db down'))

    await expect(runStudentProfileOcr(job)).resolves.toBeUndefined()

    expect(updateMany).toHaveBeenCalledTimes(1)
  })

  it('stores only fields and matches', async () => {
    readStudentProfile.mockResolvedValue({ ...reading, rawText: 'should not be stored' })
    const { job, updateMany } = setup()

    await runStudentProfileOcr(job)

    expect(updateMany).toHaveBeenCalledWith({
      where: { personId, studentProfilePath },
      data: { ocrStatus: 'DONE', ocrResult: reading },
    })
  })
})
