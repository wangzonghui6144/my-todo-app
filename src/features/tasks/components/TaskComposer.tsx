'use client'

import { useState } from 'react'
import { LoaderCircle, Plus } from 'lucide-react'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import { useDefaultList } from '@/features/lists/hooks'
import { useCreateTask } from '../hooks'

type TaskComposerProps = {
  listId?: string
  defaults?: {
    is_important?: boolean
    my_day_on?: string | null
  }
}

export function TaskComposer({ listId, defaults }: TaskComposerProps) {
  const { locale } = useLocale()
  const createTask = useCreateTask()
  const defaultList = useDefaultList()
  const resolvedListId = listId || defaultList.data?.id || ''
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return

    if (!resolvedListId) {
      setError(t(locale, 'task.noList'))
      return
    }

    setError(null)
    try {
      await createTask.mutateAsync({
        list_id: resolvedListId,
        title: trimmed,
        is_important: defaults?.is_important,
        my_day_on: defaults?.my_day_on,
      })
      setTitle('')
    } catch (err) {
      console.error('Create task failed', err)
      const message =
        err instanceof Error ? err.message : t(locale, 'task.createFailed')
      setError(message)
    }
  }

  const waitingForList = !resolvedListId && defaultList.isLoading

  return (
    <div className="composer-bar">
      <form
        className="composer-form"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div className="composer-input-wrap">
          {waitingForList || createTask.isPending ? (
            <LoaderCircle
              className="size-4 shrink-0 animate-spin text-[var(--color-accent)]"
              aria-hidden
            />
          ) : (
            <Plus
              className="size-4 shrink-0 text-[var(--color-accent)]"
              aria-hidden
            />
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError(null)
            }}
            placeholder={t(locale, 'task.add')}
            disabled={createTask.isPending || waitingForList}
            className="composer-input"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!title.trim() || createTask.isPending || waitingForList}
            className="composer-submit"
          >
            {t(locale, 'task.add')}
          </button>
        </div>
      </form>
      {error ? <p className="composer-error">{error}</p> : null}
    </div>
  )
}
