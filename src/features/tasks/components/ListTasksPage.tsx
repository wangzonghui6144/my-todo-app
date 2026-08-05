'use client'

import { TaskListView } from '@/features/tasks/components/TaskListView'
import { ShareListDialog } from '@/features/sharing/components/ShareListDialog'
import { useLists } from '@/features/lists/hooks'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'

type ListTasksPageProps = {
  listId: string
}

export function ListTasksPage({ listId }: ListTasksPageProps) {
  const { locale } = useLocale()
  const { data: lists = [] } = useLists()
  const list = lists.find((l) => l.id === listId)
  const title = list?.name || t(locale, 'nav.tasks')
  const canShare = Boolean(list && !list.is_default)

  return (
    <TaskListView
      title={title}
      listId={listId}
      composeListId={listId}
      headerActions={
        canShare && list ? (
          <ShareListDialog listId={list.id} listName={list.name} />
        ) : null
      }
    />
  )
}
