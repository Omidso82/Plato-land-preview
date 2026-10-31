create or replace function public.remove_tournament_registration(p_registration_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament_id uuid;
  v_was_reserve boolean;
  v_status text;
  v_storage_path text;
  v_next_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select r.tournament_id, r.is_reserve, r.status
    into v_tournament_id, v_was_reserve, v_status
  from public.registrations r
  where r.id = p_registration_id
  for update;

  if v_tournament_id is null then
    raise exception 'Registration not found' using errcode = 'P0002';
  end if;

  if not private.can_manage_tournament(v_tournament_id) then
    raise exception 'Not authorized to remove registrations from this tournament' using errcode = '42501';
  end if;

  select e.storage_path into v_storage_path
  from public.registration_evidence e
  where e.registration_id = p_registration_id
  limit 1;

  if not v_was_reserve and v_status in ('pending', 'approved', 'registered') then
    select r.id into v_next_id
    from public.registrations r
    where r.tournament_id = v_tournament_id
      and r.is_reserve = true
      and r.status = 'pending'
      and r.id <> p_registration_id
    order by r.reserve_position nulls last, r.created_at, r.id
    limit 1
    for update;

    if v_next_id is not null then
      update public.registrations
      set is_reserve = false, reserve_position = null
      where id = v_next_id;
    end if;
  end if;

  delete from public.registrations where id = p_registration_id;
  return v_storage_path;
end;
$function$;

revoke all on function public.remove_tournament_registration(uuid) from public;
grant execute on function public.remove_tournament_registration(uuid) to authenticated, service_role;

drop policy if exists registration_evidence_delete_owner_or_admin on storage.objects;
create policy registration_evidence_delete_owner_or_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'registration-evidence'
  and (
    exists (
      select 1
      from public.registration_evidence e
      join public.registrations r on r.id = e.registration_id
      where e.storage_path = objects.name
        and (
          e.submitted_by = (select auth.uid())
          or private.can_manage_tournament(r.tournament_id)
        )
    )
    or (
      split_part(objects.name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and private.can_manage_tournament(split_part(objects.name, '/', 2)::uuid)
    )
  )
);
