'use client'

import { useQueryClient } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { useMemo } from 'react'
import superjson from 'superjson'
import { TRPCProvider } from '@/lib/trpc/client'
import type { AppRouter } from '@/server/trpc/root'

type DevTRPCProviderProps = {
  email: string
  name: string
  children: React.ReactNode
}

export function DevTRPCProvider({ email, name, children }: Readonly<DevTRPCProviderProps>) {
  const queryClient = useQueryClient()
  const trpcClient = useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            transformer: superjson,
            url: '/api/dev/trpc',
            headers: {
              'x-dev-email': email,
              'x-dev-name': encodeURIComponent(name),
            },
          }),
        ],
      }),
    [email, name],
  )

  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  )
}
