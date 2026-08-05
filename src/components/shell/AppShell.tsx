'use client'

import { Menu, X } from 'lucide-react'
import { useShellStore } from '@/features/ui/shell-store'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const drawerOpen = useShellStore((s) => s.drawerOpen)
  const selectedTaskId = useShellStore((s) => s.selectedTaskId)
  const setDrawerOpen = useShellStore((s) => s.setDrawerOpen)

  return (
    <div className="relative min-h-dvh">
      <div
        className={[
          'app-shell bg-[var(--color-bg)] text-[var(--color-text)]',
          selectedTaskId ? 'with-detail' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-[var(--color-text)] hover:bg-[var(--color-sidebar)]"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold">To Do</span>
        </header>

        <div className="app-shell-sidebar hidden lg:block">
          <Sidebar />
        </div>

        <main className="app-shell-main min-w-0 overflow-auto bg-[var(--color-bg)]">
          {children}
        </main>

        {selectedTaskId ? (
          <aside className="app-shell-detail hidden border-l border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
            {/* Detail host filled in Task 11 */}
          </aside>
        ) : null}
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(220px,85vw)] flex-col bg-[var(--color-sidebar)] shadow-lg">
            <div className="flex justify-end p-2">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md p-2 text-[var(--color-text)] hover:bg-[var(--color-surface)]"
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
    </div>
  )
}
