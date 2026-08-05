'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { listsQueryKey } from '@/features/lists/hooks'
import { allTasksQueryKey } from './hooks'

export function useTasksRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('tasks-lists-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['tasks'] })
          void queryClient.invalidateQueries({ queryKey: allTasksQueryKey })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists' },
        () => {
          void queryClient.invalidateQueries({ queryKey: listsQueryKey })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_members' },
        () => {
          void queryClient.invalidateQueries({ queryKey: listsQueryKey })
          void queryClient.invalidateQueries({ queryKey: ['invites'] })
          void queryClient.invalidateQueries({ queryKey: ['list-members'] })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])
}
