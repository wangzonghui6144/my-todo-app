import { describe, it, expect } from 'vitest'
import { t } from './messages'

describe('t', () => {
  it('returns Chinese for zh', () => {
    expect(t('zh', 'nav.tasks')).toBe('任务')
  })
  it('returns English for en', () => {
    expect(t('en', 'nav.tasks')).toBe('Tasks')
  })
})
