'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocaleProvider } from '@/lib/i18n/provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>{children}</LocaleProvider>
    </QueryClientProvider>
  )
}
