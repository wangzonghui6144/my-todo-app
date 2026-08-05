# Microsoft To Do–Aligned Todo App Redesign

**Date:** 2026-08-05  
**Status:** Approved for planning (pending user review of this spec)  
**Stack:** Next.js App Router · Supabase (Auth, Postgres, Storage, Realtime) · React Query · Zustand (UI only)

## 1. Goals

Rebuild the legacy `my-todo-app` into a Microsoft To Do–parity product with a clean architecture.

- **Product:** Near-complete To Do feature set (scope C): smart lists, custom lists, steps, notes, reminders, recurrence, attachments, list sharing, themes, zh/en.
- **Backend:** Keep Supabase, but redesign schema, RLS, migrations, and data-access boundaries.
- **UI:** Fluent-inspired, high-fidelity layout; **mobile-first** with a polished **responsive desktop** three-column shell.
- **Data:** Wipe existing tables; no migration of old todos/categories.
- **Auth:** Email + password only (strengthen session + route protection).

### Non-goals (this cycle)

- Offline-first sync engine
- OS/browser push notifications (in-app reminder display only)
- Microsoft / third-party OAuth
- Widgets, voice input

## 2. Information architecture & layout

### 2.1 Navigation

| Entry | Type | Behavior |
|-------|------|----------|
| 任务 (Tasks / 待办) | Default list | Created per user on signup; **app default home** |
| 我的一天 (My Day) | Smart view | Filter on `tasks.my_day_on = current date` |
| 重要 (Important) | Smart view | Filter on `is_important` |
| 已计划 (Planned) | Smart view | Filter on `due_at` and/or `remind_at` |
| Custom lists | Stored lists | CRUD + optional sharing |

**Default route:** `/` redirects to the user’s default **Tasks** list — **not** My Day.

### 2.2 Responsive shell

| Breakpoint | Layout |
|------------|--------|
| `< 768px` | Single column; list drawer (☰); task detail = bottom sheet |
| `768–1023px` | Collapsible sidebar + main list; detail = sheet/overlay |
| `≥ 1024px` | Three columns: sidebar + **main (widest)** + detail |

**Desktop grid (hard constraint):** `220px | 1fr | 300px`  
At `≥ 1280px` side rails may grow slightly (`240 | 1fr | 320`) but **main always consumes remaining width**.  
When no task is selected, collapse the detail column (`220px | 1fr`).

### 2.3 Visual system

- **Fonts:** Segoe UI Variable / Segoe UI + PingFang SC / Noto Sans SC  
- **Accent:** `#0B5CAB`  
- **Surfaces:** white cards; page background `#EEF3F8`  
- **My Day header:** deep → bright blue gradient (not purple)  
- **Text contrast (hard constraint):** primary `#1B1A19`; secondary `#323130` / `#605E5C`; **no light-gray-on-white body text**; target contrast ≥ 4.5:1  
- **i18n:** zh / en toggle persisted on `profiles.locale`  
- **Theme:** light Fluent base + per-list accent; optional theme preference on profile

## 3. Data model

Tasks **are** persisted and bound to users. Smart lists are **query views**, not tables.

### 3.1 Tables

**`profiles`** (1:1 `auth.users`)

- `id` (PK, FK → auth.users)  
- `display_name`  
- `locale` (`zh` | `en`)  
- `theme`  
- `created_at`, `updated_at`

**`lists`**

- `id`, `owner_id` (FK profiles)  
- `name`, `color`, `icon`, `sort_order`  
- `is_default` (boolean — the Tasks/待办 list)  
- `created_at`, `updated_at`

**`list_members`** (sharing)

- `id`, `list_id`, `user_id` (nullable until accepted)  
- `invited_email`, `role` (`owner` | `editor` | `viewer`)  
- `status` (`pending` | `accepted` | `declined`)  
- `created_at`, `updated_at`

**`tasks`**

- `id`, `user_id` (creator), `list_id`  
- `title`, `note`  
- `is_completed`, `completed_at`  
- `is_important`  
- `my_day_on` (date | null) — persistence for My Day  
- `due_at`, `remind_at`  
- `recurrence` (text; basic RRULE or enum: none/daily/weekly/weekdays)  
- `sort_order`  
- `created_at`, `updated_at`

**`task_steps`**

- `id`, `task_id`, `title`, `is_completed`, `sort_order`

**`attachments`**

- `id`, `task_id`, `storage_path`, `file_name`, `mime_type`, `size_bytes`, `created_at`

### 3.2 Smart list queries (not tables)

- **My Day:** `my_day_on = CURRENT_DATE` (and visible via RLS)  
- **Important:** `is_important = true`  
- **Planned:** `due_at IS NOT NULL OR remind_at IS NOT NULL`  
- **Tasks:** `list_id = user’s default list`

Adding to My Day updates `my_day_on`; the row remains on its list. Overnight behavior: only rows with today’s date appear in My Day.

### 3.3 Security & storage

- Enable **RLS** on all tables: owner and accepted `list_members` by role.  
- Attachments in Storage bucket `task-attachments`, path scoped by `user_id` / `task_id`.  
- Schema only via **`supabase/migrations`**.  
- On signup (trigger or server action): create `profiles` + default `lists` row (`is_default`, name 任务/Tasks).

## 4. Application architecture

### 4.1 Approach

**Feature modules + Supabase SSR** (chosen over BFF-everything or client-only rewrite).

```
UI → feature hooks / server actions → lib/supabase (browser|server|middleware) → Postgres + RLS + Storage
                                                                      ↳ Realtime invalidates React Query
```

### 4.2 Directory layout

```
src/
  app/
    (auth)/login/
    (app)/                 # authenticated shell
      page.tsx             # redirect → default Tasks list
      myday|important|planned/
      list/[listId]/
  components/ui/
  features/
    auth|lists|tasks|sharing|attachments|settings/
  lib/
    supabase/              # client, server, middleware helpers
    i18n/
  types/
supabase/
  migrations/
  seed.sql
```

### 4.3 State & data access

- **Middleware** + `@supabase/ssr` cookies; unauthenticated → `/login`.  
- **Zustand:** UI only (selected task id, drawer open, detail open, theme class).  
- **React Query:** server data, optimistic updates, limited retries; Realtime patches/invalidates.  
- **Rule:** no `supabase.from(...)` inside page components — only inside `features/*/api` (or hooks).

## 5. Feature scope (P0)

1. Email/password auth; session guard; default Tasks list  
2. Smart lists + custom list CRUD  
3. Tasks: create/edit/delete, complete, important, My Day, due, notes, sort  
4. Steps; reminders; basic recurrence (daily / weekly / weekdays)  
5. Attachments upload/download/delete  
6. List sharing: email invite, roles, accept/decline  
7. zh/en; Fluent light + list accent  
8. Mobile-first + desktop responsive shell per §2  

## 6. Error handling

- Forms: zod field errors + i18n toast/banner  
- Mutations: optimistic UI with rollback on failure; bounded React Query retries  
- RLS denial: friendly “no access” empty state; no raw Postgres errors in UI  
- Attachments: mime/size limits; failed uploads must not leave orphan DB rows  
- Share links: clear invalid/expired messaging  

## 7. Testing strategy

- Unit: recurrence helpers, smart-list filter predicates, i18n keys  
- Integration: RLS policies (owner vs member vs stranger) via SQL or supabase tests  
- UI smoke: auth gate, default Tasks landing, create task, open detail (mobile sheet + desktop pane)  
- Manual: responsive breakpoints and contrast checks against §2.3  

## 8. Decisions log

| Topic | Decision |
|-------|----------|
| Scope | Near-complete To Do (C) |
| Backend | Supabase, redesigned |
| Locale | zh + en |
| Visual | Fluent-aligned, high fidelity |
| Old data | Wipe / no migrate |
| Auth | Email + password |
| Architecture | Feature modules + SSR |
| Default home | **Tasks (待办)**, not My Day |
| Smart lists | Query views; fields on `tasks` |
| Desktop grid | Main column widest; high text contrast |

## 9. Open follow-ups (resolved enough to plan)

None blocking. Recurrence storage format (RRULE string vs enum) to be fixed in the implementation plan with a single choice.
