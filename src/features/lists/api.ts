import { createClient } from '@/lib/supabase/client'
import type { List } from '@/types/database'

export async function fetchLists(): Promise<List[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data as List[]
}

export async function fetchDefaultList(): Promise<List | null> {
  const lists = await fetchLists()
  return lists.find((l) => l.is_default) ?? null
}

/** Ensures profile + default Tasks list exist (covers missing signup trigger / migrations). */
export async function ensureDefaultList(): Promise<List> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const existing = await fetchDefaultList()
  if (existing) return existing

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      display_name:
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split('@')[0] ||
        '',
      locale: 'zh',
      theme: 'light',
    },
    { onConflict: 'id' }
  )

  const { data, error } = await supabase
    .from('lists')
    .insert({
      owner_id: user.id,
      name: '任务',
      color: '#0B5CAB',
      is_default: true,
      sort_order: 0,
    })
    .select('*')
    .single()

  if (error) {
    const again = await fetchDefaultList()
    if (again) return again
    throw error
  }
  return data as List
}

export async function createList(name: string, color = '#0B5CAB'): Promise<List> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await ensureDefaultList()
  const { data, error } = await supabase
    .from('lists')
    .insert({ owner_id: user.id, name, color, is_default: false })
    .select('*')
    .single()
  if (error) throw error
  return data as List
}

export async function updateList(
  id: string,
  patch: { name?: string; color?: string }
): Promise<List> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as List
}

export async function deleteList(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw error
}
