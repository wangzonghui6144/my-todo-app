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

export async function fetchDefaultList(): Promise<List> {
  const lists = await fetchLists()
  const def = lists.find((l) => l.is_default)
  if (!def) throw new Error('Default Tasks list missing')
  return def
}

export async function createList(name: string, color = '#0B5CAB'): Promise<List> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('lists')
    .insert({ owner_id: user.id, name, color, is_default: false })
    .select('*')
    .single()
  if (error) throw error
  return data as List
}
