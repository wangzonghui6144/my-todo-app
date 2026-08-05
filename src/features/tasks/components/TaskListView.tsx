'use client'

import type { ReactNode } from 'react'
import type { Task } from '@/types/database'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import { useAllTasks, useTasksForList } from '../hooks'
import { TaskComposer } from './TaskComposer'
import { TaskRow } from './TaskRow'

type TaskListViewProps = {
  title: string
  /** When set, loads tasks for this list. Otherwise loads all tasks. */
  listId?: string
  composeListId: string
  filter?: (task: Task) => boolean
  composeDefaults?: {
    is_important?: boolean
    my_day_on?: string | null
  }
  headerClassName?: string
  headerActions?: ReactNode
}

export function TaskListView({
  title,
  listId,
  composeListId,
  filter,
  composeDefaults,
  headerClassName,
  headerActions,
}: TaskListViewProps) {
  const { locale } = useLocale()
  const listQuery = useTasksForList(listId ?? '')
  const allQuery = useAllTasks()
  const query = listId ? listQuery : allQuery

  const tasks = (query.data ?? []).filter((task) =>
    filter ? filter(task) : true
  )
  const incomplete = tasks.filter((t) => !t.is_completed)
  const completed = tasks.filter((t) => t.is_completed)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className={[
          'flex items-start justify-between gap-2 border-b border-[var(--color-border)] px-4 py-5',
          headerClassName ?? 'bg-[var(--color-surface)]',
        ].join(' ')}
      >
        <h1
          className={[
            'text-xl font-semibold tracking-tight',
            headerClassName ? 'text-inherit' : 'text-[var(--color-text)]',
          ].join(' ')}
        >
          {title}
        </h1>
        {headerActions}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">…</p>
        ) : incomplete.length === 0 && completed.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">
            {t(locale, 'task.empty')}
          </p>
        ) : (
          <>
            {incomplete.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
            {completed.length > 0 && (
              <div className="mt-4">
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {t(locale, 'task.completed')}
                </p>
                {completed.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <TaskComposer listId={composeListId} defaults={composeDefaults} />
    </div>
  )
}
