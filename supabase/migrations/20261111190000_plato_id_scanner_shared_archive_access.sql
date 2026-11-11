-- Shared Scanner archive for every approved operator.
-- The bucket remains private; access is granted only to authenticated owners
-- and users whose Scanner access row is currently approved.

drop policy if exists scanner_uploads_read_owner_or_approved_self on public.plato_id_scanner_uploads;
create policy scanner_uploads_read_owner_or_approved_all
on public.plato_id_scanner_uploads
for select
to authenticated
using (
  (select private.has_role(array['owner']::text[]))
  or exists (
    select 1 from public.plato_id_scanner_access a
    where a.user_id = (select auth.uid()) and a.status = 'approved'
  )
);

drop policy if exists scanner_uploads_delete_owner_or_approved_self on public.plato_id_scanner_uploads;
create policy scanner_uploads_delete_owner_or_approved_all
on public.plato_id_scanner_uploads
for delete
to authenticated
using (
  (select private.has_role(array['owner']::text[]))
  or exists (
    select 1 from public.plato_id_scanner_access a
    where a.user_id = (select auth.uid()) and a.status = 'approved'
  )
);

drop policy if exists scanner_storage_read_owner_or_self on storage.objects;
create policy scanner_storage_read_owner_or_approved_all
on storage.objects
for select
to authenticated
using (
  bucket_id = 'plato-id-scans'
  and (
    (select private.has_role(array['owner']::text[]))
    or exists (
      select 1 from public.plato_id_scanner_access a
      where a.user_id = (select auth.uid()) and a.status = 'approved'
    )
  )
);

drop policy if exists scanner_storage_delete_owner_or_approved_self on storage.objects;
create policy scanner_storage_delete_owner_or_approved_all
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'plato-id-scans'
  and (
    (select private.has_role(array['owner']::text[]))
    or exists (
      select 1 from public.plato_id_scanner_access a
      where a.user_id = (select auth.uid()) and a.status = 'approved'
    )
  )
);
