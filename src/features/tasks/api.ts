import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/types/database'

export async function fetchTasksForList(listId: string): Promise<Task[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Task[]
}

export async function fetchAllTasks(): Promise<Task[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Task[]
}

export async function fetchTask(id: string): Promise<Task> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Task
}

export async function createTask(input: {
  list_id: string
  title: string
  is_important?: boolean
  my_day_on?: string | null
}): Promise<Task> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      list_id: input.list_id,
      title: input.title.trim(),
      is_important: input.is_important ?? false,
      my_day_on: input.my_day_on ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Task
}

export type TaskPatch = Partial<
  Pick<
    Task,
    | 'title'
    | 'note'
    | 'is_completed'
    | 'is_important'
    | 'my_day_on'
    | 'due_at'
    | 'remind_at'
    | 'recurrence'
    | 'list_id'
    | 'sort_order'
  >
>

export async function updateTask(id: string, patch: TaskPatch): Promise<Task> {
  const supabase = createClient()
  const payload = {
    ...patch,
    updated_at: new Date().toISOString(),
    completed_at:
      patch.is_completed === true
        ? new Date().toISOString()
        : patch.is_completed === false
          ? null
          : undefined,
  }
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export function todayLocalIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
