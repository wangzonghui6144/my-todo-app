export type Locale = 'zh' | 'en'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'weekdays'
export type MemberRole = 'owner' | 'editor' | 'viewer'
export type MemberStatus = 'pending' | 'accepted' | 'declined'

export interface Profile {
  id: string
  display_name: string
  locale: Locale
  theme: string
  created_at: string
  updated_at: string
}

export interface List {
  id: string
  owner_id: string
  name: string
  color: string
  icon: string | null
  sort_order: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  list_id: string
  title: string
  note: string
  is_completed: boolean
  completed_at: string | null
  is_important: boolean
  my_day_on: string | null
  due_at: string | null
  remind_at: string | null
  recurrence: Recurrence
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TaskStep {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  sort_order: number
}
