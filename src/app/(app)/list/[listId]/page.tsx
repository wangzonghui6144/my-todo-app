type ListPageProps = {
  params: Promise<{ listId: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { listId } = await params
  return <p className="p-4 text-[var(--color-text)]">List: {listId}</p>
}
