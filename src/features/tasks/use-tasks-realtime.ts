'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { listsQueryKey } from '@/features/lists/hooks'
import { allTasksQueryKey } from './hooks'

export function useTasksRealtime() {
  const queryClient = useQueryClient()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const invalidateTasks = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['tasks'] })
        void queryClient.invalidateQueries({ queryKey: allTasksQueryKey })
      }, 250)
    }

    const invalidateLists = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: listsQueryKey })
        void queryClient.invalidateQueries({ queryKey: ['invites'] })
        void queryClient.invalidateQueries({ queryKey: ['list-members'] })
      }, 250)
    }

    const channel = supabase
      .channel('tasks-lists-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        invalidateTasks
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists' },
        invalidateLists
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_members' },
        invalidateLists
      )
      .subscribe()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      void supabase.removeChannel(channel)
    }
  }, [queryClient])
}
