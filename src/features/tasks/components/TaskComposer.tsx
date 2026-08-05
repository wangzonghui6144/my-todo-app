'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import { useCreateTask } from '../hooks'

type TaskComposerProps = {
  listId: string
  defaults?: {
    is_important?: boolean
    my_day_on?: string | null
  }
}

export function TaskComposer({ listId, defaults }: TaskComposerProps) {
  const { locale } = useLocale()
  const createTask = useCreateTask()
  const [title, setTitle] = useState('')

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed || !listId) return
    try {
      await createTask.mutateAsync({
        list_id: listId,
        title: trimmed,
        is_important: defaults?.is_important,
        my_day_on: defaults?.my_day_on,
      })
      setTitle('')
    } catch (error) {
      console.error('Create task failed', error)
    }
  }

  return (
    <form
      className="flex items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <Plus className="size-4 shrink-0 text-[var(--color-accent)]" aria-hidden />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t(locale, 'task.add')}
        disabled={createTask.isPending || !listId}
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
      />
      <button
        type="submit"
        disabled={!title.trim() || createTask.isPending || !listId}
        className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
      >
        {t(locale, 'task.add')}
      </button>
    </form>
  )
}
