import type { z } from 'zod'
import { ELECTION } from '@/election'
import type { Prisma } from '@/generated/prisma/client'
import type { Db } from '@/server/trpc/init'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'
import {
  ballotAuditStatus,
  ballotChoices,
  ballotsCsv,
  registrationStatusFor,
} from '../core/ballotAudit'
import type { listBallotsInputSchema } from '../schema'

export const BALLOT_PAGE_SIZE = 25

type ListBallotsInput = z.infer<typeof listBallotsInputSchema>

const ballotSelect = {
  id: true,
  yearLevel: true,
  castAt: true,
  person: { select: { name: true, email: true, registration: { select: { status: true } } } },
  answers: { select: { questionId: true, candidateId: true } },
} as const satisfies Prisma.BallotSelect

type BallotRecord = Prisma.BallotGetPayload<{ select: typeof ballotSelect }>

function toRow({ id, yearLevel, castAt, person, answers }: BallotRecord) {
  return {
    id,
    name: person.name,
    email: person.email,
    yearLevel,
    castAt,
    status: ballotAuditStatus(person.registration?.status),
    choices: ballotChoices(ELECTION, answers),
  }
}

function ballotWhere({ yearLevel, status, search }: ListBallotsInput): Prisma.BallotWhereInput {
  const person: Prisma.PersonWhereInput = {
    ...(status && { registration: { is: { status: registrationStatusFor[status] } } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }
  return { yearLevel, person }
}

export async function listBallots(db: Db, input: ListBallotsInput, adminEmail: string) {
  const records = await db.ballot.findMany({
    where: ballotWhere(input),
    orderBy: [{ castAt: 'desc' }, { id: 'desc' }],
    take: BALLOT_PAGE_SIZE + 1,
    ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
    select: ballotSelect,
  })
  const page = records.slice(0, BALLOT_PAGE_SIZE)

  await writeAudit(
    {
      adminEmail,
      action: 'VIEW_BALLOTS',
      detail: {
        yearLevel: input.yearLevel ?? null,
        status: input.status ?? null,
        search: input.search || null,
        page: input.cursor ? 'next' : 'first',
        count: page.length,
      },
    },
    db,
  )

  return {
    items: page.map(toRow),
    nextCursor: records.length > BALLOT_PAGE_SIZE ? (page.at(-1)?.id ?? null) : null,
  }
}

export async function exportBallots(db: Db, adminEmail: string) {
  const records = await db.ballot.findMany({
    orderBy: [{ castAt: 'asc' }, { id: 'asc' }],
    select: ballotSelect,
  })
  await writeAudit({ adminEmail, action: 'EXPORT_BALLOTS', detail: { count: records.length } }, db)
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return { filename: `ballots-${stamp}.csv`, csv: ballotsCsv(ELECTION, records.map(toRow)) }
}
