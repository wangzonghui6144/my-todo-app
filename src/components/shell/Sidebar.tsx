'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, Inbox, ListTodo, Pencil, Plus, Star, Sun, Trash2 } from 'lucide-react'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import {
  useCreateList,
  useDeleteList,
  useLists,
  useUpdateList,
} from '@/features/lists/hooks'
import { LocaleToggle } from '@/features/settings/components/LocaleToggle'
import { ThemeToggle } from '@/features/settings/components/ThemeToggle'
import { useShellStore } from '@/features/ui/shell-store'
import type { List } from '@/types/database'

function navClass(active: boolean) {
  return [
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
    active
      ? 'bg-[var(--color-surface)] font-semibold text-[var(--color-accent)]'
      : 'text-[var(--color-text)] hover:bg-[var(--color-surface)]',
  ].join(' ')
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { locale } = useLocale()
  const { data: lists = [], isLoading } = useLists()
  const createList = useCreateList()
  const updateList = useUpdateList()
  const deleteList = useDeleteList()
  const setDrawerOpen = useShellStore((s) => s.setDrawerOpen)

  const defaultList = lists.find((l) => l.is_default)
  const customLists = lists.filter((l) => !l.is_default)

  const closeDrawer = () => setDrawerOpen(false)

  const handleNewList = async () => {
    const name = window.prompt(t(locale, 'nav.newList'))
    if (!name?.trim()) return
    try {
      const list = await createList.mutateAsync(name.trim())
      closeDrawer()
      router.push(`/list/${list.id}`)
    } catch (error) {
      console.error('Create list failed', error)
    }
  }

  const handleRename = async (list: List) => {
    const name = window.prompt(t(locale, 'nav.renameList'), list.name)
    if (!name?.trim() || name.trim() === list.name) return
    try {
      await updateList.mutateAsync({ id: list.id, patch: { name: name.trim() } })
    } catch (error) {
      console.error('Rename list failed', error)
    }
  }

  const handleDelete = async (list: List) => {
    if (!window.confirm(t(locale, 'nav.deleteListConfirm'))) return
    try {
      await deleteList.mutateAsync(list.id)
      if (pathname === `/list/${list.id}`) {
        closeDrawer()
        router.push('/myday')
      }
    } catch (error) {
      console.error('Delete list failed', error)
    }
  }

  return (
    <aside className="flex h-full flex-col bg-[var(--color-sidebar)] text-[var(--color-text)]">
      <div className="border-b border-[var(--color-border)] px-4 py-4">
        <p className="text-base font-semibold tracking-tight">To Do</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <Link
          href="/myday"
          onClick={closeDrawer}
          className={navClass(pathname === '/myday')}
        >
          <Sun className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.myday')}
        </Link>
        <Link
          href="/important"
          onClick={closeDrawer}
          className={navClass(pathname === '/important')}
        >
          <Star className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.important')}
        </Link>
        <Link
          href="/planned"
          onClick={closeDrawer}
          className={navClass(pathname === '/planned')}
        >
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.planned')}
        </Link>
        <Link
          href="/invites"
          onClick={closeDrawer}
          className={navClass(pathname === '/invites')}
        >
          <Inbox className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.invites')}
        </Link>

        {defaultList && (
          <Link
            href={`/list/${defaultList.id}`}
            onClick={closeDrawer}
            className={navClass(pathname === `/list/${defaultList.id}`)}
          >
            <ListTodo className="size-4 shrink-0" aria-hidden />
            {defaultList.name || t(locale, 'nav.tasks')}
          </Link>
        )}

        <div className="my-2 border-t border-[var(--color-border)]" />

        {isLoading && (
          <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">…</p>
        )}

        {customLists.map((list) => (
          <div
            key={list.id}
            className="group flex items-center gap-0.5"
          >
            <Link
              href={`/list/${list.id}`}
              onClick={closeDrawer}
              className={`${navClass(pathname === `/list/${list.id}`)} min-w-0 flex-1`}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: list.color || 'var(--color-accent)' }}
                aria-hidden
              />
              <span className="truncate">{list.name}</span>
            </Link>
            <button
              type="button"
              aria-label={t(locale, 'nav.renameList')}
              onClick={() => void handleRename(list)}
              disabled={updateList.isPending}
              className="rounded p-1.5 text-[var(--color-text-muted)] opacity-0 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t(locale, 'nav.deleteList')}
              onClick={() => void handleDelete(list)}
              disabled={deleteList.isPending}
              className="rounded p-1.5 text-[var(--color-text-muted)] opacity-0 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-[var(--color-border)] p-2">
        <button
          type="button"
          onClick={handleNewList}
          disabled={createList.isPending}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.newList')}
        </button>
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </aside>
  )
}
