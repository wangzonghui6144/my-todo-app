'use client'

import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import {
  usePendingInvites,
  useRespondToInvite,
} from '@/features/sharing/hooks'

export default function InvitesPage() {
  const { locale } = useLocale()
  const { data: invites = [], isLoading } = usePendingInvites()
  const respond = useRespondToInvite()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          {t(locale, 'share.invites')}
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">…</p>
        ) : invites.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            {t(locale, 'share.noInvites')}
          </p>
        ) : (
          <ul className="space-y-3">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {t(locale, 'share.invites')}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {t(locale, 'share.roleLabel')}: {invite.role}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={respond.isPending}
                    onClick={() =>
                      void respond.mutateAsync({
                        memberId: invite.id,
                        status: 'accepted',
                      })
                    }
                    className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                  >
                    {t(locale, 'share.accept')}
                  </button>
                  <button
                    type="button"
                    disabled={respond.isPending}
                    onClick={() =>
                      void respond.mutateAsync({
                        memberId: invite.id,
                        status: 'declined',
                      })
                    }
                    className="rounded-md px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-50"
                  >
                    {t(locale, 'share.decline')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
