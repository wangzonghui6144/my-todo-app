'use client'

import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import { useProfile, useUpdateProfileSettings } from '../hooks'

function applyTheme(theme: string) {
  document.documentElement.dataset.theme = theme
}

export function ThemeToggle() {
  const { locale } = useLocale()
  const { data: profile } = useProfile()
  const updateSettings = useUpdateProfileSettings()
  const theme = profile?.theme === 'dark' ? 'dark' : 'light'

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    updateSettings.mutate({ theme: next })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={updateSettings.isPending}
      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
      aria-label={t(locale, 'settings.theme')}
    >
      <span>{t(locale, 'settings.theme')}</span>
      <span className="font-semibold text-[var(--color-accent)]">
        {theme === 'dark'
          ? t(locale, 'settings.theme.dark')
          : t(locale, 'settings.theme.light')}
      </span>
    </button>
  )
}
