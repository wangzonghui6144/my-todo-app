'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarDays,
  Inbox,
  ListTodo,
  Pencil,
  Plus,
  Star,
  Sun,
  Trash2,
} from 'lucide-react'
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
  return ['side-link', active ? 'side-link--active' : ''].filter(Boolean).join(' ')
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
        if (defaultList) router.push(`/list/${defaultList.id}`)
        else router.push('/myday')
      }
    } catch (error) {
      console.error('Delete list failed', error)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden />
        <p className="sidebar__title">To Do</p>
      </div>

      <nav className="sidebar__nav">
        <Link href="/myday" prefetch onClick={closeDrawer} className={navClass(pathname === '/myday')}>
          <Sun className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.myday')}
        </Link>
        <Link href="/important" prefetch onClick={closeDrawer} className={navClass(pathname === '/important')}>
          <Star className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.important')}
        </Link>
        <Link href="/planned" prefetch onClick={closeDrawer} className={navClass(pathname === '/planned')}>
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.planned')}
        </Link>
        {defaultList ? (
          <Link
            href={`/list/${defaultList.id}`}
            prefetch
            onClick={closeDrawer}
            className={navClass(pathname === `/list/${defaultList.id}`)}
          >
            <ListTodo className="size-4 shrink-0" aria-hidden />
            {defaultList.name || t(locale, 'nav.tasks')}
          </Link>
        ) : null}
        <Link href="/invites" prefetch onClick={closeDrawer} className={navClass(pathname === '/invites')}>
          <Inbox className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.invites')}
        </Link>

        <div className="sidebar__divider" />

        {isLoading ? (
          <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">…</p>
        ) : null}

        {customLists.map((list) => (
          <div key={list.id} className="group flex items-center gap-0.5">
            <Link
              href={`/list/${list.id}`}
              prefetch
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
              className="side-icon-btn"
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t(locale, 'nav.deleteList')}
              onClick={() => void handleDelete(list)}
              disabled={deleteList.isPending}
              className="side-icon-btn"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          onClick={handleNewList}
          disabled={createList.isPending}
          className="side-link w-full"
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
