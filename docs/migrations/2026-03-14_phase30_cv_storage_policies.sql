-- Phase 30 - CV Upload Storage RLS (cv-uploads bucket)
-- Date: 2026-03-14

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-uploads',
  'cv-uploads',
  false,
  4194304,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Folder convention: <auth.uid()>/cv/<filename>
drop policy if exists "cv_uploads_select_own_folder" on storage.objects;
create policy "cv_uploads_select_own_folder"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "cv_uploads_insert_own_folder" on storage.objects;
create policy "cv_uploads_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "cv_uploads_update_own_folder" on storage.objects;
create policy "cv_uploads_update_own_folder"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "cv_uploads_delete_own_folder" on storage.objects;
create policy "cv_uploads_delete_own_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
