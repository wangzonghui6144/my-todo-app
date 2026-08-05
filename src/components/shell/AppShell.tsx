'use client'

import { useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useShellStore } from '@/features/ui/shell-store'
import { TaskDetailPanel } from '@/features/tasks/components/TaskDetailPanel'
import { TaskDetailSheet } from '@/features/tasks/components/TaskDetailSheet'
import { fetchAllTasks } from '@/features/tasks/api'
import { allTasksQueryKey } from '@/features/tasks/hooks'
import { fetchLists } from '@/features/lists/api'
import { listsQueryKey } from '@/features/lists/hooks'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const drawerOpen = useShellStore((s) => s.drawerOpen)
  const selectedTaskId = useShellStore((s) => s.selectedTaskId)
  const setDrawerOpen = useShellStore((s) => s.setDrawerOpen)
  const queryClient = useQueryClient()

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: listsQueryKey,
      queryFn: fetchLists,
      staleTime: 60_000,
    })
    void queryClient.prefetchQuery({
      queryKey: allTasksQueryKey,
      queryFn: fetchAllTasks,
      staleTime: 30_000,
    })
  }, [queryClient])

  return (
    <div className="shell-root">
      <div
        className={[
          'app-shell',
          selectedTaskId ? 'with-detail' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <header className="shell-mobile-bar lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            className="shell-icon-btn"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold tracking-tight">To Do</span>
        </header>

        <div className="app-shell-sidebar hidden lg:block">
          <Sidebar />
        </div>

        <main className="app-shell-main">{children}</main>

        {selectedTaskId ? (
          <aside className="app-shell-detail hidden lg:block">
            <TaskDetailPanel />
          </aside>
        ) : null}
      </div>

      {drawerOpen ? (
        <div className="shell-drawer lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="shell-drawer__scrim"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="shell-drawer__panel">
            <div className="flex justify-end p-2">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
                className="shell-icon-btn"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <Sidebar />
            </div>
          </div>
        </div>
      ) : null}

      <TaskDetailSheet />
    </div>
  )
}
