'use client'

import { Star } from 'lucide-react'
import type { Task } from '@/types/database'
import { useShellStore } from '@/features/ui/shell-store'
import { useUpdateTask } from '../hooks'

type TaskRowProps = {
  task: Task
}

export function TaskRow({ task }: TaskRowProps) {
  const selectTask = useShellStore((s) => s.selectTask)
  const selectedTaskId = useShellStore((s) => s.selectedTaskId)
  const updateTask = useUpdateTask()
  const selected = selectedTaskId === task.id

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          selectTask(task.id)
        }
      }}
      className={[
        'group flex w-full items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-left transition-colors',
        selected
          ? 'bg-[var(--color-sidebar)]'
          : 'hover:bg-[var(--color-sidebar)]/60',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={task.is_completed}
        aria-label="Complete task"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation()
          updateTask.mutate({
            id: task.id,
            patch: { is_completed: e.target.checked },
          })
        }}
        className="size-4 shrink-0 accent-[var(--color-accent)]"
      />

      <span
        className={[
          'min-w-0 flex-1 text-sm text-[var(--color-text)]',
          task.is_completed ? 'line-through text-[var(--color-text-muted)]' : '',
        ].join(' ')}
      >
        {task.title}
      </span>

      <button
        type="button"
        aria-label={task.is_important ? 'Unmark important' : 'Mark important'}
        onClick={(e) => {
          e.stopPropagation()
          updateTask.mutate({
            id: task.id,
            patch: { is_important: !task.is_important },
          })
        }}
        className="shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-accent)]"
      >
        <Star
          className="size-4"
          fill={task.is_important ? '#0B5CAB' : 'none'}
          stroke={task.is_important ? '#0B5CAB' : 'currentColor'}
        />
      </button>
    </div>
  )
}
