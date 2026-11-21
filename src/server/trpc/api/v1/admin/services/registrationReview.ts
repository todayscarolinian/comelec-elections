import { TRPCError } from '@trpc/server'
import { Prisma } from '@/generated/prisma/client'
import type { Db } from '@/server/trpc/init'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'
import { ocrResultSchema } from '@/server/trpc/api/v1/registration/schema'
import { ocrView } from '@/server/trpc/api/v1/registration/core/ocrView'
import { createSignedStudentProfileView } from '@/server/trpc/api/v1/registration/services/studentProfileStorage'
import type { z } from 'zod'
import type { listRegistrationsInputSchema } from '../schema'

export async function listRegistrations(
  db: Db,
  input: z.infer<typeof listRegistrationsInputSchema>,
) {
  const registrations = await db.registration.findMany({
    where: { status: input.status, yearLevel: input.yearLevel },
    select: {
      id: true,
      yearLevel: true,
      school: true,
      status: true,
      submittedAt: true,
      reviewedBy: true,
      reviewedAt: true,
      rejectionReason: true,
      studentProfilePath: true,
      ocrStatus: true,
      ocrResult: true,
      person: { select: { name: true, email: true, ballot: { select: { id: true } } } },
    },
    orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
  })
  const now = new Date()
  const rows = await Promise.all(
    registrations.map(
      async ({ person, studentProfilePath, ocrResult, ocrStatus, ...registration }) => {
        let studentProfileUrl: string | null = null
        try {
          studentProfileUrl = await createSignedStudentProfileView(studentProfilePath)
        } catch {
          // A failed/expired document must not hide the rest of the review queue.
        }
        const parsed = ocrResultSchema.safeParse(ocrResult)
        return {
          ...registration,
          name: person.name,
          email: person.email,
          studentId: person.email.split('@')[0],
          hasHeldBallot: Boolean(person.ballot) && registration.status !== 'APPROVED',
          studentProfileUrl,
          ocrStatus: ocrView({ ocrStatus, submittedAt: registration.submittedAt }, now),
          ocrResult: parsed.success ? parsed.data : null,
        }
      },
    ),
  )
  // Only pending Held Ballots need review priority. Keep database order within each group.
  const priority = (row: (typeof rows)[number]) =>
    Number(row.status === 'PENDING' && row.hasHeldBallot)
  return rows.sort((a, b) => priority(b) - priority(a))
}

type Decision = { id: string; adminEmail: string; submittedAt: Date } & (
  | { status: 'APPROVED'; yearLevel?: string; school?: string }
  | { status: 'REJECTED'; reason: string }
)
type ReviewRow = {
  id: string
  personId: string
  status: string
  yearLevel: string
  school: string | null
  submittedAt: Date
}

function isRetryableSqlState(code: unknown) {
  return code === '40001' || code === '40P01'
}

function isReviewConflict(error: unknown) {
  const seen = new Set<object>()
  function visit(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || seen.has(value)) return false
    seen.add(value)
    const { code, meta, originalCode, sqlState, cause } = value as Record<string, unknown>
    if (
      code === 'P2034' ||
      isRetryableSqlState(code) ||
      isRetryableSqlState(originalCode) ||
      isRetryableSqlState(sqlState)
    ) {
      return true
    }
    if (code === 'P2010' && typeof meta === 'object' && meta !== null) {
      const raw = meta as Record<string, unknown>
      // adapter-pg 7.10.1 retains the SQLSTATE in meta.driverAdapterError.cause.originalCode.
      if (isRetryableSqlState(raw.code) || visit(raw.driverAdapterError)) return true
    }
    return visit(cause)
  }
  return visit(error)
}

export async function reviewRegistration(db: Db, decision: Decision) {
  try {
    return await db.$transaction(
      async (tx) => {
        // Serialize competing reviews and resubmissions. Deliberately never select OCR data.
        const [registration] = await tx.$queryRaw<ReviewRow[]>`
        SELECT "id", "personId", "status", "yearLevel", "school", "submittedAt"
        FROM "Registration" WHERE "id" = ${decision.id} FOR UPDATE
      `
        if (!registration)
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Registration not found.' })
        if (registration.submittedAt.getTime() !== decision.submittedAt?.getTime()) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Registration was resubmitted. Refresh the queue.',
          })
        }
        if (registration.status !== 'PENDING') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Registration was already reviewed. Refresh the queue.',
          })
        }
        const yearLevel =
          decision.status === 'APPROVED'
            ? (decision.yearLevel ?? registration.yearLevel)
            : registration.yearLevel
        const school =
          decision.status === 'APPROVED'
            ? (decision.school ?? registration.school)
            : registration.school
        const rejectionReason = decision.status === 'REJECTED' ? decision.reason : null
        const reviewedAt = new Date()
        await tx.registration.update({
          where: { id: registration.id },
          data: {
            status: decision.status,
            yearLevel,
            school,
            rejectionReason,
            reviewedBy: decision.adminEmail,
            reviewedAt,
          },
          select: { id: true },
        })
        if (decision.status === 'APPROVED') {
          // Held Ballots inherit the corrected year and School in the same commit (ADR 0008).
          await tx.ballot.updateMany({
            where: { personId: registration.personId },
            data: { yearLevel, school },
          })
        }
        await writeAudit(
          {
            adminEmail: decision.adminEmail,
            action: decision.status === 'APPROVED' ? 'APPROVE_REGISTRATION' : 'REJECT_REGISTRATION',
            target: registration.id,
            detail: {
              originalYearLevel: registration.yearLevel,
              yearLevel,
              originalSchool: registration.school,
              school,
              ...(rejectionReason === null ? {} : { rejectionReason }),
            },
          },
          tx,
        )
        return { ok: true as const }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  } catch (error) {
    if (error instanceof TRPCError) throw error
    if (isReviewConflict(error)) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Registration changed during review. Refresh and try again.',
      })
    }
    // Database errors may include private values; do not expose or log them.
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to save the review. Please try again.',
    })
  }
}
