-- Storage RLS: authenticated users may only access objects under their userId prefix

alter table storage.objects enable row level security;

drop policy if exists task_attachments_select on storage.objects;
drop policy if exists task_attachments_insert on storage.objects;
drop policy if exists task_attachments_update on storage.objects;
drop policy if exists task_attachments_delete on storage.objects;

create policy task_attachments_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy task_attachments_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy task_attachments_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy task_attachments_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
