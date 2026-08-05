-- Allow users to bootstrap their own profile row when signup trigger is missing.
create policy profiles_insert_own on public.profiles
  for insert
  with check (auth.uid() = id);
