'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocaleProvider } from '@/lib/i18n/provider'
import { ProfileSettingsSync } from '@/features/settings/components/ProfileSettingsSync'
import { useTasksRealtime } from '@/features/tasks/use-tasks-realtime'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})

function RealtimeBridge() {
  useTasksRealtime()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ProfileSettingsSync />
        <RealtimeBridge />
        {children}
      </LocaleProvider>
    </QueryClientProvider>
  )
}
