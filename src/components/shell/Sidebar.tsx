'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, ListTodo, Plus, Star, Sun } from 'lucide-react'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import { useCreateList, useLists } from '@/features/lists/hooks'
import { useShellStore } from '@/features/ui/shell-store'

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
          <Link
            key={list.id}
            href={`/list/${list.id}`}
            onClick={closeDrawer}
            className={navClass(pathname === `/list/${list.id}`)}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: list.color || 'var(--color-accent)' }}
              aria-hidden
            />
            {list.name}
          </Link>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-2">
        <button
          type="button"
          onClick={handleNewList}
          disabled={createList.isPending}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          {t(locale, 'nav.newList')}
        </button>
      </div>
    </aside>
  )
}
