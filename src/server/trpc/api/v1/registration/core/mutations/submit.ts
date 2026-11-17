import { TRPCError } from '@trpc/server'
import { Prisma } from '@/generated/prisma/client'
import { protectedProcedure } from '@/server/trpc/init'
import { submitRegistrationInputSchema } from '../../schema'
import { lockSubmissionWindow } from '../../services/registrationWindow'
import { studentProfileExists } from '../../services/studentProfileStorage'
import { isOwnStudentProfilePath } from '../studentProfilePath'
import { runStudentProfileOcr } from '../runStudentProfileOcr'
import { after } from 'next/server'

export const submit = protectedProcedure
  .input(submitRegistrationInputSchema)
  .mutation(async ({ ctx, input }) => {
    const personId = ctx.person.id
    const { yearLevel, studentProfilePath } = input

    if (!isOwnStudentProfilePath(studentProfilePath, personId)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Student Profile upload.' })
    }

    let exists: boolean
    try {
      exists = await studentProfileExists(studentProfilePath)
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to check the Student Profile upload.',
      })
    }
    if (!exists) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Upload your Student Profile first.' })
    }

    try {
      await ctx.db.$transaction(async (tx) => {
        if (!(await lockSubmissionWindow(tx))) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Registration is closed.' })
        }

        const existing = await tx.registration.findUnique({
          where: { personId },
          select: { status: true },
        })

        if (!existing) {
          await tx.registration.create({
            data: {
              personId,
              yearLevel,
              studentProfilePath,
              status: 'PENDING',
              ocrStatus: 'PENDING',
              ocrResult: Prisma.DbNull,
            },
          })
          return
        }

        // Conditional update: if an Admin approves at the same moment, this matches 0 rows
        // instead of silently flipping an approved Registration back to PENDING.
        const { count } = await tx.registration.updateMany({
          where: { personId, status: { in: ['PENDING', 'REJECTED'] } },
          data: {
            yearLevel,
            studentProfilePath,
            status: 'PENDING',
            rejectionReason: null,
            reviewedBy: null,
            reviewedAt: null,
            submittedAt: new Date(),
            ocrStatus: 'PENDING',
            ocrResult: Prisma.DbNull,
          },
        })
        if (count === 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Your Registration is already approved',
          })
        }
      })
    } catch (error) {
      // Two first-time submits at once: the second INSERT hits personId @unique.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Your Registration was already submitted. Refresh to see its status.',
        })
      }
      throw error
    }

    after(() =>
      runStudentProfileOcr({
        db: ctx.db,
        personId,
        studentProfilePath,
        name: ctx.person.name,
        email: ctx.person.email,
        yearLevel,
      }),
    )

    return { status: 'PENDING' as const }
  })
