'use client'

import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import type { Locale } from '@/types/database'
import { useUpdateProfileSettings } from '../hooks'

export function LocaleToggle() {
  const { locale, setLocale } = useLocale()
  const updateSettings = useUpdateProfileSettings()

  const toggle = () => {
    const next: Locale = locale === 'zh' ? 'en' : 'zh'
    setLocale(next)
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
    updateSettings.mutate({ locale: next })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={updateSettings.isPending}
      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
      aria-label={t(locale, 'settings.locale')}
    >
      <span>{t(locale, 'settings.locale')}</span>
      <span className="font-semibold text-[var(--color-accent)]">
        {locale === 'zh' ? '中文' : 'EN'}
      </span>
    </button>
  )
}
