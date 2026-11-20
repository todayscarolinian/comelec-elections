// src/server/trpc/__tests__/helpers.ts
import type { Db, Session, TRPCContext } from '@/src/server/trpc/init'

export function makeCtx(overrides: Partial<TRPCContext> = {}): TRPCContext {
  return {
    headers: new Headers(),
    session: null,
    db: {} as Db, // tests that touch the DB pass their own fake
    ...overrides,
  }
}

export type { Session }
