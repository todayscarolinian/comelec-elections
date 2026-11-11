import { normalizeEmail } from '@/server/auth/policy'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'
import type { Db } from '@/server/trpc/init'

export type GrantAdminInput = {
  email: string
  grantedBy: string
}

export type RevokeAdminInput = {
  email: string
  revokedBy: string
}

export class AdminNotFoundError extends Error {
  constructor() {
    super('Admin not found')
    this.name = 'AdminNotFoundError'
  }
}

export class LastAdminError extends Error {
  constructor() {
    super('Cannot revoke the last Admin')
    this.name = 'LastAdminError'
  }
}

/** A concurrent change to the Admin table kept the revoke from committing. */
export class AdminRevokeConflictError extends Error {
  constructor() {
    super('Admin revoke conflicted with a concurrent change')
    this.name = 'AdminRevokeConflictError'
  }
}

const REVOKE_ATTEMPTS = 2
// Prisma: "Transaction failed due to a write conflict or a deadlock."
const WRITE_CONFLICT = 'P2034'

function isWriteConflict(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === WRITE_CONFLICT
}

/** Idempotent: granting an existing Admin changes nothing and writes no AuditLog row. */
export async function grantAdmin(db: Db, { email, grantedBy }: GrantAdminInput) {
  const adminEmail = normalizeEmail(email)

  return db.$transaction(async (tx) => {
    const { count } = await tx.admin.createMany({
      data: [{ email: adminEmail, grantedBy }],
      skipDuplicates: true,
    })

    if (count > 0) {
      await writeAudit({ adminEmail: grantedBy, action: 'GRANT_ADMIN', target: adminEmail }, tx)
    }

    return { email: adminEmail, created: count > 0 }
  })
}

async function revokeAdminOnce(db: Db, adminEmail: string, revokedBy: string) {
  await db.$transaction(
    async (tx) => {
      const existing = await tx.admin.findUnique({ where: { email: adminEmail } })
      if (!existing) throw new AdminNotFoundError()

      const count = await tx.admin.count()
      if (count <= 1) throw new LastAdminError()

      // SAFE: the design requires removing the Admin row (no soft-delete flag on Admin); the revoke is recorded in AuditLog in this same transaction.
      await tx.admin.delete({ where: { email: adminEmail } })

      await writeAudit({ adminEmail: revokedBy, action: 'REVOKE_ADMIN', target: adminEmail }, tx)
    },
    // Serializable so two concurrent revokes can't both pass the last-Admin check.
    { isolationLevel: 'Serializable' },
  )
}

export async function revokeAdmin(db: Db, { email, revokedBy }: RevokeAdminInput) {
  const adminEmail = normalizeEmail(email)

  for (let attempt = 1; attempt <= REVOKE_ATTEMPTS; attempt++) {
    try {
      await revokeAdminOnce(db, adminEmail, revokedBy)
      return
    } catch (error) {
      if (!isWriteConflict(error)) throw error
    }
  }

  throw new AdminRevokeConflictError()
}

export async function listAdmins(db: Db) {
  return db.admin.findMany({
    orderBy: { email: 'asc' },
    select: { email: true, grantedBy: true, grantedAt: true },
  })
}
