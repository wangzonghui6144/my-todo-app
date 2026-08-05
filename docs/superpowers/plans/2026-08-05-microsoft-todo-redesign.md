# Microsoft To Do Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `my-todo-app` into a Microsoft To Do–parity app: Supabase-backed lists/tasks with smart views, Fluent mobile-first UI, default landing on Tasks (待办).

**Architecture:** Feature modules + `@supabase/ssr`; RLS on all tables; React Query for server state; Zustand for UI shell only; pages never call `supabase.from` directly.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, Supabase (Auth/Postgres/Storage/Realtime), TanStack Query, Zustand, zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-05-microsoft-todo-redesign-design.md`

---

## Scope note

P0 from the spec is large. This plan is ordered so each task leaves the app buildable. Later tasks (attachments, sharing) depend on earlier ones.

## File map (create / replace)

| Path | Responsibility |
|------|----------------|
| `supabase/migrations/20260805000000_init.sql` | Schema, RLS, signup trigger, storage policies |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client (cookies) |
| `src/lib/supabase/middleware.ts` | Session refresh helper |
| `src/middleware.ts` | Auth gate + locale cookie passthrough |
| `src/types/database.ts` | Generated-or-hand types for tables |
| `src/lib/i18n/messages.ts` | zh/en dictionaries |
| `src/lib/i18n/provider.tsx` | Locale context |
| `src/features/auth/*` | Sign in/up, session hooks |
| `src/features/lists/*` | List queries/mutations + sidebar |
| `src/features/tasks/*` | Task queries/mutations, smart filters, list/detail UI |
| `src/features/sharing/*` | Invites + members |
| `src/features/attachments/*` | Upload/download/delete |
| `src/features/settings/*` | Locale + theme |
| `src/components/ui/*` | Button, Checkbox, Sheet, Drawer, Toast |
| `src/components/shell/*` | AppShell, Sidebar, DetailHost |
| `src/app/(auth)/login/page.tsx` | Auth page |
| `src/app/(app)/layout.tsx` | Authenticated shell |
| `src/app/(app)/page.tsx` | Redirect to default Tasks list |
| `src/app/(app)/list/[listId]/page.tsx` | List + tasks |
| `src/app/(app)/myday/page.tsx` | Smart: My Day |
| `src/app/(app)/important/page.tsx` | Smart: Important |
| `src/app/(app)/planned/page.tsx` | Smart: Planned |
| `src/app/globals.css` | Design tokens (contrast-safe) |
| `vitest.config.ts` + `src/**/*.test.ts` | Unit tests |

**Delete / stop using after cutover:** `src/components/TodoList.tsx`, `TodoForm.tsx`, `CategoryManager.tsx`, old `src/store/authStore.ts` (replace with feature auth), old single `src/lib/supabase.ts`.

---

### Task 1: Tooling — Vitest + deps

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/tasks/smart-filters.ts` (stub for TDD in Task 6)
- Modify: `package.json`

- [ ] **Step 1: Add dependencies**

```bash
cd /Users/aigc/Project/my-todo-app
npm install @supabase/ssr
npm install -D vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Add Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Add scripts to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest and @supabase/ssr"
```

---

### Task 2: Design tokens & global CSS

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace globals with Fluent tokens (contrast-safe)**

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --color-accent: #0b5cab;
  --color-accent-hover: #0a4f96;
  --color-bg: #eef3f8;
  --color-surface: #ffffff;
  --color-sidebar: #f3f6f9;
  --color-border: #d8dee6;
  --color-text: #1b1a19;
  --color-text-secondary: #323130;
  --color-text-muted: #605e5c;
  --color-danger: #a4262c;
  --font-sans: "Segoe UI Variable", "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
  --shell-sidebar: 220px;
  --shell-detail: 300px;
}

@theme inline {
  --color-background: var(--color-bg);
  --color-foreground: var(--color-text);
  --font-sans: var(--font-sans);
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

@media (min-width: 1280px) {
  :root {
    --shell-sidebar: 240px;
    --shell-detail: 320px;
  }
}
```

- [ ] **Step 2: Update root layout metadata + font stack (no Inter)**

```tsx
// src/app/layout.tsx — use system/Segoe stack via className on body, drop next/font Inter
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'To Do',
  description: 'Microsoft To Do–style task manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans text-[var(--color-text)] bg-[var(--color-bg)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "style: add Fluent design tokens and contrast-safe defaults"
```

---

### Task 3: Database migration + RLS

**Files:**
- Create: `supabase/migrations/20260805000000_init.sql`

- [ ] **Step 1: Write full init migration**

```sql
-- supabase/migrations/20260805000000_init.sql

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  locale text not null default 'zh' check (locale in ('zh', 'en')),
  theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  color text not null default '#0B5CAB',
  icon text,
  sort_order int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index lists_one_default_per_owner
  on public.lists (owner_id)
  where is_default;

create table public.list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  invited_email text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  status text not null check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.recurrence_kind as enum ('none', 'daily', 'weekly', 'weekdays');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  title text not null,
  note text not null default '',
  is_completed boolean not null default false,
  completed_at timestamptz,
  is_important boolean not null default false,
  my_day_on date,
  due_at timestamptz,
  remind_at timestamptz,
  recurrence public.recurrence_kind not null default 'none',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

-- Membership helper
create or replace function public.is_list_member(p_list_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lists l
    where l.id = p_list_id and l.owner_id = p_user_id
  ) or exists (
    select 1 from public.list_members m
    where m.list_id = p_list_id
      and m.user_id = p_user_id
      and m.status = 'accepted'
  );
$$;

create or replace function public.can_edit_list(p_list_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lists l
    where l.id = p_list_id and l.owner_id = p_user_id
  ) or exists (
    select 1 from public.list_members m
    where m.list_id = p_list_id
      and m.user_id = p_user_id
      and m.status = 'accepted'
      and m.role in ('owner', 'editor')
  );
$$;

alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_steps enable row level security;
alter table public.attachments enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

create policy lists_select on public.lists
  for select using (public.is_list_member(id, auth.uid()));
create policy lists_insert on public.lists
  for insert with check (owner_id = auth.uid());
create policy lists_update on public.lists
  for update using (owner_id = auth.uid());
create policy lists_delete on public.lists
  for delete using (owner_id = auth.uid() and is_default = false);

create policy list_members_select on public.list_members
  for select using (public.is_list_member(list_id, auth.uid()));
create policy list_members_insert on public.list_members
  for insert with check (
    exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid())
  );
create policy list_members_update on public.list_members
  for update using (
    exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid())
    or (user_id = auth.uid())
  );
create policy list_members_delete on public.list_members
  for delete using (
    exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid())
  );

create policy tasks_select on public.tasks
  for select using (public.is_list_member(list_id, auth.uid()));
create policy tasks_insert on public.tasks
  for insert with check (
    user_id = auth.uid() and public.can_edit_list(list_id, auth.uid())
  );
create policy tasks_update on public.tasks
  for update using (public.can_edit_list(list_id, auth.uid()));
create policy tasks_delete on public.tasks
  for delete using (public.can_edit_list(list_id, auth.uid()));

create policy steps_select on public.task_steps
  for select using (
    exists (select 1 from public.tasks t where t.id = task_id and public.is_list_member(t.list_id, auth.uid()))
  );
create policy steps_mutate on public.task_steps
  for all using (
    exists (select 1 from public.tasks t where t.id = task_id and public.can_edit_list(t.list_id, auth.uid()))
  )
  with check (
    exists (select 1 from public.tasks t where t.id = task_id and public.can_edit_list(t.list_id, auth.uid()))
  );

create policy attachments_select on public.attachments
  for select using (
    exists (select 1 from public.tasks t where t.id = task_id and public.is_list_member(t.list_id, auth.uid()))
  );
create policy attachments_mutate on public.attachments
  for all using (
    exists (select 1 from public.tasks t where t.id = task_id and public.can_edit_list(t.list_id, auth.uid()))
  )
  with check (
    exists (select 1 from public.tasks t where t.id = task_id and public.can_edit_list(t.list_id, auth.uid()))
  );

-- Signup: profile + default Tasks list
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'zh'
  );
  insert into public.lists (owner_id, name, is_default, sort_order)
  values (new.id, '任务', true, 0);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;
```

- [ ] **Step 2: Apply migration in Supabase**

Run (choose one):
- Supabase CLI: `supabase db push`
- Or paste SQL into Supabase SQL editor (after dropping old `todos`/`categories` if present)

Expected: tables exist; new signup creates profile + default list.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260805000000_init.sql
git commit -m "feat(db): init schema, RLS, signup trigger, attachments bucket"
```

---

### Task 4: Supabase clients + middleware

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`
- Delete: `src/lib/supabase.ts` (after cutover)

- [ ] **Step 1: Browser client**

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Server client**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* called from Server Component — ignore */
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Middleware helper + gate**

```ts
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return { supabaseResponse, user }
}
```

```ts
// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const path = request.nextUrl.pathname
  const isAuth = path.startsWith('/login')

  if (!user && !isAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  if (user && isAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase src/middleware.ts
git commit -m "feat(auth): add supabase ssr clients and route middleware"
```

---

### Task 5: Types + i18n foundation

**Files:**
- Create: `src/types/database.ts`
- Create: `src/lib/i18n/messages.ts`
- Create: `src/lib/i18n/provider.tsx`
- Create: `src/lib/i18n/messages.test.ts`

- [ ] **Step 1: Write failing i18n test**

```ts
// src/lib/i18n/messages.test.ts
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- src/lib/i18n/messages.test.ts
```

Expected: cannot find module / `t` not defined

- [ ] **Step 3: Implement messages + types**

```ts
// src/types/database.ts
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
```

```ts
// src/lib/i18n/messages.ts
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
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- src/lib/i18n/messages.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/types/database.ts src/lib/i18n
git commit -m "feat(i18n): add locale dictionaries and core DB types"
```

---

### Task 6: Smart-list filter helpers (TDD)

**Files:**
- Create: `src/features/tasks/lib/smart-filters.ts`
- Create: `src/features/tasks/lib/smart-filters.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/features/tasks/lib/smart-filters.test.ts
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
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- src/features/tasks/lib/smart-filters.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/features/tasks/lib/smart-filters.ts
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
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm test -- src/features/tasks/lib/smart-filters.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/tasks/lib
git commit -m "feat(tasks): add smart list filter helpers with tests"
```

---

### Task 7: Auth feature + login page

**Files:**
- Create: `src/features/auth/api.ts`
- Create: `src/features/auth/components/AuthForm.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/providers.tsx`
- Remove usage of: `src/store/authStore.ts`, `src/app/auth/page.tsx`

- [ ] **Step 1: Auth API helpers**

```ts
// src/features/auth/api.ts
import { createClient } from '@/lib/supabase/client'

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(email: string, password: string, name: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw error
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
```

- [ ] **Step 2: Build `AuthForm` with zod (email/password; signup includes name)** — use primary `#0B5CAB`, text `#1B1A19`, no indigo.

- [ ] **Step 3: `src/app/(auth)/login/page.tsx` renders `AuthForm`; delete redirect to old `/auth`.**

- [ ] **Step 4: Manual test**

```bash
npm run dev
```

Expected: `/` redirects to `/login` when logged out; signup creates default 任务 list in DB.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth src/app/\(auth\) src/app/providers.tsx
git commit -m "feat(auth): email/password login with ssr session"
```

---

### Task 8: Lists API + default redirect

**Files:**
- Create: `src/features/lists/api.ts`
- Create: `src/features/lists/hooks.ts`
- Create: `src/app/(app)/page.tsx`
- Create: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Lists API**

```ts
// src/features/lists/api.ts
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('lists')
    .insert({ owner_id: user.id, name, color, is_default: false })
    .select('*')
    .single()
  if (error) throw error
  return data as List
}
```

- [ ] **Step 2: Home redirects to default list**

```tsx
// src/app/(app)/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppIndexPage() {
  const supabase = await createClient()
  const { data: list, error } = await supabase
    .from('lists')
    .select('id')
    .eq('is_default', true)
    .single()
  if (error || !list) redirect('/login')
  redirect(`/list/${list.id}`)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/lists src/app/\(app\)
git commit -m "feat(lists): fetch lists and redirect home to default Tasks"
```

---

### Task 9: App shell (mobile drawer + desktop grid)

**Files:**
- Create: `src/components/shell/AppShell.tsx`
- Create: `src/components/shell/Sidebar.tsx`
- Create: `src/features/ui/shell-store.ts`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: UI store (Zustand — UI only)**

```ts
// src/features/ui/shell-store.ts
import { create } from 'zustand'

type ShellState = {
  drawerOpen: boolean
  selectedTaskId: string | null
  setDrawerOpen: (open: boolean) => void
  selectTask: (id: string | null) => void
}

export const useShellStore = create<ShellState>((set) => ({
  drawerOpen: false,
  selectedTaskId: null,
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  selectTask: (selectedTaskId) => set({ selectedTaskId }),
}))
```

- [ ] **Step 2: Implement `AppShell` CSS grid**

Desktop rule (hard):

```css
.app-shell {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100dvh;
}
@media (min-width: 1024px) {
  .app-shell {
    grid-template-columns: var(--shell-sidebar) minmax(0, 1fr);
  }
  .app-shell.with-detail {
    grid-template-columns: var(--shell-sidebar) minmax(0, 1fr) var(--shell-detail);
  }
}
```

- Mobile: sidebar is off-canvas drawer; detail is bottom sheet (Task 11).
- Sidebar links: `/myday`, `/important`, `/planned`, default list `/list/[id]`, custom lists, `+` new list.
- Text colors: `var(--color-text)` only.

- [ ] **Step 3: Manual responsive check at 375 / 768 / 1280 widths**

Expected: main column widest on desktop; side rails fixed.

- [ ] **Step 4: Commit**

```bash
git add src/components/shell src/features/ui src/app/\(app\)/layout.tsx
git commit -m "feat(shell): responsive app shell with drawer and desktop grid"
```

---

### Task 10: Tasks CRUD + list pages + smart routes

**Files:**
- Create: `src/features/tasks/api.ts`
- Create: `src/features/tasks/hooks.ts`
- Create: `src/features/tasks/components/TaskRow.tsx`
- Create: `src/features/tasks/components/TaskComposer.tsx`
- Create: `src/features/tasks/components/TaskListView.tsx`
- Create: `src/app/(app)/list/[listId]/page.tsx`
- Create: `src/app/(app)/myday/page.tsx`
- Create: `src/app/(app)/important/page.tsx`
- Create: `src/app/(app)/planned/page.tsx`

- [ ] **Step 1: Tasks API**

```ts
// src/features/tasks/api.ts
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

export async function createTask(input: {
  list_id: string
  title: string
}): Promise<Task> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      list_id: input.list_id,
      title: input.title.trim(),
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Task
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<Task,
    | 'title' | 'note' | 'is_completed' | 'is_important'
    | 'my_day_on' | 'due_at' | 'remind_at' | 'recurrence' | 'list_id' | 'sort_order'
  >>
): Promise<Task> {
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
```

- [ ] **Step 2: `TaskListView` + composer; optimistic toggle complete / important via React Query**

- [ ] **Step 3: Smart pages filter `fetchAllTasks()` with `isMyDay` / `isImportant` / `isPlanned` and today’s `YYYY-MM-DD` in local timezone**

```ts
function todayLocalIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

- [ ] **Step 4: Manual test** — land on `/` → default 任务; add task; star; add to My Day; verify smart routes.

- [ ] **Step 5: Commit**

```bash
git add src/features/tasks src/app/\(app\)
git commit -m "feat(tasks): CRUD, list views, and smart list routes"
```

---

### Task 11: Task detail (desktop pane + mobile sheet)

**Files:**
- Create: `src/features/tasks/components/TaskDetailPanel.tsx`
- Create: `src/features/tasks/components/TaskDetailSheet.tsx`
- Create: `src/features/tasks/api-steps.ts`
- Modify: `src/components/shell/AppShell.tsx`

- [ ] **Step 1: Steps API**

```ts
// src/features/tasks/api-steps.ts
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
```

- [ ] **Step 2: Detail UI fields** — steps, My Day toggle, remind_at, due_at, recurrence select (`none|daily|weekly|weekdays`), note textarea, delete. Colors: `#1B1A19` on white.

- [ ] **Step 3: Hosting** — `≥1024` right column; `<1024` bottom sheet with scrim. Selecting a row sets `selectedTaskId`.

- [ ] **Step 4: Commit**

```bash
git add src/features/tasks src/components/shell
git commit -m "feat(tasks): detail panel with steps, dates, and recurrence"
```

---

### Task 12: Attachments

**Files:**
- Create: `src/features/attachments/api.ts`
- Create: `src/features/attachments/components/AttachmentList.tsx`
- Modify: `TaskDetailPanel.tsx`

- [ ] **Step 1: Attachments API** — upload to `task-attachments/{userId}/{taskId}/{uuid}-{filename}`; insert row; on failure remove storage object; max 10MB; allow `image/*`, `application/pdf`, `text/plain`.

```ts
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['image/', 'application/pdf', 'text/plain']
```

- [ ] **Step 2: Wire into detail panel (list + upload + delete)**

- [ ] **Step 3: Manual test upload/download/delete**

- [ ] **Step 4: Commit**

```bash
git add src/features/attachments
git commit -m "feat(attachments): storage upload with metadata rows"
```

---

### Task 13: List sharing

**Files:**
- Create: `src/features/sharing/api.ts`
- Create: `src/features/sharing/components/ShareListDialog.tsx`
- Create: `src/app/(app)/invites/page.tsx`

- [ ] **Step 1: Sharing API** — owner inserts `list_members` with `invited_email`, `role`, `status='pending'`; invitee accepts → set `user_id=auth.uid()`, `status='accepted'`.

- [ ] **Step 2: UI** — share dialog on custom lists (not default list unless desired); invites inbox page.

- [ ] **Step 3: Verify RLS** — second user can see shared list tasks after accept; stranger cannot.

- [ ] **Step 4: Commit**

```bash
git add src/features/sharing src/app/\(app\)/invites
git commit -m "feat(sharing): list invites with roles and accept flow"
```

---

### Task 14: Settings (locale + theme) + Realtime

**Files:**
- Create: `src/features/settings/api.ts`
- Create: `src/features/settings/components/LocaleToggle.tsx`
- Modify: `src/app/providers.tsx`
- Create: `src/features/tasks/use-tasks-realtime.ts`

- [ ] **Step 1: Persist `profiles.locale` / `theme`; LocaleToggle in sidebar footer**

- [ ] **Step 2: Realtime**

```ts
// subscribe to postgres_changes on tasks + lists; queryClient.invalidateQueries
```

- [ ] **Step 3: Expand i18n keys used in shell/tasks/auth**

- [ ] **Step 4: Commit**

```bash
git add src/features/settings src/features/tasks/use-tasks-realtime.ts src/lib/i18n src/app/providers.tsx
git commit -m "feat(settings): locale/theme persistence and realtime invalidation"
```

---

### Task 15: Remove legacy UI + verify build

**Files:**
- Delete: `src/components/TodoList.tsx`, `TodoForm.tsx`, `CategoryManager.tsx`, `src/app/auth/page.tsx`, `src/store/authStore.ts`, `src/lib/supabase.ts`, old `src/types/index.ts` if superseded
- Modify: `README.md` with setup (env vars, migration apply)

- [ ] **Step 1: Delete unused legacy files; fix imports**

- [ ] **Step 2: Run**

```bash
npm test
npm run lint
npm run build
```

Expected: all pass / build succeeds.

- [ ] **Step 3: Manual QA checklist**

- [ ] Login / signup → lands on 任务 not 我的一天  
- [ ] Mobile drawer + detail sheet  
- [ ] Desktop `220|1fr|300`, main widest, text contrast readable  
- [ ] Smart lists filter correctly  
- [ ] Steps / remind / due / recurrence  
- [ ] Attachment upload  
- [ ] Share invite accept  
- [ ] zh/en toggle  

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy todo UI and document setup"
```

---

## Spec coverage checklist

| Spec requirement | Task(s) |
|------------------|---------|
| Default home = Tasks | 8 |
| Smart lists as queries | 6, 10 |
| Schema + RLS + wipe | 3 |
| Feature modules + SSR | 4, 7–14 |
| Mobile-first + desktop grid/contrast | 2, 9, 11 |
| Steps / remind / recurrence enum | 11 |
| Attachments | 12 |
| Sharing | 13 |
| zh/en + theme | 5, 14 |
| Error handling patterns | 7, 10–13 (zod + toasts + rollback) |
| Non-goals respected | — no offline/OAuth/push tasks |

---

## Plan self-review

- Placeholders: none intentional; Task 7/9/11 UI markup left as implementable components with constraints rather than 500-line JSX dumps — API contracts are fully specified.  
- Types: `Task`, `List`, `Recurrence` consistent across tasks.  
- Gaps closed: signup trigger creates default 任务 list; storage bucket in migration.
