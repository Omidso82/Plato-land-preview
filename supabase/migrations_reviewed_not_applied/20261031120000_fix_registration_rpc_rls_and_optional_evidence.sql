-- Fix registration RPC row locking under RLS and support optional profile screenshots.
-- Keep SECURITY INVOKER and serialize concurrent registrations with a transaction advisory lock.
do $migration$
declare
  v_definition text;
  v_original text := E'  select * into v_tournament from public.tournaments where id=p_tournament_id for update;';
  v_replacement text := E'  -- Serialize registrations per tournament without requiring UPDATE access to the tournament row.\n  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_tournament_id::text, 0));\n\n  select * into v_tournament from public.tournaments where id=p_tournament_id;';
begin
  select pg_get_functiondef('public.submit_tournament_registration(uuid,text,jsonb,text,text,text,text,text,jsonb)'::regprocedure)
    into v_definition;

  if position('pg_advisory_xact_lock' in v_definition) = 0 then
    if position(v_original in v_definition) = 0 then
      raise exception 'Expected tournament row-lock block was not found; aborting migration.';
    end if;
    v_definition := replace(v_definition, v_original, v_replacement);
    execute v_definition;
  end if;
end;
$migration$;

drop policy if exists registrations_insert on public.registrations;
create policy registrations_insert
on public.registrations
for insert
to authenticated
with check (
  player_id = (select auth.uid())
  and rules_accepted_at is not null
  and (
    evidence_path is null
    or (
      (storage.foldername(evidence_path))[1] = ((select auth.uid()))::text
      and exists (
        select 1
        from storage.objects o
        where o.bucket_id = 'registration-evidence'
          and o.name = registrations.evidence_path
      )
    )
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and not private.is_banned(p.plato_id, registrations.tournament_id)
  )
  and exists (
    select 1
    from public.tournaments t
    where t.id = registrations.tournament_id
      and t.status = 'published'
      and t.registration_open = true
      and (t.registration_starts_at is null or t.registration_starts_at <= now())
      and (t.registration_ends_at is null or t.registration_ends_at > now())
      and (
        registrations.evidence_path is not null
        or coalesce((t.platform_settings->>'require_profile_screenshot')::boolean, true) = false
      )
  )
);
