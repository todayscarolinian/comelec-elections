import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { PrismaClient } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'

export type Session = { user: { personId: string; email: string } } | null
export type Db = Pick<PrismaClient, 'person' | 'registration' | 'admin'>

export type TRPCContext = {
  headers: Headers
  session: Session
  db: Db
}

export const createTRPCContext = async (opts: { headers: Headers }): Promise<TRPCContext> => {
  const session: Session = null // TODO(S1-03): await auth(). Null fails closed.
  return { headers: opts.headers, session, db: prisma }
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure

/** Valid session. Adds `person`. */
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: 'UNAUTHORIZED' })

  const person = await ctx.db.person.findUnique({
    where: { id: ctx.session.user.personId },
  })
  if (!person) throw new TRPCError({ code: 'UNAUTHORIZED' })

  return next({ ctx: { session: ctx.session, person } })
})

/** Valid session and own Registration is APPROVED. Adds `registration`. */
export const voterProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const registration = await ctx.db.registration.findUnique({
    where: { personId: ctx.person.id },
  })
  if (registration?.status !== 'APPROVED') throw new TRPCError({ code: 'FORBIDDEN' })

  return next({ ctx: { registration } })
})

/** Valid session and a row in Admin for the session email. Adds `adminEmail`. */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const email = ctx.session.user.email.trim().toLowerCase()
  const admin = await ctx.db.admin.findUnique({ where: { email } })
  if (!admin) throw new TRPCError({ code: 'FORBIDDEN' })

  return next({ ctx: { adminEmail: admin.email } })
})
