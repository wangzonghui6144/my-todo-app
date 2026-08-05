'use client'

import { useState } from 'react'
import { Share2, X } from 'lucide-react'
import type { MemberRole } from '@/types/database'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import {
  useInviteToList,
  useListMembers,
  useRemoveListMember,
} from '../hooks'

type ShareListDialogProps = {
  listId: string
  listName: string
}

export function ShareListDialog({ listId, listName }: ShareListDialogProps) {
  const { locale } = useLocale()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Exclude<MemberRole, 'owner'>>('editor')
  const [error, setError] = useState<string | null>(null)

  const { data: members = [] } = useListMembers(open ? listId : null)
  const invite = useInviteToList(listId)
  const remove = useRemoveListMember(listId)

  const handleInvite = async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    setError(null)
    try {
      await invite.mutateAsync({ email: trimmed, role })
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, 'share.failed'))
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
        aria-label={t(locale, 'share.title')}
      >
        <Share2 className="size-4" />
        <span className="hidden sm:inline">{t(locale, 'share.title')}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-xl bg-[var(--color-surface)] p-4 shadow-lg sm:rounded-xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text)]">
                  {t(locale, 'share.title')}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">{listName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault()
                void handleInvite()
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t(locale, 'share.email')}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              />
              <div className="flex gap-2">
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as Exclude<MemberRole, 'owner'>)
                  }
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2 text-sm text-[var(--color-text)] outline-none"
                >
                  <option value="editor">{t(locale, 'share.role.editor')}</option>
                  <option value="viewer">{t(locale, 'share.role.viewer')}</option>
                </select>
                <button
                  type="submit"
                  disabled={!email.trim() || invite.isPending}
                  className="flex-1 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                >
                  {t(locale, 'share.invite')}
                </button>
              </div>
              {error && (
                <p className="text-xs text-[var(--color-danger)]" role="alert">
                  {error}
                </p>
              )}
            </form>

            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto">
              {members.length === 0 ? (
                <li className="text-sm text-[var(--color-text-muted)]">
                  {t(locale, 'share.empty')}
                </li>
              ) : (
                members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[var(--color-text)]">
                        {member.invited_email}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {member.role} · {member.status}
                      </p>
                    </div>
                    {member.role !== 'owner' && (
                      <button
                        type="button"
                        disabled={remove.isPending}
                        onClick={() => void remove.mutateAsync(member.id)}
                        className="shrink-0 text-xs text-[var(--color-danger)] hover:underline disabled:opacity-50"
                      >
                        {t(locale, 'share.remove')}
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  )
}
