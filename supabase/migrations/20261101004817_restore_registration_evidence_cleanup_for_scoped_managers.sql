drop policy if exists registration_evidence_delete_owner_or_admin on storage.objects;
create policy registration_evidence_delete_owner_or_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id='registration-evidence'
  and (
    exists (
      select 1
      from public.registration_evidence e
      join public.registrations r on r.id=e.registration_id
      where e.storage_path=objects.name
        and (
          e.submitted_by=(select auth.uid())
          or private.can_manage_tournament_section(r.tournament_id,'registrations')
        )
    )
    or (
      split_part(objects.name,'/',2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and private.can_manage_tournament_section(split_part(objects.name,'/',2)::uuid,'registrations')
    )
  )
);
