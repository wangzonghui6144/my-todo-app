-- Allow invitees to see and accept/decline pending memberships where user_id is NULL

drop policy if exists list_members_select_invitee on public.list_members;
create policy list_members_select_invitee on public.list_members
  for select
  using (
    status = 'pending'
    and lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

drop policy if exists list_members_update_invitee on public.list_members;
create policy list_members_update_invitee on public.list_members
  for update
  using (
    status = 'pending'
    and user_id is null
    and lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  )
  with check (
    user_id = auth.uid()
    and status in ('accepted', 'declined')
    and lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

create or replace function public.enforce_list_member_self_update()
returns trigger
language plpgsql
as $$
begin
  -- List owners may update freely
  if exists (select 1 from public.lists l where l.id = old.list_id and l.owner_id = auth.uid()) then
    return new;
  end if;

  -- Invite accept/decline: pending row with null user_id, email matches JWT
  if old.status = 'pending'
     and old.user_id is null
     and lower(old.invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  then
    if new.list_id is distinct from old.list_id
       or new.role is distinct from old.role
       or new.invited_email is distinct from old.invited_email
    then
      raise exception 'invitees can only accept or decline';
    end if;
    if new.user_id is distinct from auth.uid() then
      raise exception 'invitee must set user_id to auth.uid()';
    end if;
    if new.status not in ('accepted', 'declined') then
      raise exception 'invitee must set status to accepted or declined';
    end if;
    return new;
  end if;

  -- Existing accepted members may only change status on their own row
  if old.user_id is distinct from auth.uid() then
    raise exception 'not allowed';
  end if;
  if new.list_id is distinct from old.list_id
     or new.role is distinct from old.role
     or new.invited_email is distinct from old.invited_email
     or new.user_id is distinct from old.user_id
  then
    raise exception 'members can only change status';
  end if;
  return new;
end;
$$;
