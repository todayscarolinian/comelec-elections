import { adminProcedure } from '@/server/trpc/init'
import { resultsBySchoolOutputSchema } from '../../schema'
import { getResultsBySchool as getResultsBySchoolService } from '../../services/resultsBySchool'

// Admin-only even after release: in a small School, a per-School tally can point to how
// individuals voted.
export const getResultsBySchool = adminProcedure
  .output(resultsBySchoolOutputSchema)
  .query(({ ctx }) => getResultsBySchoolService(ctx.db, ctx.adminEmail))
