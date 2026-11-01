create or replace function public.save_tournament_manager_access(
  p_tournament_id uuid,
  p_assignments jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_assignment jsonb;
  v_user_id_to_assign uuid;
  v_permissions jsonb;
begin
  if v_user_id is null or not private.has_role(array['owner']::text[]) then
    raise exception 'Only the site owner can manage tournament managers' using errcode='42501';
  end if;
  if p_tournament_id is null then
    raise exception 'Tournament is required' using errcode='22023';
  end if;
  if jsonb_typeof(coalesce(p_assignments,'null'::jsonb)) <> 'array' then
    raise exception 'Assignments must be a JSON array' using errcode='22023';
  end if;
  if jsonb_array_length(p_assignments) > 2 then
    raise exception 'At most two managers may be assigned to one tournament' using errcode='22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_assignments) a
    where jsonb_typeof(a->'permissions') is distinct from 'array'
       or exists (
         select 1
         from jsonb_array_elements_text(coalesce(a->'permissions','[]'::jsonb)) p(value)
         where p.value <> all(array['registrations','groups','schedule','results']::text[])
       )
  ) then
    raise exception 'One or more section permissions are invalid' using errcode='22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_assignments) a
    group by a->>'user_id'
    having count(*) > 1
  ) then
    raise exception 'Duplicate manager assignment' using errcode='23505';
  end if;

  delete from public.tournament_manager_section_permissions where tournament_id=p_tournament_id;

  delete from public.tournament_manager_access a
  where a.tournament_id=p_tournament_id
    and not exists (
      select 1 from jsonb_array_elements(p_assignments) j
      where (j->>'user_id')::uuid=a.user_id
    );

  for v_assignment in select value from jsonb_array_elements(p_assignments) loop
    v_user_id_to_assign := (v_assignment->>'user_id')::uuid;
    v_permissions := coalesce(v_assignment->'permissions','[]'::jsonb);
    insert into public.tournament_manager_access(tournament_id,user_id,granted_by,permissions_configured)
    values(p_tournament_id,v_user_id_to_assign,v_user_id,true)
    on conflict (tournament_id,user_id)
    do update set granted_by=excluded.granted_by, permissions_configured=true;
    insert into public.tournament_manager_section_permissions(tournament_id,user_id,permission_key,granted_by)
    select p_tournament_id,v_user_id_to_assign,p.value,v_user_id
    from jsonb_array_elements_text(v_permissions) p(value);
  end loop;
end;
$function$;

revoke all on function public.save_tournament_manager_access(uuid,jsonb) from public,anon;
grant execute on function public.save_tournament_manager_access(uuid,jsonb) to authenticated,service_role;
