-- supabase/migrations/20260805000000_init.sql

-- Wipe old schema from previous app version
drop table if exists public.todos cascade;
drop table if exists public.categories cascade;

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

-- Owners manage memberships
create policy list_members_update_owner on public.list_members
  for update
  using (
    exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid())
  );

-- Members may only update status on their own membership row (not role/list_id)
-- Enforce via trigger:
create or replace function public.enforce_list_member_self_update()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.lists l where l.id = old.list_id and l.owner_id = auth.uid()) then
    return new;
  end if;
  if old.user_id is distinct from auth.uid() then
    raise exception 'not allowed';
  end if;
  if new.list_id is distinct from old.list_id or new.role is distinct from old.role or new.invited_email is distinct from old.invited_email then
    raise exception 'members can only change status';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_list_member_self_update on public.list_members;
create trigger trg_list_member_self_update
  before update on public.list_members
  for each row execute function public.enforce_list_member_self_update();

create policy list_members_update_self on public.list_members
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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
