'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'

export function ElectionStatus() {
  const trpc = useTRPC()
  const { data, isError } = useQuery(trpc.election.get.queryOptions(undefined, { retry: false }))
  let message = 'Checking election status…'
  if (data) message = data.status === 'OPEN' ? 'Election open' : 'Election closed'
  else if (isError) message = 'Election status unavailable'

  return <output className="landing-status">{message}</output>
}
