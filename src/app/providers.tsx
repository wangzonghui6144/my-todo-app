'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime was renamed to gcTime in v5)
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const checkUser = useAuthStore((state) => state.checkUser)

  useEffect(() => {
    checkUser()
  }, [checkUser])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}