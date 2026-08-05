import { describe, it, expect } from 'vitest'
import { isMyDay, isImportant, isPlanned } from './smart-filters'
import type { Task } from '@/types/database'

const base: Task = {
  id: '1', user_id: 'u', list_id: 'l', title: 't', note: '',
  is_completed: false, completed_at: null, is_important: false,
  my_day_on: null, due_at: null, remind_at: null, recurrence: 'none',
  sort_order: 0, created_at: '', updated_at: '',
}

describe('smart filters', () => {
  it('my day matches today date string', () => {
    expect(isMyDay({ ...base, my_day_on: '2026-08-05' }, '2026-08-05')).toBe(true)
    expect(isMyDay({ ...base, my_day_on: '2026-08-04' }, '2026-08-05')).toBe(false)
  })
  it('important flag', () => {
    expect(isImportant({ ...base, is_important: true })).toBe(true)
  })
  it('planned when due or remind set', () => {
    expect(isPlanned({ ...base, due_at: '2026-08-06T00:00:00Z' })).toBe(true)
    expect(isPlanned({ ...base, remind_at: '2026-08-06T00:00:00Z' })).toBe(true)
    expect(isPlanned(base)).toBe(false)
  })
})
