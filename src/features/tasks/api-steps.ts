import { createClient } from '@/lib/supabase/client'
import type { TaskStep } from '@/types/database'

export async function fetchSteps(taskId: string): Promise<TaskStep[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_steps')
    .select('*')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data as TaskStep[]
}

export async function addStep(taskId: string, title: string): Promise<TaskStep> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_steps')
    .insert({ task_id: taskId, title: title.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data as TaskStep
}

export async function toggleStep(id: string, is_completed: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('task_steps')
    .update({ is_completed })
    .eq('id', id)
  if (error) throw error
}

export async function deleteStep(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('task_steps').delete().eq('id', id)
  if (error) throw error
}
