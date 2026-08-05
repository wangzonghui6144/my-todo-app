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
  subtitle?: string
  /** When set, loads tasks for this list. Otherwise loads all tasks. */
  listId?: string
  composeListId?: string
  filter?: (task: Task) => boolean
  composeDefaults?: {
    is_important?: boolean
    my_day_on?: string | null
  }
  variant?: 'default' | 'myday' | 'important' | 'planned'
  headerActions?: ReactNode
}

export function TaskListView({
  title,
  subtitle,
  listId,
  composeListId,
  filter,
  composeDefaults,
  variant = 'default',
  headerActions,
}: TaskListViewProps) {
  const { locale } = useLocale()
  const isListScoped = Boolean(listId)
  const listQuery = useTasksForList(listId ?? '')
  const allQuery = useAllTasks(!isListScoped)
  const query = isListScoped ? listQuery : allQuery

  const tasks = (query.data ?? []).filter((task) =>
    filter ? filter(task) : true
  )
  const incomplete = tasks.filter((t) => !t.is_completed)
  const completed = tasks.filter((t) => t.is_completed)
  const showCached = query.isFetching && !query.isLoading && tasks.length > 0

  return (
    <div className="task-view">
      <header className={`task-hero task-hero--${variant}`}>
        <div className="task-hero__glow" aria-hidden />
        <div className="task-hero__content">
          <div className="min-w-0">
            <h1 className="task-hero__title">{title}</h1>
            {subtitle ? <p className="task-hero__subtitle">{subtitle}</p> : null}
          </div>
          {headerActions}
        </div>
      </header>

      <div className="task-view__body">
        {query.isLoading ? (
          <div className="task-empty">
            <div className="task-skeleton" />
            <div className="task-skeleton" />
            <div className="task-skeleton task-skeleton--short" />
          </div>
        ) : query.isError ? (
          <p className="task-empty__text text-[var(--color-danger)]">
            {t(locale, 'task.loadFailed')}
          </p>
        ) : incomplete.length === 0 && completed.length === 0 ? (
          <div className="task-empty">
            <p className="task-empty__text">{t(locale, 'task.empty')}</p>
            <p className="task-empty__hint">{t(locale, 'task.emptyHint')}</p>
          </div>
        ) : (
          <div className={`task-stack ${showCached ? 'task-stack--soft' : ''}`}>
            {incomplete.map((task, index) => (
              <div
                key={task.id}
                className="task-stack__item"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <TaskRow task={task} />
              </div>
            ))}
            {completed.length > 0 && (
              <div className="task-completed-block">
                <p className="task-completed-label">{t(locale, 'task.completed')}</p>
                {completed.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TaskComposer listId={composeListId || listId} defaults={composeDefaults} />
    </div>
  )
}
