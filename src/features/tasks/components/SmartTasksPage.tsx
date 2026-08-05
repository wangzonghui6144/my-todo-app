'use client'

import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import { useDefaultList } from '@/features/lists/hooks'
import { todayLocalIso } from '@/features/tasks/api'
import { isImportant, isMyDay, isPlanned } from '@/features/tasks/lib/smart-filters'
import { TaskListView } from '@/features/tasks/components/TaskListView'

type SmartKind = 'myday' | 'important' | 'planned'

const titleKey = {
  myday: 'nav.myday',
  important: 'nav.important',
  planned: 'nav.planned',
} as const

function formatToday(locale: 'zh' | 'en') {
  const now = new Date()
  if (locale === 'zh') {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `星期${weekdays[now.getDay()]} · ${now.getMonth() + 1}月${now.getDate()}日`
  }
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function SmartTasksPage({ kind }: { kind: SmartKind }) {
  const { locale } = useLocale()
  const { data: defaultList } = useDefaultList()
  const today = todayLocalIso()

  const filter =
    kind === 'myday'
      ? (task: Parameters<typeof isMyDay>[0]) => isMyDay(task, today)
      : kind === 'important'
        ? isImportant
        : isPlanned

  const composeDefaults =
    kind === 'myday'
      ? { my_day_on: today }
      : kind === 'important'
        ? { is_important: true }
        : undefined

  return (
    <TaskListView
      title={t(locale, titleKey[kind])}
      subtitle={kind === 'myday' ? formatToday(locale) : undefined}
      composeListId={defaultList?.id}
      filter={filter}
      composeDefaults={composeDefaults}
      variant={kind}
    />
  )
}
