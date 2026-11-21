-- Series 3: owner-only atomic replacement with immutable archive.
create table public.plato_land_series3_knockout_draw_history (
  archive_id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  event_key text not null check (event_key = 'series3'),
  entrants_snapshot jsonb not null,
  bracket_snapshot jsonb not null,
  draw_fingerprint text not null,
  created_by uuid not null,
  created_at timestamptz not null,
  archived_by uuid not null,
  archived_at timestamptz not null default now(),
  archive_reason text not null
);

alter table public.plato_land_series3_knockout_draw_history enable row level security;
revoke all on public.plato_land_series3_knockout_draw_history from public, anon, authenticated;
grant select on public.plato_land_series3_knockout_draw_history to authenticated;
create policy "Series 3 knockout history owner read"
on public.plato_land_series3_knockout_draw_history for select to authenticated
using ((select private.has_role(ARRAY['owner','مالک کل']::text[])));

create or replace function public.replace_series3_knockout_draw(
  p_entrants_snapshot jsonb,
  p_bracket_snapshot jsonb,
  p_draw_fingerprint text,
  p_archive_reason text default 'Replacement of invalid same-group knockout draw'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.plato_land_series3_knockout_draws%rowtype;
  v_new_id uuid;
  v_matches jsonb;
  v_tokens jsonb;
begin
  if v_uid is null or not private.has_role(ARRAY['owner','مالک کل']::text[]) then
    raise exception 'Only an authenticated owner may replace the Series 3 knockout draw' using errcode='42501';
  end if;
  if jsonb_typeof(p_entrants_snapshot) <> 'array'
     or jsonb_array_length(p_entrants_snapshot) <> 32
     or jsonb_typeof(p_bracket_snapshot) <> 'object'
     or jsonb_typeof(p_bracket_snapshot->'tokens') <> 'array'
     or jsonb_array_length(p_bracket_snapshot->'tokens') <> 32
     or jsonb_typeof(p_bracket_snapshot->'round32') <> 'array'
     or jsonb_array_length(p_bracket_snapshot->'round32') <> 16
     or p_draw_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid Series 3 bracket payload';
  end if;

  v_tokens := p_bracket_snapshot->'tokens';
  v_matches := p_bracket_snapshot->'round32';

  if (select count(distinct x->>'id') from jsonb_array_elements(v_tokens) x) <> 32
     or (select count(*) from jsonb_array_elements(v_tokens) x where nullif(x->>'id','') is null) <> 0
     or (select count(*) from jsonb_array_elements(v_tokens) x where x->>'source' = 'third') <> 8
     or (select count(distinct x->>'id') from jsonb_array_elements(p_entrants_snapshot) x) <> 32 then
    raise exception 'Bracket entrants must contain 32 unique tokens and exactly 8 third-place placeholders';
  end if;

  -- Validate slot cardinality and uniqueness separately: EXCEPT compares sets
  -- and by itself would not detect a duplicated slot replacing a missing entrant.
  if (select count(*) from jsonb_array_elements(v_matches) m,
       lateral (values (m->'a'),(m->'b')) t(token)) <> 32
     or (select count(distinct t.token->>'id') from jsonb_array_elements(v_matches) m,
       lateral (values (m->'a'),(m->'b')) t(token)) <> 32
     or (select count(*) from jsonb_array_elements(v_matches) m,
       lateral (values (m->'a'),(m->'b')) t(token)
       where nullif(t.token->>'id','') is null) <> 0
     or (select count(distinct m->>'id') from jsonb_array_elements(v_matches) m) <> 16
     or (select count(*) from jsonb_array_elements(v_matches) m
       where nullif(m->>'id','') is null) <> 0 then
    raise exception 'Round of 32 must contain 16 uniquely identified matches and 32 unique entrant slots';
  end if;

  -- Slot token objects must match the authoritative token registry, not merely
  -- reuse a registered ID with altered source/group metadata.
  if exists (
    select 1
    from jsonb_array_elements(v_matches) m,
         lateral (values (m->'a'),(m->'b')) t(token)
    where not exists (
      select 1 from jsonb_array_elements(v_tokens) registered
      where registered->>'id' = t.token->>'id'
        and registered = t.token
    )
  ) then
    raise exception 'Round of 32 slot metadata differs from the registered entrant token';
  end if;

  -- The entrants snapshot, token registry, and actual R32 slots must be the same set.
  if exists (
    select 1
    from (
      (select x->>'id' as id from jsonb_array_elements(p_entrants_snapshot) x
       except
       select x->>'id' from jsonb_array_elements(v_tokens) x)
      union all
      (select x->>'id' from jsonb_array_elements(v_tokens) x
       except
       select x->>'id' from jsonb_array_elements(p_entrants_snapshot) x)
    ) mismatch
  ) then
    raise exception 'Entrants snapshot and bracket token registry do not match';
  end if;

  if exists (
    select 1
    from (
      (select t.token->>'id' as id
       from jsonb_array_elements(v_matches) m,
            lateral (values (m->'a'),(m->'b')) t(token)
       except
       select x->>'id' from jsonb_array_elements(v_tokens) x)
      union all
      (select x->>'id' from jsonb_array_elements(v_tokens) x
       except
       select t.token->>'id'
       from jsonb_array_elements(v_matches) m,
            lateral (values (m->'a'),(m->'b')) t(token))
    ) mismatch
  ) then
    raise exception 'Round of 32 slots do not contain exactly the registered 32 entrants';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_tokens) x
    where nullif(x->>'source','') is null
       or x->>'source' not in ('first','second','third')
       or (x->>'source' in ('first','second') and nullif(x->>'group','') is null)
       or (x->>'source' = 'third' and nullif(x->>'id','') is null)
  ) then
    raise exception 'Entrant token source or group metadata is invalid';
  end if;

  -- Third-place entries must be either all unresolved placeholders or all
  -- resolved qualifiers carrying their actual group.
  if (
    select count(*) from jsonb_array_elements(v_tokens) x
    where x->>'source' = 'third' and nullif(x->>'group','') is not null
  ) not in (0, 8) then
    raise exception 'Third-place qualifiers must be resolved as a complete set of eight';
  end if;

  if (
    select count(distinct x->>'group') from jsonb_array_elements(v_tokens) x
    where x->>'source' = 'third' and nullif(x->>'group','') is not null
  ) not in (0, 8) then
    raise exception 'Resolved third-place qualifiers must come from eight distinct groups';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_matches) m
    where jsonb_typeof(m) <> 'object'
       or jsonb_typeof(m->'a') <> 'object'
       or jsonb_typeof(m->'b') <> 'object'
       or nullif(m->'a'->>'id','') is null
       or nullif(m->'b'->>'id','') is null
       or m->'a'->>'id' = m->'b'->>'id'
       or (nullif(m->'a'->>'group','') is not null and m->'a'->>'group' = m->'b'->>'group')
       or ((m->'a'->>'source' = 'third') = (m->'b'->>'source' = 'third'))
  ) then
    raise exception 'Round of 32 contains an invalid or same-group pairing';
  end if;

  if (select count(*) from jsonb_array_elements(v_matches) m,
       lateral (values (m->'a'),(m->'b')) t(token)
       where t.token->>'source' = 'third') <> 8 then
    raise exception 'Each of the eight Round of 32 matches must contain one third-place placeholder';
  end if;

  select * into v_old
  from public.plato_land_series3_knockout_draws
  where event_key='series3'
  for update;

  if found then
    insert into public.plato_land_series3_knockout_draw_history
      (source_id,event_key,entrants_snapshot,bracket_snapshot,draw_fingerprint,created_by,created_at,archived_by,archive_reason)
    values
      (v_old.id,v_old.event_key,v_old.entrants_snapshot,v_old.bracket_snapshot,v_old.draw_fingerprint,
       v_old.created_by,v_old.created_at,v_uid,coalesce(nullif(p_archive_reason,''),'Series 3 knockout draw replaced'));
    update public.plato_land_series3_knockout_draws
      set entrants_snapshot=p_entrants_snapshot,
          bracket_snapshot=p_bracket_snapshot,
          draw_fingerprint=p_draw_fingerprint,
          created_by=v_uid,
          created_at=now()
      where id=v_old.id
      returning id into v_new_id;
  else
    insert into public.plato_land_series3_knockout_draws
      (event_key,entrants_snapshot,bracket_snapshot,draw_fingerprint,created_by)
    values ('series3',p_entrants_snapshot,p_bracket_snapshot,p_draw_fingerprint,v_uid)
    returning id into v_new_id;
  end if;

  return jsonb_build_object('success',true,'active_id',v_new_id,'archived_id',case when v_old.id is null then null else v_old.id end);
end;
$$;

revoke all on function public.replace_series3_knockout_draw(jsonb,jsonb,text,text) from public, anon;
grant execute on function public.replace_series3_knockout_draw(jsonb,jsonb,text,text) to authenticated;
