# To Do

Microsoft To Do–style task manager built with Next.js App Router, Supabase (Auth, Postgres, Storage, Realtime), React Query, and Tailwind CSS.

## Setup

### 1. Environment variables

Copy the example values into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 2. Apply database migrations

Migrations live in `supabase/migrations/`:

- `20260805000000_init.sql` — schema, RLS, signup trigger, attachments bucket
- `20260805000001_storage_policies.sql` — storage RLS for `task-attachments`
- `20260805000002_invite_accept.sql` — invite accept/decline for pending members
- `20260805000003_storage_shared_access.sql` — shared-list attachment reads
- `20260805000004_profiles_insert.sql` — allow users to create their own profile row

With the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project:

```bash
supabase db push
```

Or run each SQL file in the Supabase SQL editor (in filename order).

Also enable Realtime for `tasks`, `lists`, and `list_members` in the Supabase dashboard if not already enabled.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

## Deploy

This app uses Next.js middleware and Supabase SSR cookies, so it needs a Node.js host. **GitHub Pages is not supported.**

### Vercel (recommended)

1. Import `wangzonghui6144/my-todo-app` in [Vercel](https://vercel.com/new)
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy from `master` — subsequent pushes auto-deploy

CI on GitHub Actions only runs `test` + `build` (see `.github/workflows/ci.yml`).

## Features

- Default home: Tasks list (任务)
- Smart lists: My Day, Important, Planned
- Custom lists with optional email sharing (editor/viewer)
- Task detail: steps, notes, My Day, remind/due, recurrence, attachments
- zh/en locale and light/dark theme persisted on `profiles`
- Realtime invalidation for tasks/lists membership changes
