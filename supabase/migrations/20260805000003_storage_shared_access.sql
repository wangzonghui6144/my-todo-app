-- Shared list members can read attachments via taskId path segment.
-- Path layout: {userId}/{taskId}/{uuid}-{filename}

alter table storage.objects enable row level security;

drop policy if exists task_attachments_select on storage.objects;
drop policy if exists task_attachments_insert on storage.objects;
drop policy if exists task_attachments_update on storage.objects;
drop policy if exists task_attachments_delete on storage.objects;
drop policy if exists attachment_objects_select on storage.objects;
drop policy if exists attachment_objects_insert on storage.objects;
drop policy if exists attachment_objects_update on storage.objects;
drop policy if exists attachment_objects_delete on storage.objects;

-- Any accepted list member may read objects for tasks they can access
create policy attachment_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from public.tasks t
      where t.id::text = (storage.foldername(name))[2]
        and public.is_list_member(t.list_id, auth.uid())
    )
  );

-- Upload still owned by uploader (first path segment = auth.uid)
create policy attachment_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.tasks t
      where t.id::text = (storage.foldername(name))[2]
        and public.can_edit_list(t.list_id, auth.uid())
    )
  );

create policy attachment_objects_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from public.tasks t
      where t.id::text = (storage.foldername(name))[2]
        and public.can_edit_list(t.list_id, auth.uid())
    )
  )
  with check (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from public.tasks t
      where t.id::text = (storage.foldername(name))[2]
        and public.can_edit_list(t.list_id, auth.uid())
    )
  );

-- Editors may delete storage objects for tasks they can edit
create policy attachment_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from public.tasks t
      where t.id::text = (storage.foldername(name))[2]
        and public.can_edit_list(t.list_id, auth.uid())
    )
  );
