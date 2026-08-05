import { ListTasksPage } from '@/features/tasks/components/ListTasksPage'

type ListPageProps = {
  params: Promise<{ listId: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { listId } = await params
  return <ListTasksPage listId={listId} />
}
