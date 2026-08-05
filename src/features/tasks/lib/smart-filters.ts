import type { Task } from '@/types/database'

export function isMyDay(task: Task, todayIsoDate: string): boolean {
  return task.my_day_on === todayIsoDate
}

export function isImportant(task: Task): boolean {
  return task.is_important
}

export function isPlanned(task: Task): boolean {
  return task.due_at != null || task.remind_at != null
}
