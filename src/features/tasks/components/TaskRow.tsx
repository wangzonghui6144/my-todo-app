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
  const dueLabel = task.due_at
    ? new Date(task.due_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null

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
        'task-row',
        selected ? 'task-row--selected' : '',
        task.is_completed ? 'task-row--done' : '',
      ]
        .filter(Boolean)
        .join(' ')}
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
        className="task-row__check"
      />

      <div className="task-row__body">
        <span className="task-row__title">{task.title}</span>
        {dueLabel ? <span className="task-row__meta">{dueLabel}</span> : null}
      </div>

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
        className="task-row__star"
      >
        <Star
          className="size-4"
          fill={task.is_important ? 'currentColor' : 'none'}
        />
      </button>
    </div>
  )
}
