import type { Locale } from '@/types/database'

const dict = {
  zh: {
    'nav.tasks': '任务',
    'nav.myday': '我的一天',
    'nav.important': '重要',
    'nav.planned': '已计划',
    'nav.newList': '新建列表',
    'task.add': '添加任务',
    'auth.signIn': '登录',
    'auth.signUp': '注册',
  },
  en: {
    'nav.tasks': 'Tasks',
    'nav.myday': 'My Day',
    'nav.important': 'Important',
    'nav.planned': 'Planned',
    'nav.newList': 'New list',
    'task.add': 'Add a task',
    'auth.signIn': 'Sign in',
    'auth.signUp': 'Sign up',
  },
} as const

export type MessageKey = keyof typeof dict.zh

export function t(locale: Locale, key: MessageKey): string {
  return dict[locale][key] ?? dict.en[key] ?? key
}
