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

export function SmartTasksPage({ kind }: { kind: SmartKind }) {
  const { locale } = useLocale()
  const { data: defaultList } = useDefaultList()
  const today = todayLocalIso()
  const composeListId = defaultList?.id ?? ''

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

  const headerClassName =
    kind === 'myday'
      ? 'border-transparent bg-gradient-to-br from-[#0a4f96] to-[#4a9fe0] text-white'
      : undefined

  return (
    <TaskListView
      title={t(locale, titleKey[kind])}
      composeListId={composeListId}
      filter={filter}
      composeDefaults={composeDefaults}
      headerClassName={headerClassName}
    />
  )
}
