'use client'

import { TaskListView } from '@/features/tasks/components/TaskListView'
import { useLists } from '@/features/lists/hooks'

type ListTasksPageProps = {
  listId: string
}

export function ListTasksPage({ listId }: ListTasksPageProps) {
  const { data: lists = [] } = useLists()
  const list = lists.find((l) => l.id === listId)
  const title = list?.name || 'Tasks'

  return (
    <TaskListView title={title} listId={listId} composeListId={listId} />
  )
}
