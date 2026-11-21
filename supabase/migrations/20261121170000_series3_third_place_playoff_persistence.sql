-- Series 3: private, owner-managed persistence for the eighth-place third-place playoff.
-- This migration is intentionally committed to the feature branch only; do not apply to production without approval.

create table public.plato_land_series3_third_place_playoff (
  event_key text primary key check (event_key = 'series3'),
  player_a_registration_id uuid not null,
  player_a_plato_id text not null,
  player_a_group text not null check (player_a_group in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  player_b_registration_id uuid not null,
  player_b_plato_id text not null,
  player_b_group text not null check (player_b_group in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  result_status text not null default 'pending' check (result_status in ('pending','completed')),
  score_a integer,
  score_b integer,
  version integer not null default 1 check (version >= 1),
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint series3_third_place_playoff_distinct_players check (
    player_a_registration_id <> player_b_registration_id
    and player_a_plato_id <> player_b_plato_id
    and player_a_group <> player_b_group
  ),
  constraint series3_third_place_playoff_score_shape check (
    (result_status = 'pending' and score_a is null and score_b is null)
    or (result_status = 'completed' and score_a is not null and score_b is not null
      and score_a >= 0 and score_b >= 0 and score_a <> score_b)
  ),
  constraint plato_land_series3_third_place_playoff_player_a_fkey
    foreign key (player_a_registration_id) references public.plato_land_series3_registration_requests(id),
  constraint plato_land_series3_third_place_playoff_player_b_fkey
    foreign key (player_b_registration_id) references public.plato_land_series3_registration_requests(id),
  constraint plato_land_series3_third_place_playoff_created_by_fkey
    foreign key (created_by) references auth.users(id),
  constraint plato_land_series3_third_place_playoff_updated_by_fkey
    foreign key (updated_by) references auth.users(id)
);

create table public.plato_land_series3_third_place_playoff_history (
  history_id bigint generated always as identity primary key,
  event_key text not null check (event_key = 'series3'),
  snapshot jsonb not null,
  changed_by uuid not null,
  changed_at timestamptz not null default now(),
  change_version integer not null
);

alter table public.plato_land_series3_third_place_playoff enable row level security;
alter table public.plato_land_series3_third_place_playoff_history enable row level security;

revoke all on public.plato_land_series3_third_place_playoff from public, anon, authenticated;
revoke all on public.plato_land_series3_third_place_playoff_history from public, anon, authenticated;
grant select on public.plato_land_series3_third_place_playoff to authenticated;
grant select on public.plato_land_series3_third_place_playoff_history to authenticated;

create policy "Series 3 third-place playoff owner read"
on public.plato_land_series3_third_place_playoff for select to authenticated
using ((select private.has_role(ARRAY['owner','مالک کل']::text[])));

create policy "Series 3 third-place playoff history owner read"
on public.plato_land_series3_third_place_playoff_history for select to authenticated
using ((select private.has_role(ARRAY['owner','مالک کل']::text[])));

create or replace function public.audit_series3_third_place_playoff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    insert into public.plato_land_series3_third_place_playoff_history
      (event_key,snapshot,changed_by,change_version)
    values (old.event_key,to_jsonb(old),coalesce(auth.uid(),new.updated_by),old.version);
    new.version := old.version + 1;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
  else
    new.version := 1;
    new.created_at := now();
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger series3_third_place_playoff_audit
before insert or update on public.plato_land_series3_third_place_playoff
for each row execute function public.audit_series3_third_place_playoff();

create or replace function public.save_series3_third_place_playoff(
  p_player_a_registration_id uuid,
  p_player_a_plato_id text,
  p_player_a_group text,
  p_player_b_registration_id uuid,
  p_player_b_plato_id text,
  p_player_b_group text,
  p_result_status text,
  p_score_a integer default null,
  p_score_b integer default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_saved public.plato_land_series3_third_place_playoff%rowtype;
begin
  if v_uid is null or not private.has_role(ARRAY['owner','مالک کل']::text[]) then
    raise exception 'Only an authenticated owner may manage the Series 3 third-place playoff' using errcode='42501';
  end if;

  if p_player_a_registration_id is null or p_player_b_registration_id is null
     or p_player_a_registration_id = p_player_b_registration_id
     or nullif(trim(p_player_a_plato_id),'') is null
     or nullif(trim(p_player_b_plato_id),'') is null
     or p_player_a_plato_id = p_player_b_plato_id
     or p_player_a_group is null
     or p_player_b_group is null
     or p_player_a_group not in ('A','B','C','D','E','F','G','H','I','J','K','L')
     or p_player_b_group not in ('A','B','C','D','E','F','G','H','I','J','K','L')
     or p_player_a_group = p_player_b_group
     or p_result_status not in ('pending','completed')
     or (p_result_status = 'pending' and (p_score_a is not null or p_score_b is not null))
     or (p_result_status = 'completed' and (p_score_a is null or p_score_b is null
        or p_score_a < 0 or p_score_b < 0 or p_score_a = p_score_b)) then
    raise exception 'Invalid Series 3 third-place playoff payload';
  end if;

  if not exists (
    select 1 from public.plato_land_series3_registration_requests r
    where r.id = p_player_a_registration_id and r.plato_id = p_player_a_plato_id
  ) or not exists (
    select 1 from public.plato_land_series3_registration_requests r
    where r.id = p_player_b_registration_id and r.plato_id = p_player_b_plato_id
  ) then
    raise exception 'Playoff participants do not match registered Series 3 players';
  end if;

  -- Group labels must match the latest saved Series 3 seeding draw, not caller input.
  if not exists (
    select 1
    from public.plato_land_series3_seeding_draws d
    cross join lateral jsonb_array_elements(d.groups_snapshot) g
    cross join lateral jsonb_array_elements(g -> 'players') p
    where d.event_key = 'series3'
      and g ->> 'name' = p_player_a_group
      and p ->> 'id' = p_player_a_registration_id::text
      and p ->> 'plato_id' = p_player_a_plato_id
      and d.created_at = (
        select max(latest.created_at)
        from public.plato_land_series3_seeding_draws latest
        where latest.event_key = 'series3'
      )
  ) or not exists (
    select 1
    from public.plato_land_series3_seeding_draws d
    cross join lateral jsonb_array_elements(d.groups_snapshot) g
    cross join lateral jsonb_array_elements(g -> 'players') p
    where d.event_key = 'series3'
      and g ->> 'name' = p_player_b_group
      and p ->> 'id' = p_player_b_registration_id::text
      and p ->> 'plato_id' = p_player_b_plato_id
      and d.created_at = (
        select max(latest.created_at)
        from public.plato_land_series3_seeding_draws latest
        where latest.event_key = 'series3'
      )
  ) then
    raise exception 'Playoff participant groups do not match the latest saved Series 3 group draw';
  end if;

  insert into public.plato_land_series3_third_place_playoff
    (event_key,player_a_registration_id,player_a_plato_id,player_a_group,
     player_b_registration_id,player_b_plato_id,player_b_group,
     result_status,score_a,score_b,created_by,updated_by)
  values
    ('series3',p_player_a_registration_id,p_player_a_plato_id,p_player_a_group,
     p_player_b_registration_id,p_player_b_plato_id,p_player_b_group,
     p_result_status,p_score_a,p_score_b,v_uid,v_uid)
  on conflict (event_key) do update set
    player_a_registration_id=excluded.player_a_registration_id,
    player_a_plato_id=excluded.player_a_plato_id,
    player_a_group=excluded.player_a_group,
    player_b_registration_id=excluded.player_b_registration_id,
    player_b_plato_id=excluded.player_b_plato_id,
    player_b_group=excluded.player_b_group,
    result_status=excluded.result_status,
    score_a=excluded.score_a,
    score_b=excluded.score_b,
    updated_by=v_uid
  returning * into v_saved;

  return jsonb_build_object(
    'success',true,'event_key',v_saved.event_key,'result_status',v_saved.result_status,
    'score_a',v_saved.score_a,'score_b',v_saved.score_b,
    'version',v_saved.version,'updated_at',v_saved.updated_at,
    'winner_registration_id',case when v_saved.result_status <> 'completed' then null
      when v_saved.score_a > v_saved.score_b then v_saved.player_a_registration_id
      else v_saved.player_b_registration_id end
  );
end;
$$;

revoke all on function public.save_series3_third_place_playoff(uuid,text,text,uuid,text,text,text,integer,integer) from public, anon;
grant execute on function public.save_series3_third_place_playoff(uuid,text,text,uuid,text,text,text,integer,integer) to authenticated;
