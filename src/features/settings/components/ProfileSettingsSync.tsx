'use client'

import { useEffect } from 'react'
import { useLocale } from '@/lib/i18n/provider'
import { useProfile } from '../hooks'

/** Hydrates locale/theme from profiles once available. */
export function ProfileSettingsSync() {
  const { locale, setLocale } = useLocale()
  const { data: profile } = useProfile()

  useEffect(() => {
    if (!profile) return
    if (profile.locale && profile.locale !== locale) {
      setLocale(profile.locale)
      document.documentElement.lang =
        profile.locale === 'zh' ? 'zh-CN' : 'en'
    }
    if (profile.theme) {
      document.documentElement.dataset.theme = profile.theme
    }
  }, [profile, locale, setLocale])

  return null
}
