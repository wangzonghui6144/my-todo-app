'use client'

import { useState } from 'react'
import { Sun, Trash2, X } from 'lucide-react'
import type { Recurrence, Task } from '@/types/database'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import { useShellStore } from '@/features/ui/shell-store'
import { AttachmentList } from '@/features/attachments/components/AttachmentList'
import { todayLocalIso } from '../api'
import {
  useAddStep,
  useDeleteTask,
  useTask,
  useTaskSteps,
  useToggleStep,
  useUpdateTask,
} from '../hooks'

function toDatetimeLocal(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

type TaskDetailBodyProps = {
  task: Task
  onClose: () => void
}

function TaskDetailBody({ task, onClose }: TaskDetailBodyProps) {
  const { locale } = useLocale()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { data: steps = [] } = useTaskSteps(task.id)
  const addStep = useAddStep(task.id)
  const toggleStep = useToggleStep(task.id)

  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note)
  const [stepTitle, setStepTitle] = useState('')

  const today = todayLocalIso()
  const inMyDay = task.my_day_on === today

  const persist = (patch: Parameters<typeof updateTask.mutate>[0]['patch']) => {
    updateTask.mutate({ id: task.id, patch })
  }

  const handleDelete = async () => {
    if (!window.confirm(t(locale, 'task.deleteConfirm'))) return
    try {
      await deleteTask.mutateAsync(task.id)
      onClose()
    } catch (error) {
      console.error('Delete task failed', error)
    }
  }

  const handleAddStep = async () => {
    const trimmed = stepTitle.trim()
    if (!trimmed) return
    try {
      await addStep.mutateAsync(trimmed)
      setStepTitle('')
    } catch (error) {
      console.error('Add step failed', error)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-surface)] text-[var(--color-text)]">
      <div className="flex items-start gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <input
          type="checkbox"
          checked={task.is_completed}
          aria-label="Complete task"
          onChange={(e) => persist({ is_completed: e.target.checked })}
          className="mt-1.5 size-4 shrink-0 accent-[var(--color-accent)]"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const trimmed = title.trim()
            if (trimmed && trimmed !== task.title) persist({ title: trimmed })
            else setTitle(task.title)
          }}
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[var(--color-text)] outline-none"
        />
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t(locale, 'task.steps')}
          </p>
          <ul className="space-y-1">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={step.is_completed}
                  onChange={(e) =>
                    toggleStep.mutate({
                      id: step.id,
                      is_completed: e.target.checked,
                    })
                  }
                  className="size-3.5 accent-[var(--color-accent)]"
                />
                <span
                  className={[
                    'text-sm text-[var(--color-text)]',
                    step.is_completed
                      ? 'line-through text-[var(--color-text-muted)]'
                      : '',
                  ].join(' ')}
                >
                  {step.title}
                </span>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void handleAddStep()
            }}
          >
            <input
              value={stepTitle}
              onChange={(e) => setStepTitle(e.target.value)}
              placeholder={t(locale, 'task.addStep')}
              className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={!stepTitle.trim() || addStep.isPending}
              className="rounded-md px-2 py-1.5 text-sm text-[var(--color-accent)] hover:bg-[var(--color-bg)] disabled:opacity-50"
            >
              +
            </button>
          </form>
        </section>

        <button
          type="button"
          onClick={() => persist({ my_day_on: inMyDay ? null : today })}
          className={[
            'flex w-full items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm',
            inMyDay
              ? 'bg-[var(--color-sidebar)] text-[var(--color-accent)]'
              : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]',
          ].join(' ')}
        >
          <Sun className="size-4 shrink-0" />
          {t(locale, 'task.myDay')}
        </button>

        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t(locale, 'task.remind')}
          </span>
          <input
            type="datetime-local"
            value={toDatetimeLocal(task.remind_at)}
            onChange={(e) =>
              persist({ remind_at: fromDatetimeLocal(e.target.value) })
            }
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t(locale, 'task.due')}
          </span>
          <input
            type="datetime-local"
            value={toDatetimeLocal(task.due_at)}
            onChange={(e) =>
              persist({ due_at: fromDatetimeLocal(e.target.value) })
            }
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t(locale, 'task.recurrence')}
          </span>
          <select
            value={task.recurrence}
            onChange={(e) =>
              persist({ recurrence: e.target.value as Recurrence })
            }
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          >
            <option value="none">{t(locale, 'task.recurrence.none')}</option>
            <option value="daily">{t(locale, 'task.recurrence.daily')}</option>
            <option value="weekly">{t(locale, 'task.recurrence.weekly')}</option>
            <option value="weekdays">
              {t(locale, 'task.recurrence.weekdays')}
            </option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t(locale, 'task.note')}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== task.note) persist({ note })
            }}
            rows={4}
            className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <AttachmentList taskId={task.id} />
      </div>

      <div className="border-t border-[var(--color-border)] p-3">
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleteTask.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg)] disabled:opacity-50"
        >
          <Trash2 className="size-4" />
          {t(locale, 'task.delete')}
        </button>
      </div>
    </div>
  )
}

type TaskDetailHostProps = {
  taskId: string
  onClose: () => void
}

export function TaskDetailContent({ taskId, onClose }: TaskDetailHostProps) {
  const { data: task, isLoading, isError } = useTask(taskId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
        …
      </div>
    )
  }

  if (isError || !task) {
    return (
      <div className="flex h-full flex-col bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text)]">
        <button
          type="button"
          onClick={onClose}
          className="mb-3 self-end rounded-md p-1.5 hover:bg-[var(--color-bg)]"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        Task not found
      </div>
    )
  }

  return <TaskDetailBody key={task.id} task={task} onClose={onClose} />
}

export function TaskDetailPanel() {
  const selectedTaskId = useShellStore((s) => s.selectedTaskId)
  const selectTask = useShellStore((s) => s.selectTask)
  if (!selectedTaskId) return null
  return (
    <TaskDetailContent
      taskId={selectedTaskId}
      onClose={() => selectTask(null)}
    />
  )
}

export function TaskDetailSheet() {
  const selectedTaskId = useShellStore((s) => s.selectedTaskId)
  const selectTask = useShellStore((s) => s.selectTask)
  if (!selectedTaskId) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close detail"
        className="absolute inset-0 bg-black/40"
        onClick={() => selectTask(null)}
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-xl shadow-lg">
        <div className="min-h-0 flex-1 overflow-hidden">
          <TaskDetailContent
            taskId={selectedTaskId}
            onClose={() => selectTask(null)}
          />
        </div>
      </div>
    </div>
  )
}
