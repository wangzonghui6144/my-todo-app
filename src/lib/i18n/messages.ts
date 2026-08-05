import type { Locale } from '@/types/database'

const dict = {
  zh: {
    'nav.tasks': '任务',
    'nav.myday': '我的一天',
    'nav.important': '重要',
    'nav.planned': '已计划',
    'nav.newList': '新建列表',
    'task.add': '添加任务',
    'task.steps': '步骤',
    'task.addStep': '添加步骤',
    'task.myDay': '添加到我的一天',
    'task.remind': '提醒',
    'task.due': '截止日期',
    'task.recurrence': '重复',
    'task.recurrence.none': '不重复',
    'task.recurrence.daily': '每天',
    'task.recurrence.weekly': '每周',
    'task.recurrence.weekdays': '工作日',
    'task.note': '备注',
    'task.delete': '删除任务',
    'task.deleteConfirm': '确定删除此任务？',
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
    'task.steps': 'Steps',
    'task.addStep': 'Add a step',
    'task.myDay': 'Add to My Day',
    'task.remind': 'Remind me',
    'task.due': 'Due date',
    'task.recurrence': 'Repeat',
    'task.recurrence.none': 'Does not repeat',
    'task.recurrence.daily': 'Daily',
    'task.recurrence.weekly': 'Weekly',
    'task.recurrence.weekdays': 'Weekdays',
    'task.note': 'Note',
    'task.delete': 'Delete task',
    'task.deleteConfirm': 'Delete this task?',
    'auth.signIn': 'Sign in',
    'auth.signUp': 'Sign up',
  },
} as const

export type MessageKey = keyof typeof dict.zh

export function t(locale: Locale, key: MessageKey): string {
  return dict[locale][key] ?? dict.en[key] ?? key
}
