grant delete on table public.plato_id_scanner_uploads to authenticated;

drop policy if exists scanner_uploads_delete_owner_or_approved_self on public.plato_id_scanner_uploads;
create policy scanner_uploads_delete_owner_or_approved_self
on public.plato_id_scanner_uploads
for delete
to authenticated
using (
  (select private.has_role(array['owner']::text[]))
  or (
    operator_id = (select auth.uid())
    and exists (
      select 1 from public.plato_id_scanner_access a
      where a.user_id = (select auth.uid())
        and a.status = 'approved'
    )
  )
);

drop policy if exists scanner_storage_delete_orphan_self_or_owner on storage.objects;
create policy scanner_storage_delete_owner_or_approved_self
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'plato-id-scans'
  and (
    (select private.has_role(array['owner']::text[]))
    or (
      (storage.foldername(name))[1] = (select auth.uid())::text
      and exists (
        select 1 from public.plato_id_scanner_access a
        where a.user_id = (select auth.uid())
          and a.status = 'approved'
      )
      and exists (
        select 1 from public.plato_id_scanner_uploads u
        where u.storage_path = objects.name
          and u.operator_id = (select auth.uid())
      )
    )
  )
);