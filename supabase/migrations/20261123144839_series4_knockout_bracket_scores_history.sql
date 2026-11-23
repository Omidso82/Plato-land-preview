-- Draft only. Apply with explicit owner approval.
begin;
create table public.plato_land_series4_knockout_draw (
  singleton boolean primary key default true check (singleton),
  bracket jsonb not null check (
    jsonb_typeof(bracket->'firstRound') is not distinct from 'array'
    and jsonb_array_length(bracket->'firstRound') in (8,16)
    and jsonb_typeof(bracket->'laterRounds') is not distinct from 'array'
    and jsonb_typeof(bracket->'thirdPlace') is not distinct from 'object'
  ),
  group_versions jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);
alter table public.plato_land_series4_knockout_draw enable row level security;
revoke all on public.plato_land_series4_knockout_draw from public,anon,authenticated;
grant select on public.plato_land_series4_knockout_draw to authenticated;
create policy "Series 4 knockout draw owner read"
on public.plato_land_series4_knockout_draw for select to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));
create table public.plato_land_series4_knockout_scores (
  match_id text primary key,
  score_a integer not null,
  score_b integer not null,
  version integer not null default 1,
  check (least(score_a,score_b) between 0 and 4 and greatest(score_a,score_b)=5)
);
create table public.plato_land_series4_knockout_score_history (
  match_id text not null,
  version integer not null,
  score_a integer not null,
  score_b integer not null,
  saved_at timestamptz not null default now(),
  saved_by uuid not null references auth.users(id),
  primary key(match_id,version)
);
alter table public.plato_land_series4_knockout_scores enable row level security;
alter table public.plato_land_series4_knockout_score_history enable row level security;
revoke all on public.plato_land_series4_knockout_scores,public.plato_land_series4_knockout_score_history from public,anon,authenticated;
grant select on public.plato_land_series4_knockout_scores,public.plato_land_series4_knockout_score_history to authenticated;
create policy "Series 4 owner reads knockout scores" on public.plato_land_series4_knockout_scores for select to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));
create policy "Series 4 owner reads knockout history" on public.plato_land_series4_knockout_score_history for select to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));

create function public.series4_owner_save_knockout(p_bracket jsonb,p_group_versions jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare
  match_count integer;
  current_versions jsonb;
  entrant_count integer;
begin
  perform public.series4_assert_registration_owner();
  lock table public.plato_land_series4_group_match_results in share mode;
  select count(*), jsonb_object_agg(match_id,version) into match_count,current_versions
    from public.plato_land_series4_group_match_results where result_status<>'pending';
  if match_count not in (48,72) or current_versions is distinct from p_group_versions
     or exists(select 1 from public.plato_land_series4_group_match_results where result_status='pending') then
    raise exception 'Group results are incomplete or have changed';
  end if;
  entrant_count := case when match_count=48 then 16 else 32 end;
  if jsonb_array_length(p_bracket->'firstRound') is distinct from entrant_count/2
     or (select count(distinct entrant->>'plato_id')
         from jsonb_array_elements(p_bracket->'firstRound') m
         cross join lateral (values (m->'a'),(m->'b')) as entries(entrant)
         join public.plato_land_series4_registration_requests r on r.plato_id=entrant->>'plato_id' and r.registration_status='main')
         <> entrant_count then
    raise exception 'Invalid knockout entrants';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_bracket->'firstRound') with ordinality as matches(item, position)
    where item->>'id' is distinct from format('R%s-%s',entrant_count,position)
       or item->'a'->>'group' is null
       or item->'b'->>'group' is null
       or item->'a'->>'group'=item->'b'->>'group'
  ) or jsonb_array_length(p_bracket->'laterRounds') is distinct from
      (case when entrant_count=16 then 3 else 4 end)
  or exists (
    select 1 from jsonb_array_elements(p_bracket->'laterRounds') with ordinality stages(stage, round_index)
    cross join lateral (select entrant_count / (1 << round_index::integer) as slots) sizes
    where jsonb_array_length(stage) is distinct from slots/2
      or exists (
        select 1 from jsonb_array_elements(stage) with ordinality as matches(item, position)
        where item->>'id' is distinct from format('R%s-%s',slots,position)
           or item->>'fromA' is distinct from format('R%s-%s',slots*2,position*2-1)
           or item->>'fromB' is distinct from format('R%s-%s',slots*2,position*2)
      )
  ) or p_bracket->'thirdPlace' is distinct from
    jsonb_build_object('id','THIRD-1','fromA','R4-1','fromB','R4-2') then
    raise exception 'Invalid knockout match structure';
  end if;
  insert into public.plato_land_series4_knockout_draw(bracket,group_versions,created_by)
  values(p_bracket,current_versions,auth.uid());
end;
$$;

create function public.series4_owner_score_knockout(p_match_id text,p_score_a integer,p_score_b integer,p_version integer)
returns integer language plpgsql security definer set search_path='' as $$
declare
  draw public.plato_land_series4_knockout_draw%rowtype;
  previous public.plato_land_series4_knockout_scores%rowtype;
  match jsonb;
  next_version integer;
begin
  perform public.series4_assert_registration_owner();
  select * into strict draw from public.plato_land_series4_knockout_draw where singleton for update;
  lock table public.plato_land_series4_group_match_results in share mode;
  if draw.group_versions is distinct from (
    select jsonb_object_agg(match_id,version) from public.plato_land_series4_group_match_results
  ) then raise exception 'Group results changed after the knockout draw'; end if;

  select item into match
  from jsonb_array_elements(draw.bracket->'firstRound') item where item->>'id'=p_match_id;
  if not found then
    select item into match from (
      select jsonb_array_elements(stage) as item from jsonb_array_elements(draw.bracket->'laterRounds') stage
      union all select draw.bracket->'thirdPlace'
    ) m where item->>'id'=p_match_id;
    if not found or (select count(*) from public.plato_land_series4_knockout_scores
      where match_id in (match->>'fromA',match->>'fromB'))<>2 then
      raise exception 'Both preceding matches must be scored';
    end if;
  end if;
  select * into previous from public.plato_land_series4_knockout_scores where match_id=p_match_id;
  if p_version is distinct from coalesce(previous.version,0) then raise exception 'Score version changed'; end if;
  if previous.version is not null and (previous.score_a>previous.score_b) <> (p_score_a>p_score_b)
     and exists (
       select 1 from (
         select jsonb_array_elements(stage) as item from jsonb_array_elements(draw.bracket->'laterRounds') stage
         union all select draw.bracket->'thirdPlace'
       ) m join public.plato_land_series4_knockout_scores s on s.match_id=item->>'id'
       where p_match_id in (item->>'fromA',item->>'fromB')
     ) then raise exception 'A downstream result already depends on this winner'; end if;

  next_version := coalesce(previous.version,0)+1;
  insert into public.plato_land_series4_knockout_scores(match_id,score_a,score_b,version)
  values(p_match_id,p_score_a,p_score_b,next_version)
  on conflict(match_id) do update set score_a=excluded.score_a,score_b=excluded.score_b,version=excluded.version;
  insert into public.plato_land_series4_knockout_score_history(match_id,version,score_a,score_b,saved_by)
  values(p_match_id,next_version,p_score_a,p_score_b,auth.uid());
  return next_version;
end;
$$;
revoke all on function public.series4_owner_save_knockout(jsonb,jsonb),public.series4_owner_score_knockout(text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.series4_owner_save_knockout(jsonb,jsonb),public.series4_owner_score_knockout(text,integer,integer,integer) to authenticated;
commit;
